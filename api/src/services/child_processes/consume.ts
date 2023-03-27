import {Channel, Connection, ConsumeMessage, Replies} from 'amqplib';
import {isEmpty} from 'lodash';
import process from 'process';

import {RabbitmqConfig} from '../../config';
import {EVENT_MESSAGE, IMessage, Logger, UPDATE_MODE} from '../../utils';
import {connect, createChannel} from './connect';

export class ConsumeProcess {
  private connection: Connection;

  private channel: Channel;

  private rabbitmqConfig: RabbitmqConfig = new RabbitmqConfig();

  private hashMapConsumerEnterprise: {[key: string]: string} = {};

  constructor() {}

  /**
   * Main function
   */
  async start() {
    try {
      this.connection = await connect();
      this.channel = await createChannel(this.connection);

      if (this.connection && this.channel) {
        process.send!({type: EVENT_MESSAGE.READY});

        // Handle message reception from parent
        process.on('message', async (message: IMessage) => {
          Logger.info(ConsumeProcess.name, this.start.name, 'Message from parent', message);
          if (message.type === EVENT_MESSAGE.UPDATE) {
            await this.bulkCancelConsumer(message.data[UPDATE_MODE.DELETE]);
            await this.bulkAddConsumer(message.data[UPDATE_MODE.ADD]);
          }
          if (message.type === EVENT_MESSAGE.ACK) {
            this.channel.ack(message.data);
          }
        });

        this.addConnectionErrorListeners();
        this.addChannelErrorListeners();
      }
    } catch (err) {
      Logger.error(ConsumeProcess.name, this.start.name, 'Error', err);
      await this.retryConnection();
    }
  }

  /**
   * Add listener for errors on connection
   */
  private addConnectionErrorListeners(): void {
    this.connection.on('error', (err: any) => {
      Logger.error(ConsumeProcess.name, this.addConnectionErrorListeners.name, 'Error', err);
    });

    this.connection.on('exit', async (code: number) => {
      Logger.error(ConsumeProcess.name, this.addConnectionErrorListeners.name, 'Exited with code', code);
      await this.retryConnection();
    });

    this.connection.on('close', async (err: any) => {
      Logger.error(ConsumeProcess.name, this.addConnectionErrorListeners.name, 'Closed', err);
      await this.retryConnection();
    });
  }

  /**
   * Add listener for errors on channel
   */
  private addChannelErrorListeners(): void {
    this.channel.on('error', async (err: any) => {
      Logger.error(ConsumeProcess.name, this.addChannelErrorListeners.name, 'Error', err);
      await this.retryChannel();
    });

    this.channel.on('exit', async (code: number) => {
      Logger.error(ConsumeProcess.name, this.addChannelErrorListeners.name, 'Exited with code', code);
      await this.retryChannel();
    });

    this.channel.on('close', (err: any) => {
      Logger.error(ConsumeProcess.name, this.addChannelErrorListeners.name, 'Closed', err);
    });
  }

  /**
   * Create added HRIS enterprises
   * Check if queue exists before creating consumer
   */
  private async bulkAddConsumer(enterpriseNameList: string[]): Promise<void> {
    await Promise.all(
      enterpriseNameList.map(async (enterpriseName: string) => {
        if (await this.checkExistingQueue(enterpriseName)) {
          // Create consumer
          const consumer: Replies.Consume = await this.channel.consume(
            this.rabbitmqConfig.getConsumerQueue(enterpriseName),
            (msg: ConsumeMessage | null) => {
              Logger.info(
                ConsumeProcess.name,
                this.bulkAddConsumer.name,
                'RabbitMQ Consumer received message from',
                this.rabbitmqConfig.getConsumerQueue(enterpriseName),
              );
              process.send!({
                type: EVENT_MESSAGE.CONSUME,
                data: msg,
              });
            },
          );
          // HashMap object allow us to store consumerTag for the created consumer of the enterprise
          Object.assign(this.hashMapConsumerEnterprise, {
            [enterpriseName]: consumer.consumerTag,
          });
          Logger.info(
            ConsumeProcess.name,
            this.bulkAddConsumer.name,
            'RabbitMQ Consumer created',
            consumer.consumerTag,
          );
        }
      }),
    ).catch(err => {
      Logger.error(ConsumeProcess.name, this.bulkAddConsumer.name, 'Error', err);
    });
  }

  /**
   * Cancel deleted HRIS enterprises
   * It will not kill the consumer and latest messages can still be ACK
   */
  private async bulkCancelConsumer(enterpriseNameList: string[]): Promise<void> {
    await Promise.all(
      enterpriseNameList.map(async (enterpriseName: string) => {
        const consumerTag: string = this.hashMapConsumerEnterprise[enterpriseName];
        if (await this.checkExistingQueue(enterpriseName)) {
          await this.channel.cancel(consumerTag);
          delete this.hashMapConsumerEnterprise[enterpriseName];
          Logger.info(
            ConsumeProcess.name,
            this.bulkCancelConsumer.name,
            'RabbitMQ Consumer canceled',
            consumerTag,
          );
        } else {
          Logger.info(
            ConsumeProcess.name,
            this.bulkCancelConsumer.name,
            'RabbitMQ Consumer cannot be canceled',
            consumerTag,
          );
        }
      }),
    ).catch(err => {
      Logger.error(ConsumeProcess.name, this.bulkCancelConsumer.name, 'Error', err);
    });
  }

  /**
   * Check if queue exists
   * @returns Promise<boolean>
   */
  private async checkExistingQueue(enterpriseName: string): Promise<boolean> {
    const channelTest: Channel = await createChannel(this.connection, true);
    channelTest.on('error', (err: any) => {
      Logger.info(
        ConsumeProcess.name,
        this.checkExistingQueue.name,
        'RabbitMQ Queue does not exists',
        this.rabbitmqConfig.getConsumerQueue(enterpriseName),
      );
      return false;
    });

    channelTest.on('exit', (code: number) => {
      Logger.info(
        ConsumeProcess.name,
        this.checkExistingQueue.name,
        'RabbitMQ Queue does not exists',
        this.rabbitmqConfig.getConsumerQueue(enterpriseName),
      );
      return false;
    });
    await channelTest.checkQueue(this.rabbitmqConfig.getConsumerQueue(enterpriseName));
    await channelTest.close();
    return true;
  }

  /**
   * Restart registered consumers in hashmap
   */
  private async restartConsumers(): Promise<void> {
    if (!isEmpty(this.channel) && !isEmpty(this.connection) && this.hashMapConsumerEnterprise) {
      await this.bulkAddConsumer(Object.keys(this.hashMapConsumerEnterprise));
    }
  }

  /**
   * Retry connection only for LANDSCAPE !== preview
   */
  private async retryConnection(): Promise<void> {
    if (process.env.LANDSCAPE && process.env.LANDSCAPE !== 'preview') {
      Logger.info(ConsumeProcess.name, this.retryConnection.name, 'Process will restart');
      setTimeout(async () => {
        this.connection = {} as Connection;
        this.channel = {} as Channel;
        process.removeAllListeners('message');
        await this.start();
        await this.restartConsumers();
      }, 10000);
    }
  }

  /**
   * Retry channel
   */
  private async retryChannel(): Promise<void> {
    Logger.info(ConsumeProcess.name, this.retryChannel.name, 'Channel will restart');
    setTimeout(async () => {
      this.channel = await createChannel(this.connection);
      this.addChannelErrorListeners();
      await this.restartConsumers();
    }, 10000);
  }
}

// Start consumer process
new ConsumeProcess()
  .start()
  .then(() => {})
  .catch(() => {});

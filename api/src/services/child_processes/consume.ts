import {Channel, Connection, ConsumeMessage, Replies} from 'amqplib';
import {isEmpty} from 'lodash';
import process from 'process';

import {RabbitmqConfig} from '../../config';
import {EVENT_MESSAGE, IMessage, logger, UPDATE_MODE} from '../../utils';
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
          logger.info(
            `${ConsumeProcess.name} - Message from parent: ${JSON.stringify(message)}`,
          );
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
      logger.error(`${ConsumeProcess.name} - ${err}`);
      await this.retryConnection();
    }
  }

  /**
   * Add listener for errors on connection
   */
  private addConnectionErrorListeners(): void {
    this.connection.on('error', (err: any) => {
      logger.error(`${ConsumeProcess.name} - Connection - Error : ${err}`);
    });

    this.connection.on('exit', async (code: number) => {
      logger.error(`${ConsumeProcess.name} - Connection - Exited with code : ${code}`);
      await this.retryConnection();
    });

    this.connection.on('close', async (err: any) => {
      logger.error(`${ConsumeProcess.name} - Connection - Closed : ${err}`);
      await this.retryConnection();
    });
  }

  /**
   * Add listener for errors on channel
   */
  private addChannelErrorListeners(): void {
    this.channel.on('error', async (err: any) => {
      logger.error(`${ConsumeProcess.name} - Channel - Error : ${err}`);
      await this.retryChannel();
    });

    this.channel.on('exit', async (code: number) => {
      logger.error(`${ConsumeProcess.name} - Channel - Exited with code: ${code}`);
      await this.retryChannel();
    });

    this.channel.on('close', (err: any) => {
      logger.error(`${ConsumeProcess.name} - Channel - Closed: ${err}`);
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
              logger.info(`${
                ConsumeProcess.name
              } - RabbitMQ Consumer received message from: \
                ${this.rabbitmqConfig.getConsumerQueue(enterpriseName)}`);
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
          logger.info(`${ConsumeProcess.name} - RabbitMQ Consumer created: \
              ${consumer.consumerTag} - ${this.rabbitmqConfig.getConsumerQueue(
            enterpriseName,
          )}`);
        }
      }),
    ).catch(err => {
      logger.error(`${ConsumeProcess.name} - ${err}`);
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
          logger.info(`${ConsumeProcess.name} - RabbitMQ Consumer canceled: \
              ${consumerTag} - ${this.rabbitmqConfig.getConsumerQueue(enterpriseName)}`);
        } else {
          logger.info(`${ConsumeProcess.name} - RabbitMQ Consumer cannot be canceled : \
              ${consumerTag} - ${this.rabbitmqConfig.getConsumerQueue(enterpriseName)}`);
        }
      }),
    ).catch(err => {
      logger.error(`${ConsumeProcess.name} - ${err}`);
    });
  }

  /**
   * Check if queue exists
   * @returns Promise<boolean>
   */
  private async checkExistingQueue(enterpriseName: string): Promise<boolean> {
    const channelTest: Channel = await createChannel(this.connection, true);
    channelTest.on('error', (err: any) => {
      logger.info(`${ConsumeProcess.name} - RabbitMQ Queue does not exists: \
            ${this.rabbitmqConfig.getConsumerQueue(enterpriseName)}`);
      return false;
    });

    channelTest.on('exit', (code: number) => {
      logger.info(`${ConsumeProcess.name} - RabbitMQ Queue does not exists: \
            ${this.rabbitmqConfig.getConsumerQueue(enterpriseName)}`);
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
    if (
      !isEmpty(this.channel) &&
      !isEmpty(this.connection) &&
      this.hashMapConsumerEnterprise
    ) {
      await this.bulkAddConsumer(Object.keys(this.hashMapConsumerEnterprise));
    }
  }

  /**
   * Retry connection only for LANDSCAPE !== preview
   */
  private async retryConnection(): Promise<void> {
    if (process.env.LANDSCAPE && process.env.LANDSCAPE !== 'preview') {
      logger.info(`${ConsumeProcess.name} - Process will restart`);
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
    logger.info(`${ConsumeProcess.name} - Channel will restart`);
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

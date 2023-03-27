import {BindingScope, inject, injectable, service} from '@loopback/core';
import amqp, {Channel, Connection, ConsumeMessage, Options} from 'amqplib';
import {KeycloakService} from '../services/keycloak.service';
import {credentials as kcCredentials} from '../constants';
import {repository} from '@loopback/repository';

import {RabbitmqConfig} from '../config';
import {EVENT_MESSAGE, ISubscriptionPublishPayload, Logger, StatusCode} from '../utils';

import {InternalServerError} from '../validationError';
import {ParentProcessService} from './parentProcess.service';
import {Enterprise} from '../models';
import {SubscriptionService} from './subscription.service';
import {FunderRepository} from '../repositories';

@injectable({scope: BindingScope.SINGLETON})
export class RabbitmqService {
  private rabbitmqConfig: RabbitmqConfig;
  private connection: Connection;

  constructor(
    @service(SubscriptionService)
    public subscriptionService: SubscriptionService,
    @repository(FunderRepository)
    public funderRepository: FunderRepository,
    @inject('services.ParentProcessService')
    public parentProcessService: ParentProcessService,
    @service(KeycloakService)
    public keycloakService: KeycloakService,
  ) {
    this.rabbitmqConfig = new RabbitmqConfig();
    this.parentProcessService.on(EVENT_MESSAGE.CONSUME, async (msg: ConsumeMessage) => {
      try {
        await this.consumeMessage(msg);
      } catch (err) {
        Logger.error(RabbitmqService.name, 'constructor', 'Error', err);
      }
    });
  }

  /**
   * Get an array for HRIS enterprise name
   * @returns string[]
   */
  public async getHRISEnterpriseNameList(): Promise<string[]> {
    try {
      return (await this.funderRepository.getEnterpriseHRISNameList()).map(
        (enterprise: Pick<Enterprise, 'name'>) => {
          return enterprise.name.toLowerCase();
        },
      );
    } catch (err) {
      throw new InternalServerError(RabbitmqService.name, this.getHRISEnterpriseNameList.name, err);
    }
  }

  /**
   * Connect to RabbitMQ
   */
  public async connect(): Promise<void> {
    try {
      await this.keycloakService.keycloakAdmin.auth(kcCredentials);
      this.connection = await amqp.connect(
        this.rabbitmqConfig.getAmqpUrl(),
        this.rabbitmqConfig.getLogin(this.keycloakService.keycloakAdmin.accessToken),
      );
      Logger.info(
        RabbitmqService.name,
        this.connect.name,
        'RabbitMQ connected to',
        this.rabbitmqConfig.getAmqpUrl(),
      );
    } catch (err) {
      throw new InternalServerError(RabbitmqService.name, this.connect.name, err);
    }
  }

  /**
   * Disconnect to RabbitMQ
   */
  public async disconnect(): Promise<void> {
    try {
      await this.connection.close();
      Logger.info(
        RabbitmqService.name,
        this.disconnect.name,
        'RabbitMQ closed connection',
        this.rabbitmqConfig.getAmqpUrl(),
      );
    } catch (err) {
      throw new InternalServerError(RabbitmqService.name, this.disconnect.name, err);
    }
  }

  /**
   * Opens the channel to rabbitmq.
   */
  public async openConnectionChannel(): Promise<Channel> {
    try {
      const channel: Channel = await this.connection.createChannel();
      return channel;
    } catch (err) {
      throw new InternalServerError(RabbitmqService.name, this.openConnectionChannel.name, err);
    }
  }

  /**
   * Close the connection and the channel to rabbitmq.
   * @param channel
   */

  public async closeConnectionChannel(channel: Channel): Promise<void> {
    try {
      await channel.close();
    } catch (err) {
      throw new InternalServerError(RabbitmqService.name, this.closeConnectionChannel.name, err);
    }
  }

  /**
   * Calls rabbitmq config to open channel, send the message and closes the channel.
   * @param subscriptionPayload
   * @param enterpriseName
   */
  async publishMessage(
    subscriptionPayload: ISubscriptionPublishPayload,
    enterpriseName: string,
  ): Promise<void> {
    try {
      // Create the connection and the channel
      await this.connect();
      const channel = await this.openConnectionChannel();
      // Publish the Payload
      // Options
      const options: Options.Publish = {
        headers: this.rabbitmqConfig.getPublishQueue(enterpriseName.toLowerCase()).headers,
        deliveryMode: 2,
        contentEncoding: 'utf-8',
        contentType: 'application/json',
      };
      channel.publish(
        this.rabbitmqConfig.getExchange(),
        '',
        Buffer.from(JSON.stringify(subscriptionPayload)),
        options,
      );
      Logger.info(
        RabbitmqService.name,
        this.publishMessage.name,
        'Message published for enterprise',
        enterpriseName,
      );
      // Close the connection
      await this.closeConnectionChannel(channel);
      await this.disconnect();
    } catch (err) {
      throw new InternalServerError(RabbitmqService.name, this.publishMessage.name, err);
    }
  }

  /**
   * Calls rabbitmq to consume the SIRH sent payload and checks for errors.
   * @param message ConsumeMessage
   */
  async consumeMessage(message: ConsumeMessage): Promise<void> {
    let parsedData: any;
    try {
      parsedData = JSON.parse(Buffer.from(message.content).toString());
      await this.subscriptionService.handleMessage(parsedData);
      // Send message to acknowledge channel that the message has been treated
      this.parentProcessService.emit(EVENT_MESSAGE.ACK, {
        type: EVENT_MESSAGE.ACK,
        data: message,
      });
    } catch (err) {
      if (
        err &&
        (err.statusCode === StatusCode.BadRequest ||
          err.statusCode === StatusCode.Conflict ||
          err.statusCode === StatusCode.Forbidden ||
          err.statusCode === StatusCode.UnprocessableEntity)
      ) {
        const payload = await this.subscriptionService.getSubscriptionPayload(parsedData!.subscriptionId, {
          message: err.message,
          property: err.property,
          code: err.statusCode,
        });
        await this.publishMessage(payload.subscription, payload.enterprise);
        // delete message ACK
        this.parentProcessService.emit(EVENT_MESSAGE.ACK, {
          type: EVENT_MESSAGE.ACK,
          data: message,
        });
      }

      throw new InternalServerError(RabbitmqService.name, this.consumeMessage.name, err);
    }
  }
}

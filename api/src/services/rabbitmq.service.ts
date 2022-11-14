import {BindingScope, inject, injectable, service} from '@loopback/core';
import amqp, {Channel, Connection, ConsumeMessage, credentials, Options} from 'amqplib';
import {KeycloakService} from '../services/keycloak.service';
import {credentials as kcCredentials} from '../constants';
import {repository} from '@loopback/repository';

import {RabbitmqConfig} from '../config';
import {
  EVENT_MESSAGE,
  ISubscriptionPublishPayload,
  ResourceName,
  StatusCode,
} from '../utils';

import {ValidationError} from '../validationError';
import {logger} from '../utils';
import {ParentProcessService} from './parentProcess.service';
import {EnterpriseRepository} from '../repositories';
import {Enterprise} from '../models';
import {SubscriptionService} from './subscription.service';

@injectable({scope: BindingScope.SINGLETON})
export class RabbitmqService {
  private rabbitmqConfig: RabbitmqConfig;
  private connection: Connection;

  constructor(
    @service(SubscriptionService)
    public subscriptionService: SubscriptionService,
    @repository(EnterpriseRepository)
    public enterpriseRepository: EnterpriseRepository,
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
        logger.error(`${RabbitmqService.name} - ${err}`);
      }
    });
  }

  /**
   * Get an array for HRIS enterprise name
   * @returns string[]
   */
  public async getHRISEnterpriseNameList(): Promise<string[]> {
    try {
      return (await this.enterpriseRepository.getHRISEnterpriseNameList()).map(
        (enterprise: Pick<Enterprise, 'name'>) => {
          return enterprise.name.toLowerCase();
        },
      );
    } catch (err) {
      throw new ValidationError(
        `rabbitmq error getting HRIS enterprises`,
        '/rabbitmq',
        StatusCode.InternalServerError,
        ResourceName.rabbitmq,
      );
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
      logger.info(
        `${
          RabbitmqService.name
        } - RabbitMQ connected to: ${this.rabbitmqConfig.getAmqpUrl()}`,
      );
    } catch (err) {
      throw new ValidationError(
        `rabbitmq init connection error`,
        '/rabbitmq',
        StatusCode.InternalServerError,
        ResourceName.rabbitmq,
      );
    }
  }

  /**
   * Disconnect to RabbitMQ
   */
  public async disconnect(): Promise<void> {
    try {
      await this.connection.close();
      logger.info(`${RabbitmqService.name} - \
    RabbitMQ closed connection for: ${this.rabbitmqConfig.getAmqpUrl()}`);
    } catch (err) {
      throw new ValidationError(
        `rabbitmq disconnect error`,
        '/rabbitmq',
        StatusCode.InternalServerError,
        ResourceName.rabbitmq,
      );
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
      throw new ValidationError(
        `rabbitmq connect to channel error`,
        '/rabbitmq',
        StatusCode.InternalServerError,
        ResourceName.rabbitmq,
      );
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
      throw new ValidationError(
        `rabbitmq close channel error`,
        '/rabbitmq',
        StatusCode.InternalServerError,
        ResourceName.rabbitmq,
      );
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
        headers: this.rabbitmqConfig.getPublishQueue(enterpriseName.toLowerCase())
          .headers,
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
      logger.info(`Message published for enterprise : ${enterpriseName}`);
      // Close the connection
      await this.closeConnectionChannel(channel);
      await this.disconnect();
    } catch (err) {
      throw new ValidationError(
        `rabbitmq publish message error`,
        '/rabbitmq',
        StatusCode.PreconditionFailed,
        ResourceName.rabbitmq,
      );
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
        (err.statusCode === StatusCode.PreconditionFailed ||
          err.statusCode === StatusCode.Forbidden)
      ) {
        const payload = await this.subscriptionService.getSubscriptionPayload(
          parsedData!.subscriptionId,
          {message: err.message, property: err.property, code: err.statusCode},
        );
        await this.publishMessage(payload.subscription, payload.enterprise);
        // delete message ACK
        this.parentProcessService.emit(EVENT_MESSAGE.ACK, {
          type: EVENT_MESSAGE.ACK,
          data: message,
        });
      }
      throw new ValidationError(
        `rabbitmq consume message error`,
        '/rabbitmq',
        StatusCode.PreconditionFailed,
        ResourceName.rabbitmq,
      );
    }
  }
}

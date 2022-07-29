import {credentials} from 'amqplib';
export class RabbitmqConfig {
  private amqpUrl = 'amqp://' + (process.env.BUS_HOST ?? 'localhost');
  private mobLogin = {
    credentials: credentials.plain(
      process.env.BUS_MCM_USER ?? 'mob',
      process.env.BUS_MCM_PWD ?? 'mob',
    ),
  };
  private apiKey = process.env.CLIENT_SECRET_KEY_KEYCLOAK_API ?? 'MOB_SECRET_KEY';
  private exchangeValue = process.env.BUS_MCM_HEADERS ?? 'mob.headers';
  private publishMessageType = process.env.BUS_MCM_MESSAGE_TYPE ?? 'subscription.depot';
  private consumerMessageType =
    process.env.BUS_CONSUMER_QUEUE ?? 'mob.subscription.status';

  /**
   * Return the message type (depot) and the secret key of the client
   * @param enterpriseName
   */
  getPublishQueue(enterpriseName: string): {
    headers: {message_type: string; secret_key: string};
  } {
    const publishQueue = {
      headers: {
        message_type: `${this.publishMessageType}.${enterpriseName}`,
        secret_key: this.apiKey,
      },
    };
    return publishQueue;
  }

  /**
   * Return the message type (status) for the consumer
   * @param enterpriseName
   */
  getConsumerQueue(enterpriseName: string): string {
    return `${this.consumerMessageType}.${enterpriseName}`;
  }

  /**
   * Return the url to connect to
   */
  getAmqpUrl(): string {
    return this.amqpUrl;
  }

  /**
   * Return the login of rabbitmq user
   */
  getMobLogin(): any {
    return this.mobLogin;
  }

  /**
   * Return the exchange headers to publish
   */
  getExchange(): string {
    return this.exchangeValue;
  }
}

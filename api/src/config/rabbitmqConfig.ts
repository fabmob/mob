import {BindingScope, injectable} from '@loopback/core';
import {credentials} from 'amqplib';
@injectable({scope: BindingScope.TRANSIENT})
export class RabbitmqConfig {
  private amqpUrl = 'amqp://' + (process.env.BUS_HOST ?? 'localhost');
  private apiKey = process.env.CLIENT_SECRET_KEY_KEYCLOAK_API ?? 'MOB_SECRET_KEY';

  private user = process.env.BUS_MCM_CONSUME_USER ?? 'mob';
  private password = process.env.BUS_MCM_CONSUME_PASSWORD ?? 'mob';

  private exchangeValue = process.env.BUS_MCM_HEADERS ?? 'mob.headers';
  private publishMessageType = process.env.BUS_MCM_MESSAGE_TYPE ?? 'subscriptions.put';

  private consumerMessageType =
    process.env.BUS_CONSUMER_QUEUE ?? 'mob.subscriptions.status';

  /**
   * Return the message type (put) and the secret key of the client
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
   * Generate login credentials with KC token from api service account
   * @returns { credentials: any }
   */
  public getLogin(accessToken: string): {credentials: any} {
    return {
      credentials: credentials.plain('client_id', accessToken),
    };
  }

  /**
   * Get login with user/password
   * @returns { credentials: any }
   */
  public getUserLogin(): {credentials: any} {
    return {
      credentials: credentials.plain(this.user, this.password),
    };
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
   * Return the exchange headers to publish
   */
  getExchange(): string {
    return this.exchangeValue;
  }
}

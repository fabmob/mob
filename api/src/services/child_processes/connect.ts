import amqp, {Channel, Connection} from 'amqplib';

import {RabbitmqConfig} from '../../config';
import {logger} from '../../utils';

const rabbitmqConfig = new RabbitmqConfig();

/**
 * Connect to RabbitMQ
 */
export async function connect(): Promise<Connection> {
  const connection: Connection = await amqp.connect(
    rabbitmqConfig.getAmqpUrl(),
    rabbitmqConfig.getMobLogin(),
  );
  logger.info(`RabbitMQ connected to: ${rabbitmqConfig.getAmqpUrl()}`);
  return connection;
}

/**
 * Create channel for given connection
 */
export async function createChannel(
  connection: Connection,
  isTestChannel: boolean = false,
): Promise<Channel> {
  const channel: Channel = await connection.createChannel();
  !isTestChannel && logger.info(`RabbitMQ channel created`);
  return channel;
}

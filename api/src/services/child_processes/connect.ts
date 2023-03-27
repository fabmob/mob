import amqp, {Channel, Connection} from 'amqplib';

import {RabbitmqConfig} from '../../config';
import {Logger} from '../../utils';

const rabbitmqConfig = new RabbitmqConfig();

/**
 * Connect to RabbitMQ
 */
export async function connect(): Promise<Connection> {
  const connection: Connection = await amqp.connect(
    rabbitmqConfig.getAmqpUrl(),
    rabbitmqConfig.getUserLogin(),
  );
  Logger.info(connect.name, connect.name, 'RabbitMQ connected to', rabbitmqConfig.getAmqpUrl());
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
  !isTestChannel && Logger.info(createChannel.name, createChannel.name, 'RabbitMQ channel created');
  return channel;
}

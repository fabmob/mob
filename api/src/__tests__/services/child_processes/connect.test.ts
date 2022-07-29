import {expect} from '@loopback/testlab';

import amqp, {Channel} from 'amqplib';
import sinon from 'sinon';
import {connect, createChannel} from '../../../services/child_processes/connect';

describe('Child Process connect', () => {
  it('Child Process connect : success', async () => {
    const connection: any = {
      createChannel: () => {},
    };
    const amqpTest = sinon.stub(amqp, 'connect').resolves(connection);
    const connectionResult = await connect();
    expect(connectionResult).to.deepEqual(connection);
    amqpTest.restore();
  });

  it('Child Process create channel : success', async () => {
    const channel: Channel = Object.assign({name: 'channel'});
    const connection: any = {
      createChannel: () => {
        return channel;
      },
    };
    const channelResult = await createChannel(connection);
    expect(channelResult).to.deepEqual(channel);
  });
});

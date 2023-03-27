import {expect, sinon} from '@loopback/testlab';

import amqp from 'amqplib';
import process from 'process';
import {EventEmitter} from 'events';
import {ConsumeProcess} from '../../../services/child_processes/consume';
import {Logger} from '../../../utils';

describe('Child Process consume', () => {
  let connectStub: any = null;
  let processStub: any = null;
  let consumeProcess: any = null;
  let listenerConnectStub: any = null;
  let listenerChannelStub: any = null;
  let retryConnectStub: any = null;
  let retryChannelStub: any = null;
  let queue: any;

  const createQueue = () => {
    let messages: any = [];
    let subscriber: any = null;

    return {
      add: (item: any) => {
        if (subscriber) {
          subscriber(item);
        } else {
          messages.push(item);
        }
      },
      addConsumer: (consumer: any) => {
        messages.forEach((item: any) => consumer(item));
        messages = [];
        subscriber = consumer;
      },
    };
  };

  const channel: any = Object.assign(new EventEmitter(), {
    consume: async (queueName: string, consumer: any) => {
      queue.addConsumer(consumer);
      return Promise.resolve({consumerTag: 'consumerTag'});
    },
    cancel: () => {},
    close: () => {},
    checkQueue: () => {
      return Promise.resolve();
    },
    sendToQueue: async (queueName: any, content: any) => {
      queue.add({
        content,
      });
    },
  });

  const connection: any = Object.assign(new EventEmitter(), {
    createChannel: () => {
      return channel;
    },
  });

  beforeEach(() => {
    queue = createQueue();
    process.send = () => {
      return true;
    };
    connectStub = sinon.stub(amqp, 'connect').resolves(connection);
    processStub = sinon.stub(process, 'emit');
    consumeProcess = new ConsumeProcess();
    listenerConnectStub = sinon.stub(consumeProcess, 'addConnectionErrorListeners');
    listenerChannelStub = sinon.stub(consumeProcess, 'addChannelErrorListeners');
    retryConnectStub = sinon.stub(consumeProcess, 'retryConnection');
    retryChannelStub = sinon.stub(consumeProcess, 'retryChannel');
  });

  afterEach(() => {
    connectStub.restore();
    processStub.restore();
    listenerConnectStub.restore();
    listenerChannelStub.restore();
    retryConnectStub.restore();
    retryChannelStub.restore();
  });

  it('Child Process consume : start error connection', async () => {
    connectStub.restore();
    const errorConnection: any = {
      createChannel: () => {
        const err = new Error();
        return Promise.reject(err);
      },
    };
    connectStub = sinon.stub(amqp, 'connect').resolves(errorConnection);
    try {
      await consumeProcess.start();
    } catch (err) {
      expect(retryConnectStub.calledOnce).true();
    }
  });

  it('Child Process consume : addConnectionErrorListeners error', async () => {
    const spy = sinon.spy(Logger, 'error');
    await consumeProcess.start();
    listenerConnectStub.restore();
    await consumeProcess.addConnectionErrorListeners();
    await consumeProcess.connection.emit('error');
    expect(Logger.error).called;
    spy.restore();
  });

  it('Child Process consume : addConnectionErrorListeners exit', async () => {
    await consumeProcess.start();
    listenerConnectStub.restore();
    await consumeProcess.addConnectionErrorListeners();
    await consumeProcess.connection.emit('exit');
    expect(consumeProcess.retryConnection.calledOnce).true();
  });

  it('Child Process consume : addConnectionErrorListeners close', async () => {
    await consumeProcess.start();
    listenerConnectStub.restore();
    await consumeProcess.addConnectionErrorListeners();
    await consumeProcess.connection.emit('close');
    expect(consumeProcess.retryConnection.calledOnce).true();
  });

  it('Child Process consume : addChannelErrorListeners error', async () => {
    await consumeProcess.start();
    listenerChannelStub.restore();
    await consumeProcess.addChannelErrorListeners();
    await consumeProcess.channel.emit('error');
    expect(consumeProcess.retryChannel.calledOnce).true();
  });

  it('Child Process consume : addChannelErrorListeners exit', async () => {
    await consumeProcess.start();
    listenerChannelStub.restore();
    await consumeProcess.addChannelErrorListeners();
    await consumeProcess.channel.emit('exit');
    expect(consumeProcess.retryChannel.calledOnce).true();
  });

  it('Child Process consume : addChannelErrorListeners close', async () => {
    const spy = sinon.spy(Logger, 'error');
    await consumeProcess.start();
    listenerChannelStub.restore();
    await consumeProcess.addChannelErrorListeners();
    await consumeProcess.channel.emit('close');
    expect(Logger.error).called;
    spy.restore();
  });

  it('Child Process consume : bulkAddConsumer success', async () => {
    const enterpriseNameList: string[] = ['enterprise'];
    const checkStub = sinon.stub(consumeProcess, 'checkExistingQueue').resolves(true);
    await consumeProcess.start();
    await consumeProcess.bulkAddConsumer(enterpriseNameList);
    expect(checkStub.calledOnce).true();
    expect(consumeProcess.hashMapConsumerEnterprise).to.deepEqual({
      enterprise: 'consumerTag',
    });
    checkStub.restore();
  });

  it('Child Process consume : bulkAddConsumer success with message', async () => {
    const enterpriseNameList: string[] = ['enterprise'];
    const checkStub = sinon.stub(consumeProcess, 'checkExistingQueue').resolves(true);
    await consumeProcess.start();
    await consumeProcess.bulkAddConsumer(enterpriseNameList);
    consumeProcess.channel.sendToQueue('mob.subscription.status.enterprise', 'test');
    expect(process.send).called;
    expect(checkStub.calledOnce).true();
    expect(consumeProcess.hashMapConsumerEnterprise).to.deepEqual({
      enterprise: 'consumerTag',
    });
    checkStub.restore();
  });

  it('Child Process consume : bulkAddConsumer error', async () => {
    connectStub.restore();
    const errorChannel: any = {
      consume: () => {
        const err = new Error();
        return Promise.reject(err);
      },
    };
    const errorConnection: any = {
      createChannel: () => {
        return errorChannel;
      },
    };
    connectStub = sinon.stub(amqp, 'connect').resolves(errorConnection);

    const checkStub = sinon.stub(consumeProcess, 'checkExistingQueue').resolves(true);
    const enterpriseNameList: string[] = ['enterprise'];
    await consumeProcess.start();
    try {
      await consumeProcess.bulkAddConsumer(enterpriseNameList);
    } catch (err) {
      expect(checkStub.calledOnce).true();
      expect(consumeProcess.hashMapConsumerEnterprise).to.deepEqual({});
      checkStub.restore();
    }
  });

  it('Child Process consume : bulkCancelConsumer success', async () => {
    const checkStub = sinon.stub(consumeProcess, 'checkExistingQueue').resolves(true);
    const enterpriseNameList: string[] = ['enterprise'];
    await consumeProcess.start();
    consumeProcess.hashMapConsumerEnterprise = {enterprise: 'consumerTag'};
    await consumeProcess.bulkCancelConsumer(enterpriseNameList);
    expect(checkStub.calledOnce).true();
    expect(consumeProcess.hashMapConsumerEnterprise).to.deepEqual({});
    checkStub.restore();
  });

  it('Child Process consume : bulkCancelConsumer no existing queue', async () => {
    const checkStub = sinon.stub(consumeProcess, 'checkExistingQueue').resolves(false);
    const enterpriseNameList: string[] = ['enterprise'];
    await consumeProcess.start();
    consumeProcess.hashMapConsumerEnterprise = {enterprise: 'consumerTag'};
    await consumeProcess.bulkCancelConsumer(enterpriseNameList);
    expect(checkStub.calledOnce).true();
    expect(consumeProcess.channel.cancel).not.called;
    expect(consumeProcess.hashMapConsumerEnterprise).to.deepEqual({
      enterprise: 'consumerTag',
    });
    checkStub.restore();
  });

  it('Child Process consume : bulkCancelConsumer error', async () => {
    connectStub.restore();
    const errorChannel: any = {
      cancel: () => {
        const err = new Error();
        return Promise.reject(err);
      },
    };
    const errorConnection: any = {
      createChannel: () => {
        return errorChannel;
      },
    };
    connectStub = sinon.stub(amqp, 'connect').resolves(errorConnection);

    const checkStub = sinon.stub(consumeProcess, 'checkExistingQueue').resolves(true);
    const enterpriseNameList: string[] = ['enterprise'];
    await consumeProcess.start();
    consumeProcess.hashMapConsumerEnterprise = {enterprise: 'consumerTag'};

    try {
      await consumeProcess.bulkCancelConsumer(enterpriseNameList);
    } catch (err) {
      expect(checkStub.calledOnce).true();
      expect(consumeProcess.hashMapConsumerEnterprise).to.deepEqual({
        enterprise: 'consumerTag',
      });
      checkStub.restore();
    }
  });

  it('Child Process consume : checkExistingQueue returns true', async () => {
    const enterpriseName: string = 'enterprise';
    await consumeProcess.start();
    const result: boolean = await consumeProcess.checkExistingQueue(enterpriseName);
    expect(result).to.equal(true);
  });

  it('Child Process consume : restartConsumers success', async () => {
    await consumeProcess.start();
    consumeProcess.hashMapConsumerEnterprise = {enterprise: 'consumerTag'};
    const bulkAddStub = sinon.stub(consumeProcess, 'bulkAddConsumer').resolves();
    await consumeProcess.restartConsumers();
    expect(consumeProcess.bulkAddConsumer.calledOnce).true();
    bulkAddStub.restore();
  });

  it('Child Process consume : restartConsumers false', async () => {
    await consumeProcess.restartConsumers();
    expect(consumeProcess.bulkAddConsumer).not.called;
  });

  it('Child Process consume : retryConnection landscape false', async () => {
    retryConnectStub.restore();
    await consumeProcess.retryConnection();
    expect(consumeProcess.start).not.called;
    expect(consumeProcess.restartConsumers).not.called;
  });

  it('Child Process consume : retryConnection landscape true', async () => {
    retryConnectStub.restore();
    const env = Object.assign({}, process.env);
    process.env.LANDSCAPE = 'test';
    const clock = sinon.useFakeTimers();
    const startStub = sinon.stub(consumeProcess, 'start').resolves();
    const restartConsumersStub = sinon.stub(consumeProcess, 'restartConsumers').resolves();
    await consumeProcess.retryConnection();
    clock.tick(15000);
    expect(consumeProcess.start).called;
    expect(consumeProcess.restartConsumers).called;
    process.env = env;
    startStub.restore();
    restartConsumersStub.restore();
    clock.restore();
  });

  it('Child Process consume : retryChannel success', async () => {
    retryChannelStub.restore();
    const clock = sinon.useFakeTimers();
    const restartConsumersStub = sinon.stub(consumeProcess, 'restartConsumers').resolves();
    await consumeProcess.start();
    await consumeProcess.retryChannel();
    expect(consumeProcess.addChannelErrorListeners).not.called;
    expect(consumeProcess.restartConsumers).not.called;
    clock.tick(15000);
    expect(consumeProcess.addChannelErrorListeners).called;
    expect(consumeProcess.restartConsumers).called;
    restartConsumersStub.restore();
    clock.restore();
  });
});

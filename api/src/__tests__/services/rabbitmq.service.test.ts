import {
  createStubInstance,
  expect,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';

import amqp, {Channel} from 'amqplib';
import sinon from 'sinon';
import {EventEmitter} from 'stream';

import {Enterprise} from '../../models';
import {EnterpriseRepository} from '../../repositories';
import {RabbitmqService, SubscriptionService} from '../../services';
import {EVENT_MESSAGE} from '../../utils';

describe('Rabbitmq service', () => {
  let rabbitmqService: any = null;
  let amqpTest: any = null;
  let spy: any,
    subscriptionService: StubbedInstanceWithSinonAccessor<SubscriptionService>,
    enterpriseRepository: StubbedInstanceWithSinonAccessor<EnterpriseRepository>,
    parentProcessService: any;

  beforeEach(() => {
    subscriptionService = createStubInstance(SubscriptionService);
    enterpriseRepository = createStubInstance(EnterpriseRepository);
    parentProcessService = new EventEmitter();

    rabbitmqService = new RabbitmqService(
      subscriptionService,
      enterpriseRepository,
      parentProcessService,
    );
    spy = sinon.spy(rabbitmqService);
  });

  it('RabbitMQService event EVENT_MESSAGE.CONSUME : error', async () => {
    sinon.spy(parentProcessService, 'on');
    const rabbitStub = sinon.stub(RabbitmqService.prototype, 'consumeMessage').resolves();
    parentProcessService.emit(EVENT_MESSAGE.CONSUME, {test: 'test'});
    sinon.assert.calledOnceWithExactly(rabbitmqService.consumeMessage, {test: 'test'});
    rabbitStub.restore();
  });

  it('RabbitMQService getHRISEnterpriseNameList : error', async () => {
    try {
      enterpriseRepository.stubs.getHRISEnterpriseNameList.rejects();
      await rabbitmqService.getHRISEnterpriseNameList();
    } catch (error) {
      expect(error.message).to.equal('rabbitmq error getting HRIS enterprises');
      enterpriseRepository.stubs.getHRISEnterpriseNameList.restore();
    }
  });

  it('RabbitMQService getHRISEnterpriseNameList : success', async () => {
    const enterprise: Pick<Enterprise, 'name'> = new Enterprise({
      name: 'enterpriseName',
    });
    const enterpriseRepositoryList: Pick<Enterprise, 'name'>[] = [enterprise];
    const enterpriseRepositoryResult: string[] = [enterprise.name.toLowerCase()];
    enterpriseRepository.stubs.getHRISEnterpriseNameList.resolves(
      enterpriseRepositoryList,
    );
    const enterpriseNameList: string[] =
      await rabbitmqService.getHRISEnterpriseNameList();
    expect(enterpriseNameList).to.deepEqual(enterpriseRepositoryResult);
    enterpriseRepository.stubs.getHRISEnterpriseNameList.restore();
  });

  it('RabbitMQService connect : error', async () => {
    try {
      amqpTest = sinon.stub(amqp, 'connect').rejects('err');
      await rabbitmqService.connect();
    } catch (error) {
      expect(error.message).to.equal('rabbitmq init connection error');
      amqpTest.restore();
    }
  });

  it('RabbitMQService connect : success', async () => {
    const connection: any = {
      createChannel: () => {},
    };
    amqpTest = sinon.stub(amqp, 'connect').resolves(connection);
    await rabbitmqService.connect();
    expect(rabbitmqService.connection).to.deepEqual(connection);
    amqpTest.restore();
  });

  it('RabbitMQService disconnect : error', async () => {
    try {
      const connection: any = {
        close: () => {
          const err = new Error();
          return Promise.reject(err);
        },
      };
      amqpTest = sinon.stub(amqp, 'connect').resolves(connection);
      await rabbitmqService.connect();
      await rabbitmqService.disconnect();
    } catch (error) {
      expect(error.message).to.equal('rabbitmq disconnect error');
      amqpTest.restore();
    }
  });

  it('RabbitMQService disconnect : success', async () => {
    const connection: any = {
      close: () => {},
    };
    amqpTest = sinon.stub(amqp, 'connect').resolves(connection);
    await rabbitmqService.connect();
    await rabbitmqService.disconnect();
    expect(rabbitmqService.connection).to.deepEqual(connection);
    amqpTest.restore();
  });

  it('RabbitMQService open channel : error', async () => {
    try {
      const connection: any = {
        createChannel: () => {
          const err = new Error();
          return Promise.reject(err);
        },
      };
      amqpTest = sinon.stub(amqp, 'connect').resolves(connection);
      await rabbitmqService.connect();
      await rabbitmqService.openConnectionChannel();
    } catch (error) {
      expect(error.message).to.equal(`rabbitmq connect to channel error`);
      amqpTest.restore();
    }
  });

  it('RabbitMQService open channel : successful', async () => {
    const channel: Channel = Object.assign({name: 'channel'});
    const connection: any = {
      createChannel: () => {
        return channel;
      },
    };
    amqpTest = sinon.stub(amqp, 'connect').resolves(connection);
    await rabbitmqService.connect();
    const connectionOpen = await rabbitmqService.openConnectionChannel();
    expect(connectionOpen).to.deepEqual(channel);
    amqpTest.restore();
  });

  it('RabbitMQService close channel : error', async () => {
    try {
      const channel: Channel = Object.assign({
        close: () => {
          const err = new Error();
          return Promise.reject(err);
        },
      });
      const connection: any = {
        createChannel: () => {
          return channel;
        },
      };
      amqpTest = sinon.stub(amqp, 'connect').resolves(connection);
      await rabbitmqService.connect();
      await rabbitmqService.openConnectionChannel();
      await rabbitmqService.closeConnectionChannel(channel);
    } catch (error) {
      expect(error.message).to.equal('rabbitmq close channel error');
      amqpTest.restore();
    }
  });

  it('RabbitMQService close channel : success', async () => {
    const channel: Channel = Object.assign({
      close: () => {},
    });
    const connection: any = {
      createChannel: () => {
        return channel;
      },
    };
    amqpTest = sinon.stub(amqp, 'connect').resolves(connection);
    await rabbitmqService.connect();
    await rabbitmqService.openConnectionChannel();
    await rabbitmqService.closeConnectionChannel(channel);
    expect(rabbitmqService.connection).to.deepEqual(connection);
    amqpTest.restore();
  });

  it('RabbitMQService publishMessage : error', async () => {
    try {
      const connection: any = {
        createChannel: () => {
          const err = new Error();
          return Promise.reject(err);
        },
      };
      amqpTest = sinon.stub(amqp, 'connect').resolves(connection);
      await rabbitmqService.publishMessage('test');
    } catch (error) {
      expect(error.message).to.equal('rabbitmq publish message error');
      expect(spy.openConnectionChannel.calledOnce).true();
      amqpTest.restore();
    }
  });

  it('RabbitMQService publishMessage : success', async () => {
    const channel: any = {
      publish: () => {
        return true;
      },
      close: () => {},
    };
    const connection: any = {
      createChannel: () => {
        return channel;
      },
      close: () => {},
    };
    amqpTest = sinon.stub(amqp, 'connect').resolves(connection);
    await rabbitmqService.connect();
    await rabbitmqService.publishMessage('test');
    expect(spy.openConnectionChannel.calledOnce).true();
    expect(spy.closeConnectionChannel.calledOnce).true();
    expect(spy.disconnect.calledOnce).true();
    amqpTest.restore();
  });

  it('RabbitMQService consume : error', async () => {
    try {
      const buf = JSON.stringify(Buffer.from('test').toString());
      const message = {
        content: buf,
      };
      subscriptionService.stubs.handleMessage.rejects();
      await rabbitmqService.consumeMessage(message);
    } catch (error) {
      expect(error.message).to.equal('rabbitmq consume message error');
      subscriptionService.stubs.handleMessage.restore();
    }
  });

  it('RabbitMQService consume : success', async () => {
    sinon.spy(parentProcessService, 'emit');
    const buf = JSON.stringify(Buffer.from('test').toString());
    const message = {
      content: buf,
    };
    subscriptionService.stubs.handleMessage.resolves();
    await rabbitmqService.consumeMessage(message);
    sinon.assert.calledWithExactly(parentProcessService.emit, EVENT_MESSAGE.ACK, {
      type: EVENT_MESSAGE.ACK,
      data: {content: '"test"'},
    });
    subscriptionService.stubs.handleMessage.restore();
  });
});

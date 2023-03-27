import {createStubInstance, expect, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';

import amqp, {Channel} from 'amqplib';
import KeycloakAdminClient from 'keycloak-admin';
import sinon from 'sinon';
import {EventEmitter} from 'stream';
import {Enterprise} from '../../models';
import {FunderRepository} from '../../repositories';

import {RabbitmqService, SubscriptionService} from '../../services';
import {KeycloakService} from '../../services/keycloak.service';
import {EVENT_MESSAGE, ISubscriptionPublishPayload, StatusCode} from '../../utils';

describe('Rabbitmq service', () => {
  let rabbitmqService: any = null;
  let amqpTest: any = null;
  let kcAdminAuth: any = null;
  let spy: any,
    subscriptionService: StubbedInstanceWithSinonAccessor<SubscriptionService>,
    funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>,
    keycloakService: StubbedInstanceWithSinonAccessor<KeycloakService>,
    parentProcessService: any;

  beforeEach(() => {
    subscriptionService = createStubInstance(SubscriptionService);
    funderRepository = createStubInstance(FunderRepository);
    keycloakService = createStubInstance(KeycloakService);

    keycloakService.keycloakAdmin = new KeycloakAdminClient();
    keycloakService.keycloakAdmin.accessToken = 'test';

    parentProcessService = new EventEmitter();

    rabbitmqService = new RabbitmqService(
      subscriptionService,
      funderRepository,
      parentProcessService,
      keycloakService,
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
      funderRepository.stubs.getEnterpriseHRISNameList.rejects();
      await rabbitmqService.getHRISEnterpriseNameList();
    } catch (error) {
      expect(error.message).to.equal('Error');
      expect(error.statusCode).to.equal(StatusCode.InternalServerError);

      funderRepository.stubs.getEnterpriseHRISNameList.restore();
    }
  });

  it('RabbitMQService getHRISEnterpriseNameList : success', async () => {
    const enterprise: Pick<Enterprise, 'name'> = new Enterprise({
      name: 'enterpriseName',
    });
    const enterpriseRepositoryList: Pick<Enterprise, 'name'>[] = [enterprise];
    const enterpriseRepositoryResult: string[] = [enterprise.name.toLowerCase()];
    funderRepository.stubs.getEnterpriseHRISNameList.resolves(enterpriseRepositoryList);
    const enterpriseNameList: string[] = await rabbitmqService.getHRISEnterpriseNameList();
    expect(enterpriseNameList).to.deepEqual(enterpriseRepositoryResult);
    funderRepository.stubs.getEnterpriseHRISNameList.restore();
  });

  it('RabbitMQService connect : error', async () => {
    try {
      kcAdminAuth = sinon.stub(keycloakService.keycloakAdmin, 'auth').resolves();
      amqpTest = sinon.stub(amqp, 'connect').rejects('err');
      await rabbitmqService.connect();
    } catch (error) {
      expect(error.message).to.equal('Error');
      expect(error.statusCode).to.equal(StatusCode.InternalServerError);
      amqpTest.restore();
      kcAdminAuth.restore();
    }
  });

  it('RabbitMQService connect : success', async () => {
    const connection: any = {
      createChannel: () => {},
    };
    kcAdminAuth = sinon.stub(keycloakService.keycloakAdmin, 'auth').resolves();
    amqpTest = sinon.stub(amqp, 'connect').resolves(connection);
    await rabbitmqService.connect();
    expect(rabbitmqService.connection).to.deepEqual(connection);
    amqpTest.restore();
    kcAdminAuth.restore();
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
      kcAdminAuth = sinon.stub(keycloakService.keycloakAdmin, 'auth').resolves();
      await rabbitmqService.connect();
      await rabbitmqService.disconnect();
    } catch (error) {
      expect(error.message).to.equal('Error');
      expect(error.statusCode).to.equal(StatusCode.InternalServerError);
      amqpTest.restore();
      kcAdminAuth.restore();
    }
  });

  it('RabbitMQService disconnect : success', async () => {
    const connection: any = {
      close: () => {},
    };
    amqpTest = sinon.stub(amqp, 'connect').resolves(connection);
    kcAdminAuth = sinon.stub(keycloakService.keycloakAdmin, 'auth').resolves();
    await rabbitmqService.connect();
    await rabbitmqService.disconnect();
    expect(rabbitmqService.connection).to.deepEqual(connection);
    amqpTest.restore();
    kcAdminAuth.restore();
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
      kcAdminAuth = sinon.stub(keycloakService.keycloakAdmin, 'auth').resolves();
      await rabbitmqService.connect();
      await rabbitmqService.openConnectionChannel();
    } catch (error) {
      expect(error.message).to.equal('Error');
      expect(error.statusCode).to.equal(StatusCode.InternalServerError);
      amqpTest.restore();
      kcAdminAuth.restore();
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
    kcAdminAuth = sinon.stub(keycloakService.keycloakAdmin, 'auth').resolves();
    await rabbitmqService.connect();
    const connectionOpen = await rabbitmqService.openConnectionChannel();
    expect(connectionOpen).to.deepEqual(channel);
    amqpTest.restore();
    kcAdminAuth.restore();
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
      kcAdminAuth = sinon.stub(keycloakService.keycloakAdmin, 'auth').resolves();
      await rabbitmqService.connect();
      await rabbitmqService.openConnectionChannel();
      await rabbitmqService.closeConnectionChannel(channel);
    } catch (error) {
      expect(error.message).to.equal('Error');
      expect(error.statusCode).to.equal(StatusCode.InternalServerError);
      amqpTest.restore();
      kcAdminAuth.restore();
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
    kcAdminAuth = sinon.stub(keycloakService.keycloakAdmin, 'auth').resolves();
    await rabbitmqService.connect();
    await rabbitmqService.openConnectionChannel();
    await rabbitmqService.closeConnectionChannel(channel);
    expect(rabbitmqService.connection).to.deepEqual(connection);
    amqpTest.restore();
    kcAdminAuth.restore();
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
      kcAdminAuth = sinon.stub(keycloakService.keycloakAdmin, 'auth').resolves();
      await rabbitmqService.publishMessage('test');
    } catch (error) {
      expect(error.message).to.equal('Error');
      expect(error.statusCode).to.equal(StatusCode.InternalServerError);
      expect(spy.openConnectionChannel.calledOnce).true();
      amqpTest.restore();
      kcAdminAuth.restore();
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
    kcAdminAuth = sinon.stub(keycloakService.keycloakAdmin, 'auth').resolves();
    await rabbitmqService.connect();
    await rabbitmqService.publishMessage('test', 'enterpriseName');
    expect(spy.openConnectionChannel.calledOnce).true();
    expect(spy.closeConnectionChannel.calledOnce).true();
    expect(spy.disconnect.calledOnce).true();
    amqpTest.restore();
    kcAdminAuth.restore();
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
      expect(error.message).to.equal('Error');
      expect(error.statusCode).to.equal(StatusCode.InternalServerError);
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

  it('RabbitMQService consume inside the catch 412: fail', async () => {
    try {
      const message = {
        content: '{"citizenId": "id","subscriptionId": "id"}',
      };
      const err = {
        statusCode: 412,
      };
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
      kcAdminAuth = sinon.stub(keycloakService.keycloakAdmin, 'auth').resolves();
      await rabbitmqService.connect();
      subscriptionService.stubs.handleMessage.rejects(err);
      subscriptionService.stubs.getSubscriptionPayload.resolves({
        subscription: {lastName: 'tst'} as ISubscriptionPublishPayload,
        enterprise: 'test',
      });
      await rabbitmqService.consumeMessage(message);
    } catch (err) {
      expect(err.message).to.equal('Error');
      expect(err.statusCode).to.equal(StatusCode.InternalServerError);
      subscriptionService.stubs.handleMessage.restore();
      subscriptionService.stubs.getSubscriptionPayload.restore();
      amqpTest.restore();
      kcAdminAuth.restore();
    }
  });
});

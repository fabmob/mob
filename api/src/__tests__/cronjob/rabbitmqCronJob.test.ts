import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';

import {EventEmitter} from 'events';

import {RabbitmqService} from '../../services';
import {RabbitmqCronJob} from '../../cronjob';
import {EVENT_MESSAGE, UPDATE_MODE} from '../../utils';

describe('Rabbitmq cronjob', () => {
  let rabbitmqCronjob: any = null;

  let clock: any,
    rabbitmqService: StubbedInstanceWithSinonAccessor<RabbitmqService>,
    parentProcessService: any;

  beforeEach(() => {
    rabbitmqService = createStubInstance(RabbitmqService);
    parentProcessService = new EventEmitter();
    rabbitmqCronjob = new RabbitmqCronJob(rabbitmqService, parentProcessService);
  });

  afterEach(() => {});

  it('Rabbitmq cronjob : performJob success', async () => {
    const enterpriseRepositoryResult: string[] = ['enterprise'];
    rabbitmqService.stubs.getHRISEnterpriseNameList.resolves(enterpriseRepositoryResult);
    sinon.spy(parentProcessService, 'emit');
    await rabbitmqCronjob.performJob();
    sinon.assert.calledWithExactly(parentProcessService.emit, EVENT_MESSAGE.UPDATE, {
      type: EVENT_MESSAGE.UPDATE,
      data: {[UPDATE_MODE.ADD]: enterpriseRepositoryResult, [UPDATE_MODE.DELETE]: []},
    });
    rabbitmqService.stubs.getHRISEnterpriseNameList.restore();
  });

  it('Rabbitmq cronjob : performJob error', async () => {
    sinon.spy(parentProcessService, 'emit');
    try {
      rabbitmqService.stubs.getHRISEnterpriseNameList.rejects();
      await rabbitmqCronjob.performJob();
    } catch (err) {
      expect(err.message).to.equal('An error occurred');
      expect(parentProcessService.emit.calledOnce).false();
      rabbitmqService.stubs.getHRISEnterpriseNameList.restore();
    }
  });

  it('Rabbitmq cronjob : get ready event', async () => {
    const rabbitStub = sinon.stub(rabbitmqCronjob, 'performJob').resolves();
    const fireStub = sinon.stub(rabbitmqCronjob, 'fireOnTick').resolves();
    const startStub = sinon.stub(rabbitmqCronjob, 'start').resolves();
    parentProcessService.emit(EVENT_MESSAGE.READY);
    sinon.assert.calledOnce(fireStub);
    sinon.assert.calledOnce(startStub);
    startStub.restore();
    fireStub.restore();
    rabbitStub.restore();
  });

  it('Rabbitmq cronjob : performJob no enterprise to update', async () => {
    const enterpriseRepositoryResult: string[] = [];
    rabbitmqService.stubs.getHRISEnterpriseNameList.resolves(enterpriseRepositoryResult);
    sinon.spy(parentProcessService, 'emit');
    await rabbitmqCronjob.performJob();
    expect(parentProcessService.emit.calledOnce).false();
    rabbitmqService.stubs.getHRISEnterpriseNameList.restore();
  });

  it('Rabbitmq cronjob : onTick', async () => {
    clock = sinon.useFakeTimers();
    const rabbitStub = sinon.stub(rabbitmqCronjob, 'performJob').resolves();
    parentProcessService.emit(EVENT_MESSAGE.READY);
    clock.tick(1 * 24 * 60 * 60 * 1000);
    sinon.assert.calledOnce(rabbitStub);
    rabbitStub.restore();
    clock.restore();
  });
});

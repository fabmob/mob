import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';

import {CronJobService, CitizenService} from '../../services';
import {InactiveAccountNotificationCronJob} from '../../cronjob';

import {CronJob} from '../../models';

describe('inactiveAccountNotification cronjob', () => {
  let inactiveAccountNotificationCronJob: any = null;

  let clock: any,
    cronJobService: StubbedInstanceWithSinonAccessor<CronJobService>,
    citizenService: StubbedInstanceWithSinonAccessor<CitizenService>;

  beforeEach(() => {
    cronJobService = createStubInstance(CronJobService);
    citizenService = createStubInstance(CitizenService);
    inactiveAccountNotificationCronJob = new InactiveAccountNotificationCronJob(
      cronJobService,
      citizenService,
    );
  });

  afterEach(() => {});

  it('inactiveAccountNotification cronjob : performJob success', async () => {
    cronJobService.stubs.getCronsLog.resolves([]);
    cronJobService.stubs.delCronLog.resolves();
    cronJobService.stubs.createCronLog.resolves();
    citizenService.stubs.notifyInactiveAccount.resolves();
    cronJobService.stubs.delCronLog.resolves();
    await inactiveAccountNotificationCronJob.performJob();
  });

  it('inactiveAccountNotification cronjob : performJob success with a log in DB', async () => {
    cronJobService.stubs.getCronsLog.resolves([mockCronLog]);
    cronJobService.stubs.delCronLog.resolves();
    cronJobService.stubs.createCronLog.resolves();
    citizenService.stubs.notifyInactiveAccount.resolves();
    cronJobService.stubs.delCronLog.resolves();
    await inactiveAccountNotificationCronJob.performJob();
  });

  it('inactiveAccountNotification cronjob : createCron error', async () => {
    try {
      cronJobService.stubs.createCronLog.resolves(new CronJob({id: 'randomId'}));
      citizenService.stubs.notifyInactiveAccount.rejects('Error');
      await inactiveAccountNotificationCronJob.createCron();
    } catch (err) {
      cronJobService.stubs.delCronLogById.resolves();
      expect(citizenService.stubs.notifyInactiveAccount.calledOnce).true();
      expect(err.message).equal('Error');
    }
  });

  it('inactiveAccountNotification cronjob : performJob error', async () => {
    try {
      cronJobService.stubs.getCronsLog.resolves([]);
      cronJobService.stubs.createCronLog.rejects();
      await inactiveAccountNotificationCronJob.performJob();
    } catch (err) {
      cronJobService.stubs.delCronLog.resolves();
      expect(citizenService.stubs.notifyInactiveAccount.calledOnce).false();
    }
  });

  it('inactiveAccountNotification cronjob : onTick', async () => {
    clock = sinon.useFakeTimers();
    const inactiveAccountNotificationStub = sinon
      .stub(inactiveAccountNotificationCronJob, 'performJob')
      .resolves();
    inactiveAccountNotificationCronJob.start();
    clock.tick(7 * 24 * 60 * 60 * 1000);
    sinon.assert.calledOnce(inactiveAccountNotificationStub);
    inactiveAccountNotificationStub.restore();
    clock.restore();
  });

  const mockCronLog = new CronJob({
    id: '123456',
    type: 'Notify_inactive_account',
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
  });
});

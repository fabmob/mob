import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';

import {CronJobService, CitizenService} from '../../services';
import {InactiveAccountDeletionCronJob} from '../../cronjob';

import {CronJob} from '../../models';

describe('inactiveAccountDeletion cronjob', () => {
  let inactiveAccountDeletionCronJob: any = null;

  let clock: any,
    cronJobService: StubbedInstanceWithSinonAccessor<CronJobService>,
    citizenService: StubbedInstanceWithSinonAccessor<CitizenService>;

  beforeEach(() => {
    cronJobService = createStubInstance(CronJobService);
    citizenService = createStubInstance(CitizenService);
    inactiveAccountDeletionCronJob = new InactiveAccountDeletionCronJob(cronJobService, citizenService);
  });

  afterEach(() => {});

  it('inactiveAccountDeletion cronjob : performJob success', async () => {
    cronJobService.stubs.getCronsLog.resolves([]);
    cronJobService.stubs.delCronLog.resolves();
    cronJobService.stubs.createCronLog.resolves();
    citizenService.stubs.deleteInactiveAccount.resolves();
    cronJobService.stubs.delCronLog.resolves();
    await inactiveAccountDeletionCronJob.performJob();
  });

  it('inactiveAccountDeletion cronjob : performJob success with a log in DB', async () => {
    cronJobService.stubs.getCronsLog.resolves([mockCronLog]);
    cronJobService.stubs.delCronLog.resolves();
    cronJobService.stubs.createCronLog.resolves();
    citizenService.stubs.deleteInactiveAccount.resolves();
    cronJobService.stubs.delCronLog.resolves();
    await inactiveAccountDeletionCronJob.performJob();
  });

  it('inactiveAccountDeletion cronjob : createCron error', async () => {
    try {
      cronJobService.stubs.createCronLog.resolves(new CronJob({id: 'randomId'}));
      citizenService.stubs.deleteInactiveAccount.rejects('Error');
      await inactiveAccountDeletionCronJob.createCron();
    } catch (err) {
      cronJobService.stubs.delCronLogById.resolves();
      expect(citizenService.stubs.deleteInactiveAccount.calledOnce).true();
      expect(err.message).equal('Error');
    }
  });

  it('inactiveAccountDeletion cronjob : performJob error', async () => {
    try {
      cronJobService.stubs.getCronsLog.resolves([]);
      cronJobService.stubs.createCronLog.rejects();
      await inactiveAccountDeletionCronJob.performJob();
    } catch (err) {
      cronJobService.stubs.delCronLog.resolves();
      expect(citizenService.stubs.deleteInactiveAccount.calledOnce).false();
    }
  });

  it('inactiveAccountDeletion cronjob : onTick', async () => {
    clock = sinon.useFakeTimers();
    const inactiveAccountDeletionStub = sinon.stub(inactiveAccountDeletionCronJob, 'performJob').resolves();
    inactiveAccountDeletionCronJob.start();
    clock.tick(7 * 24 * 60 * 60 * 1000);
    sinon.assert.calledOnce(inactiveAccountDeletionStub);
    inactiveAccountDeletionStub.restore();
    clock.restore();
  });

  const mockCronLog = new CronJob({
    id: '123456',
    type: 'Delete_inactive_account',
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
  });
});

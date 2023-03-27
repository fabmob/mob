import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';

import {CronJobService, CitizenService} from '../../services';
import {NonActivatedAccountDeletionCronJob} from '../../cronjob';

import {CronJob} from '../../models';

describe('nonActivatedAccountDeletion cronjob', () => {
  let inactifAccountDeletionCronJobs: any = null;

  let clock: any,
    cronJobService: StubbedInstanceWithSinonAccessor<CronJobService>,
    citizenService: StubbedInstanceWithSinonAccessor<CitizenService>;

  beforeEach(() => {
    cronJobService = createStubInstance(CronJobService);
    citizenService = createStubInstance(CitizenService);
    inactifAccountDeletionCronJobs = new NonActivatedAccountDeletionCronJob(cronJobService, citizenService);
  });

  afterEach(() => {});

  it('nonActivatedAccountDeletion cronjob : performJob success', async () => {
    cronJobService.stubs.getCronsLog.resolves([]);
    cronJobService.stubs.delCronLog.resolves();
    cronJobService.stubs.createCronLog.resolves();
    citizenService.stubs.accountDeletionService.resolves();
    cronJobService.stubs.delCronLog.resolves();
    await inactifAccountDeletionCronJobs.performJob();
  });

  it('nonActivatedAccountDeletion cronjob : performJob success with a log in DB', async () => {
    cronJobService.stubs.getCronsLog.resolves([mockCronLog]);
    cronJobService.stubs.delCronLog.resolves();
    cronJobService.stubs.createCronLog.resolves();
    citizenService.stubs.accountDeletionService.resolves();
    cronJobService.stubs.delCronLog.resolves();
    await inactifAccountDeletionCronJobs.performJob();
  });

  it('nonActivatedAccountDeletion cronjob : createCron error', async () => {
    try {
      cronJobService.stubs.createCronLog.resolves(new CronJob({id: 'randomId'}));
      citizenService.stubs.accountDeletionService.rejects('Error');
      await inactifAccountDeletionCronJobs.createCron();
    } catch (err) {
      cronJobService.stubs.delCronLogById.resolves();
      expect(citizenService.stubs.accountDeletionService.calledOnce).true();
      expect(err.message).equal('Error');
    }
  });

  it('nonActivatedAccountDeletion cronjob : performJob error', async () => {
    try {
      cronJobService.stubs.getCronsLog.resolves([]);
      cronJobService.stubs.createCronLog.rejects();
      await inactifAccountDeletionCronJobs.performJob();
    } catch (err) {
      cronJobService.stubs.delCronLog.resolves();
      expect(citizenService.stubs.accountDeletionService.calledOnce).false();
    }
  });

  it('nonActivatedAccountDeletion cronjob : onTick', async () => {
    clock = sinon.useFakeTimers();
    const inactifAccountDeletionStub = sinon.stub(inactifAccountDeletionCronJobs, 'performJob').resolves();
    inactifAccountDeletionCronJobs.start();
    clock.tick(7 * 24 * 60 * 60 * 1000);
    sinon.assert.calledOnce(inactifAccountDeletionStub);
    inactifAccountDeletionStub.restore();
    clock.restore();
  });

  const mockCronLog = new CronJob({
    id: '123456',
    type: 'Delete_non_activated_account',
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
  });
});

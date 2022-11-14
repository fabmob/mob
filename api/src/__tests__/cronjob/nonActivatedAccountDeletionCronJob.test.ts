import {
  createStubInstance,
  expect,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';

import {CronJobService, CitizenService} from '../../services';
import {NonActivatedAccountDeletionCronJob} from '../../cronjob';

import {CronJob} from '../../models';

describe('nonActivatedAccountDeletion cronjob', () => {
  let inactifAccountDeletionCronJobs: any = null;

  let cronJobService: StubbedInstanceWithSinonAccessor<CronJobService>,
    citizenService: StubbedInstanceWithSinonAccessor<CitizenService>;

  beforeEach(() => {
    cronJobService = createStubInstance(CronJobService);
    citizenService = createStubInstance(CitizenService);
    inactifAccountDeletionCronJobs = new NonActivatedAccountDeletionCronJob(
      cronJobService,
      citizenService,
    );
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

  it('nonActivatedAccountDeletion cronjob : performJob error', async () => {
    try {
      cronJobService.stubs.getCronsLog.resolves([]);
      cronJobService.stubs.createCronLog.rejects();
      await inactifAccountDeletionCronJobs.performJob();
    } catch (err) {
      expect(citizenService.stubs.accountDeletionService.calledOnce).false();
      cronJobService.stubs.delCronLog.resolves();
    }
  });

  const mockCronLog = new CronJob({
    id: '123456',
    type: 'Delete_user_account',
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
  });
});

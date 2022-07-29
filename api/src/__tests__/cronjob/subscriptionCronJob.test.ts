import {
  createStubInstance,
  expect,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';

import {CronJobService, SubscriptionService} from '../../services';
import {SubscriptionCronJob} from '../../cronjob';

import {CronJob} from '../../models';

describe('subscription cronjob', () => {
  let subscriptionCronjob: any = null;

  let cronJobService: StubbedInstanceWithSinonAccessor<CronJobService>,
    subscriptionService: StubbedInstanceWithSinonAccessor<SubscriptionService>;

  beforeEach(() => {
    cronJobService = createStubInstance(CronJobService);
    subscriptionService = createStubInstance(SubscriptionService);
    subscriptionCronjob = new SubscriptionCronJob(cronJobService, subscriptionService);
  });

  afterEach(() => {});

  it('subscription cronjob : performJob success', async () => {
    cronJobService.stubs.getCronsLog.resolves([]);
    cronJobService.stubs.createCronLog.resolves();
    subscriptionService.stubs.deleteSubscription.resolves();
    cronJobService.stubs.delCronLog.resolves();
    await subscriptionCronjob.performJob();
  });

  it('subscription cronjob : performJob success with a log in DB', async () => {
    cronJobService.stubs.getCronsLog.resolves([mockCronLog]);
    cronJobService.stubs.delCronLog.resolves();
    cronJobService.stubs.createCronLog.resolves();
    subscriptionService.stubs.deleteSubscription.resolves();
    cronJobService.stubs.delCronLog.resolves();
    await subscriptionCronjob.performJob();
  });

  it('subscription cronjob : performJob error', async () => {
    try {
      cronJobService.stubs.getCronsLog.resolves([]);
      cronJobService.stubs.createCronLog.rejects();
      await subscriptionCronjob.performJob();
    } catch (err) {
      expect(subscriptionService.stubs.deleteSubscription.calledOnce).false();
    }
  });

  const mockCronLog = new CronJob({
    id: '123456',
    type: 'Delete_subscription',
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
  });
});

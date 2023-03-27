import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';

import {CronJobService, SubscriptionService} from '../../services';
import {SubscriptionCronJob} from '../../cronjob';

import {CronJob} from '../../models';

describe('subscription cronjob', () => {
  let subscriptionCronjob: any = null;

  let clock: any,
    cronJobService: StubbedInstanceWithSinonAccessor<CronJobService>,
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

  it('subscription cronjob : createCron error', async () => {
    try {
      cronJobService.stubs.createCronLog.resolves(new CronJob({id: 'randomId'}));
      subscriptionService.stubs.deleteSubscription.rejects('Error');
      await subscriptionCronjob.createCron();
    } catch (err) {
      cronJobService.stubs.delCronLogById.resolves();
      expect(subscriptionService.stubs.deleteSubscription.calledOnce).true();
      expect(err.message).equal('Error');
    }
  });

  it('subscription cronjob : performJob error', async () => {
    try {
      cronJobService.stubs.getCronsLog.resolves([]);
      cronJobService.stubs.createCronLog.rejects();
      await subscriptionCronjob.performJob();
    } catch (err) {
      cronJobService.stubs.delCronLog.resolves();
      expect(subscriptionService.stubs.deleteSubscription.calledOnce).false();
    }
  });

  it('subscription cronjob : onTick', async () => {
    clock = sinon.useFakeTimers();
    const subscriptionCronJobStub = sinon.stub(subscriptionCronjob, 'performJob').resolves();
    subscriptionCronjob.start();
    clock.tick(7 * 24 * 60 * 60 * 1000);
    sinon.assert.calledOnce(subscriptionCronJobStub);
    subscriptionCronJobStub.restore();
    clock.restore();
  });

  const mockCronLog = new CronJob({
    id: '123456',
    type: 'Delete_subscription',
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
  });
});

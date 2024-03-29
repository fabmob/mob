import {service} from '@loopback/core';
import {CronJob, cronJob} from '@loopback/cron';

import {CronJobService, SubscriptionService} from '../services';
import {CronJob as CronJobModel} from '../models';

import {CRON_TYPES, Logger} from '../utils';
import {isAfterDate} from '../utils/date';

@cronJob()
export class SubscriptionCronJob extends CronJob {
  // Cron's type
  private cronType: string = CRON_TYPES.DELETE_SUBSCRIPTION;

  constructor(
    @service(CronJobService)
    public cronJobService: CronJobService,
    @service(SubscriptionService)
    public subscriptionService: SubscriptionService,
  ) {
    super({
      name: 'subscription-job',
      onTick: async () => {
        Logger.info(SubscriptionCronJob.name, 'onTick', 'ticked');
        await this.performJob();
      },
      cronTime: '0 0 5 * * 0', // At 05:00 on Sunday
      start: false,
    });
  }

  // cron process
  private async createCron(): Promise<void> {
    let createdCronId: CronJobModel | null = null;
    try {
      createdCronId = await this.cronJobService.createCronLog(this.cronType);
      Logger.info(SubscriptionCronJob.name, this.createCron.name, 'created');
      await this.subscriptionService.deleteSubscription();
      await this.cronJobService.delCronLog(this.cronType);
      Logger.info(SubscriptionCronJob.name, this.createCron.name, 'finished');
    } catch (error) {
      Logger.error(SubscriptionCronJob.name, this.createCron.name, 'Error', error);
      if (createdCronId && createdCronId.id) {
        await this.cronJobService.delCronLogById(createdCronId.id);
      }
      throw new Error(`${error}`);
    }
  }

  /**
   * Perform cron job
   */
  private async performJob(): Promise<void> {
    try {
      // Get active crons jobs
      const activeCronList: CronJobModel[] = await this.cronJobService.getCronsLog();

      // Check if this cron is already in use
      const cronAlreadyInUse: CronJobModel[] | [] = activeCronList.filter(
        (cron: CronJobModel) => cron.type === this.cronType,
      );
      if (cronAlreadyInUse?.[0]?.createdAt && isAfterDate(cronAlreadyInUse?.[0]?.createdAt, 2)) {
        // Delete old log
        await this.cronJobService.delCronLog(this.cronType);
      }

      await this.createCron();
    } catch (err) {
      Logger.error(SubscriptionCronJob.name, this.performJob.name, 'Error', err);
      throw err;
    }
  }
}

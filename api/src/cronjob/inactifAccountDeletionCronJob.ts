import {service} from '@loopback/core';
import {CronJob, cronJob} from '@loopback/cron';

import {CronJobService, CitizenService} from '../services';
import {CronJob as CronJobModel} from '../models';

import {CRON_TYPES, logger} from '../utils';
import {isAfterDate} from '../utils/date';

@cronJob()
export class inactifAccountDeletionCronJob extends CronJob {
  // Cron's type
  private cronType: string = CRON_TYPES.DELETE_SUBSCRIPTION;

  constructor(
    @service(CronJobService)
    public cronJobsService: CronJobService,
    @service(CitizenService)
    public citizenService: CitizenService,
  ) {
    super({
      name: 'inactifAccountDeletion-job',
      onTick: async () => {
        logger.info(`${inactifAccountDeletionCronJob.name} - ticked`);
        await this.performJob();
      },
      cronTime: '0 3 * * *',
      start: false,
    });
  }

  // cron process
  private async createCron(): Promise<void> {
    let createdCronId: CronJobModel | null = null;
    try {
      createdCronId = await this.cronJobsService.createCronLog(this.cronType);
      logger.info(`${inactifAccountDeletionCronJob.name} created`);
      await this.citizenService.accountDeletionService();
      await this.cronJobsService.delCronLog(this.cronType);
      logger.info(`${inactifAccountDeletionCronJob.name} finished`);
    } catch (error) {
      if (createdCronId && createdCronId.id) {
        await this.cronJobsService.delCronLogById(createdCronId.id);
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
      const activeCronList: CronJobModel[] = await this.cronJobsService.getCronsLog();

      // Check if this cron is already in use
      const cronAlreadyInUse: CronJobModel[] | [] = activeCronList.filter(
        (cron: CronJobModel) => cron.type === this.cronType,
      );
      if (
        cronAlreadyInUse?.[0]?.createdAt &&
        isAfterDate(cronAlreadyInUse?.[0]?.createdAt, 2)
      ) {
        // Delete old log
        await this.cronJobsService.delCronLog(this.cronType);
      }

      await this.createCron();
    } catch (err) {
      logger.error(`${inactifAccountDeletionCronJob.name}: ${err}`);
    }
  }
}

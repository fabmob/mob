import {injectable, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {CronJobRepository} from '../repositories';
import {CronJob} from '../models';

import {Logger} from '../utils';

@injectable({scope: BindingScope.TRANSIENT})
export class CronJobService {
  constructor(
    @repository(CronJobRepository)
    public cronJobRepository: CronJobRepository,
  ) {}

  /**
   * Get cron jobs logs
   * @returns an array with cron jobs id
   */
  async getCronsLog(): Promise<CronJob[]> {
    const activeCrons: CronJob[] = await this.cronJobRepository.find({});
    return activeCrons;
  }

  /**
   * create a new cron log
   * @returns  cron jobs data
   */
  async createCronLog(type: string): Promise<CronJob> {
    try {
      const createdCron: CronJob = await this.cronJobRepository.create({type});
      Logger.debug(CronJobService.name, this.createCronLog.name, 'Cron created', createdCron.id);
      return createdCron;
    } catch (error) {
      Logger.error(CronJobService.name, this.createCronLog.name, 'Error', error);
      throw error;
    }
  }

  /**
   * delete  cron log
   */
  async delCronLog(type: string): Promise<void> {
    try {
      await this.cronJobRepository.deleteAll({type: type});
      Logger.debug(CronJobService.name, this.delCronLog.name, 'Cron deleted', type);
    } catch (error) {
      Logger.error(CronJobService.name, this.delCronLog.name, 'Error', error);
      throw error;
    }
  }

  /**
   * delete  cron log by id
   */
  async delCronLogById(id: string): Promise<void> {
    try {
      await this.cronJobRepository.deleteById(id);
      Logger.debug(CronJobService.name, this.delCronLog.name, 'Cron deleted', id);
    } catch (error) {
      Logger.error(CronJobService.name, this.delCronLogById.name, 'Error', error);
      throw error;
    }
  }
}

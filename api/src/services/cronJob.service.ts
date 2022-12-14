import {injectable, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {CronJobRepository} from '../repositories';
import {CronJob} from '../models';

import {logger} from '../utils';

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
      return createdCron;
    } catch (error) {
      logger.error(`Failed to create a cron log: ${error}`);
      throw new Error(`An error occurred: ${error}`);
    }
  }

  /**
   * delete  cron log
   */
  async delCronLog(type: string): Promise<void> {
    try {
      await this.cronJobRepository.deleteAll({type: type});
    } catch (error) {
      logger.error(`Failed to delete a cron log: ${error}`);
      throw new Error(`An error occurred: ${error}`);
    }
  }

  /**
   * delete  cron log by id
   */
  async delCronLogById(id: string): Promise<void> {
    try {
      await this.cronJobRepository.deleteById(id);
    } catch (error) {
      logger.error(`Failed to delete a cron log: ${error}`);
      throw new Error(`An error occurred: ${error}`);
    }
  }
}

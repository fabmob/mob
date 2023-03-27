import {inject, service} from '@loopback/core';
import {CronJob, cronJob} from '@loopback/cron';

import {isEqual, difference} from 'lodash';

import {ParentProcessService, RabbitmqService} from '../services';
import {EVENT_MESSAGE, UPDATE_MODE, Logger} from '../utils';

@cronJob()
export class RabbitmqCronJob extends CronJob {
  private enterpriseHRISNameList: string[] = [];

  constructor(
    @service(RabbitmqService)
    public rabbitmqService: RabbitmqService,
    @inject('services.ParentProcessService')
    public parentProcessService: ParentProcessService,
  ) {
    super({
      name: 'rabbitmq-job',
      onTick: async () => {
        Logger.info(RabbitmqCronJob.name, 'onTick', 'ticked');
        await this.performJob();
      },
      cronTime: '0 0 2 * * *',
      start: false,
    });

    // Start cronjob once process is ready
    this.parentProcessService.on(EVENT_MESSAGE.READY, () => this.fireOnTick() && this.start());
  }

  /**
   * Perform cron job
   */
  private async performJob(): Promise<void> {
    try {
      const repositoryList: string[] = await this.rabbitmqService.getHRISEnterpriseNameList();

      // If arrays are the same, no need to send updated list
      if (!isEqual(repositoryList, this.enterpriseHRISNameList)) {
        // Find added HRIS enterprise
        const added: string[] = difference(repositoryList, this.enterpriseHRISNameList);

        // Find deleted HRIS enterprise
        const deleted: string[] = difference(this.enterpriseHRISNameList, repositoryList);

        this.enterpriseHRISNameList = repositoryList;
        this.parentProcessService.emit(EVENT_MESSAGE.UPDATE, {
          type: EVENT_MESSAGE.UPDATE,
          data: {[UPDATE_MODE.ADD]: added, [UPDATE_MODE.DELETE]: deleted},
        });
      }
    } catch (err) {
      Logger.error(RabbitmqCronJob.name, this.performJob.name, 'Error', err);
      throw new Error('An error occurred');
    }
  }
}

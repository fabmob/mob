import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {MongoDsDataSource} from '../datasources';
import {CronJob as CronJobModel, CronJobRelations} from '../models';

export class CronJobsRepository extends DefaultCrudRepository<
  CronJobModel,
  typeof CronJobModel.prototype.id,
  CronJobRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    super(CronJobModel, dataSource);
  }
}

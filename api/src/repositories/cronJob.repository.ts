import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {MongoDsDataSource} from '../datasources';
import {CronJob, CronJobRelations} from '../models';

export class CronJobRepository extends DefaultCrudRepository<
  CronJob,
  typeof CronJob.prototype.id,
  CronJobRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    super(CronJob, dataSource);
  }
}

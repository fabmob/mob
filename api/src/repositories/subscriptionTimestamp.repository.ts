import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {MongoDsDataSource} from '../datasources';
import {SubscriptionTimestamp, SubscriptionTimestampRelations} from '../models';

export class SubscriptionTimestampRepository extends DefaultCrudRepository<
  SubscriptionTimestamp,
  typeof SubscriptionTimestamp.prototype.id,
  SubscriptionTimestampRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    super(SubscriptionTimestamp, dataSource);
  }
}

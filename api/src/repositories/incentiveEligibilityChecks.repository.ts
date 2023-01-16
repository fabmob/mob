import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {MongoDsDataSource} from '../datasources';
import {IncentiveEligibilityChecks, IncentiveEligibilityChecksRelations} from '../models';

export class IncentiveEligibilityChecksRepository extends DefaultCrudRepository<
  IncentiveEligibilityChecks,
  typeof IncentiveEligibilityChecks.prototype.id,
  IncentiveEligibilityChecksRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    super(IncentiveEligibilityChecks, dataSource);
  }
}

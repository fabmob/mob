import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {TrackedIncentives, TrackedIncentivesRelations} from '../models';

export class TrackedIncentivesRepository extends DefaultCrudRepository<
  TrackedIncentives,
  typeof TrackedIncentives.prototype.id,
  TrackedIncentivesRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(TrackedIncentives, dataSource);
  }
}

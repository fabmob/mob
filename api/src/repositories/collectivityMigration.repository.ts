import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {MongoDsDataSource} from '../datasources';
import {CollectivityMigration, CollectivityMigrationRelations} from '../models';

export class CollectivityMigrationRepository extends DefaultCrudRepository<
  CollectivityMigration,
  typeof CollectivityMigration.prototype.id,
  CollectivityMigrationRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    super(CollectivityMigration, dataSource);
  }
}

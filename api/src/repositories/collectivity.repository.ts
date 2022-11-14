import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {MongoDsDataSource} from '../datasources';
import {Collectivity, CollectivityRelations} from '../models';

export class CollectivityRepository extends DefaultCrudRepository<
  Collectivity,
  typeof Collectivity.prototype.id,
  CollectivityRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    super(Collectivity, dataSource);
  }
}

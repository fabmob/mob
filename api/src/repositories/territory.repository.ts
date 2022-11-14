import {DefaultCrudRepository} from '@loopback/repository';
import {Territory, TerritoryRelations} from '../models';
import {MongoDsDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class TerritoryRepository extends DefaultCrudRepository<
  Territory,
  typeof Territory.prototype.id,
  TerritoryRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    super(Territory, dataSource);
  }
}

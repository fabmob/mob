import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {omit} from 'lodash';

import {MongoDsDataSource} from '../datasources';
import {CitizenMigration, CitizenMigrationRelations} from '../models';

export class CitizenMigrationRepository extends DefaultCrudRepository<
  CitizenMigration,
  typeof CitizenMigration.prototype.id,
  CitizenMigrationRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    CitizenMigration.definition.properties = omit(
      CitizenMigration.definition.properties,
      ['password'],
    );
    super(CitizenMigration, dataSource);
  }
}

import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {MongoDsDataSource} from '../datasources';
import {EnterpriseMigration, EnterpriseMigrationRelations} from '../models';

export class EnterpriseMigrationRepository extends DefaultCrudRepository<
  EnterpriseMigration,
  typeof EnterpriseMigration.prototype.id,
  EnterpriseMigrationRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    super(EnterpriseMigration, dataSource);
  }

  /**
   * Get all HRIS EnterpriseMigrations
   * @returns Promise<Pick<EnterpriseMigration, 'name'>[]>
   */
  async getHRISEnterpriseMigrationNameList(): Promise<Pick<EnterpriseMigration, 'name'>[]> {
    return this.find({where: {isHris: true}, fields: {name: true}});
  }
}

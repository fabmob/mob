import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {MongoDsDataSource} from '../datasources';
import {Enterprise, EnterpriseRelations} from '../models';

export class EnterpriseRepository extends DefaultCrudRepository<
  Enterprise,
  typeof Enterprise.prototype.id,
  EnterpriseRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    super(Enterprise, dataSource);
  }

  /**
   * Get all HRIS Enterprises
   * @returns Promise<Pick<Enterprise, 'name'>[]>
   */
  async getHRISEnterpriseNameList(): Promise<Pick<Enterprise, 'name'>[]> {
    return this.find({where: {isHris: true}, fields: {name: true}});
  }
}

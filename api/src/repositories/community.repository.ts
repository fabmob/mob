import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {param} from '@loopback/rest';

import {MongoDsDataSource} from '../datasources';
import {Community, CommunityRelations} from '../models';

export class CommunityRepository extends DefaultCrudRepository<
  Community,
  typeof Community.prototype.id,
  CommunityRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    super(Community, dataSource);
  }
  async findByFunderId(funderId: string): Promise<Community[]> {
    return this.find({where: {funderId}, order: ['name ASC']});
  }
}

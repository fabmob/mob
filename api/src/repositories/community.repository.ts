import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';

import {MongoDsDataSource} from '../datasources';

import {Community, CommunityRelations, Funder} from '../models';
import {FunderRepository} from './funder.repository';

export class CommunityRepository extends DefaultCrudRepository<
  Community,
  typeof Community.prototype.id,
  CommunityRelations
> {
  public readonly funder: BelongsToAccessor<Funder, typeof Funder.prototype.id>;

  constructor(
    @inject('datasources.mongoDS') dataSource: MongoDsDataSource,
    @repository.getter('FunderRepository')
    customerRepositoryGetter: Getter<FunderRepository>,
  ) {
    super(Community, dataSource);
    this.funder = this.createBelongsToAccessorFor('funder', customerRepositoryGetter);
    this.registerInclusionResolver('funder', this.funder.inclusionResolver);
  }
  async findByFunderId(funderId: string): Promise<Community[]> {
    return this.find({where: {funderId}, order: ['name ASC']});
  }
}

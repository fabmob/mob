import {inject, Getter} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  ReferencesManyAccessor,
  repository,
} from '@loopback/repository';
import {omit} from 'lodash';

import {MongoDsDataSource} from '../datasources';
import {User, UserRelations, Funder, Community} from '../models';
import {CommunityRepository} from './community.repository';
import {FunderRepository} from './funder.repository';

export class UserRepository extends DefaultCrudRepository<User, typeof User.prototype.id, UserRelations> {
  public readonly funder: BelongsToAccessor<Funder, typeof Funder.prototype.id>;
  public readonly community: ReferencesManyAccessor<Community, typeof Community.prototype.id>;

  constructor(
    @inject('datasources.mongoDS') dataSource: MongoDsDataSource,
    @repository.getter('FunderRepository')
    funderRepositoryGetter: Getter<FunderRepository>,
    @repository.getter('CommunityRepository')
    protected communityRepositoryGetter: Getter<CommunityRepository>,
  ) {
    User.definition.properties = omit(User.definition.properties, ['password', 'roles']);
    super(User, dataSource);
    this.funder = this.createBelongsToAccessorFor('funder', funderRepositoryGetter);
    this.registerInclusionResolver('funder', this.funder.inclusionResolver);
    this.community = this.createReferencesManyAccessorFor('community', communityRepositoryGetter);
    this.registerInclusionResolver('community', this.community.inclusionResolver);
  }
}

import {inject, Getter} from '@loopback/core';
import {
  DefaultCrudRepository,
  repository,
  ReferencesManyAccessor,
  BelongsToAccessor,
} from '@loopback/repository';
import {MongoDsDataSource} from '../datasources';
import {Incentive, IncentiveRelations, Territory, Funder} from '../models';
import {TerritoryRepository} from './territory.repository';
import {FunderRepository} from './funder.repository';

export class IncentiveRepository extends DefaultCrudRepository<
  Incentive,
  typeof Incentive.prototype.id,
  IncentiveRelations
> {
  public readonly territories: ReferencesManyAccessor<Territory, typeof Incentive.prototype.id>;
  public readonly funder: BelongsToAccessor<Funder, typeof Funder.prototype.id>;

  constructor(
    @inject('datasources.mongoDS') dataSource: MongoDsDataSource,
    @repository.getter('TerritoryRepository')
    protected territoryRepositoryGetter: Getter<TerritoryRepository>,
    @repository.getter('FunderRepository')
    protected funderRepositoryGetter: Getter<FunderRepository>,
  ) {
    super(Incentive, dataSource);
    this.territories = this.createReferencesManyAccessorFor('territories', territoryRepositoryGetter);
    this.registerInclusionResolver('territories', this.territories.inclusionResolver);
    this.funder = this.createBelongsToAccessorFor('funder', funderRepositoryGetter);
    this.registerInclusionResolver('funder', this.funder.inclusionResolver);
    (this.modelClass as any).observe('persist', async (ctx: any) => {
      ctx.data.updatedAt = new Date();
    });
  }
}

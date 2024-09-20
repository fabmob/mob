import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';

import {MongoDsDataSource} from '../datasources';
import {Affiliation, Citizen, UserEntity} from '../models';
import {AFFILIATION_STATUS} from '../utils';
import {UserEntityRepository} from './idp';

export class AffiliationRepository extends DefaultCrudRepository<
  Affiliation,
  typeof Affiliation.prototype.id
> {
  public readonly user: BelongsToAccessor<UserEntity, typeof Affiliation.prototype.id>;

  constructor(
    @inject('datasources.mongoDS') dataSource: MongoDsDataSource,
    @repository.getter('UserEntityRepository')
    userEntityRepositoryGetter: Getter<UserEntityRepository>,
  ) {
    super(Affiliation, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userEntityRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  /**
   * Creates affiliation based on enterpriseEmail, enterpriseId and enterprise manual affiliation
   * @param citizen Citizen
   * @param hasManualAffiliation boolean
   * @param isAutoAffiliated boolean
   * @returns Promise<Affiliation>
   */
  async createAffiliation(citizen: Citizen, hasManualAffiliation: boolean, isAutoAffiliated?: boolean): Promise<Affiliation> {
     // Create object : affiliation
    const rawAffiliation: Affiliation = new Affiliation(citizen.affiliation);
   // Set enterpriseEmail & enterpriseId to null if not present
    rawAffiliation.enterpriseEmail = rawAffiliation?.enterpriseEmail || null;
    rawAffiliation.enterpriseId = rawAffiliation?.enterpriseId || null;

    // Handle affiliation status
    if (
      (rawAffiliation.enterpriseEmail && rawAffiliation.enterpriseId) ||
      (!rawAffiliation.enterpriseEmail && rawAffiliation.enterpriseId && hasManualAffiliation)
    ) {
      rawAffiliation.status = AFFILIATION_STATUS.TO_AFFILIATE;
    } else {
      rawAffiliation.status = AFFILIATION_STATUS.UNKNOWN;
    }

    if (isAutoAffiliated) {
      rawAffiliation.status = AFFILIATION_STATUS.AFFILIATED;
    }

    // Assign citizenId
    rawAffiliation.citizenId = citizen.id;

    const affiliation: Affiliation = await this.create(rawAffiliation);

    return affiliation;
  }
}

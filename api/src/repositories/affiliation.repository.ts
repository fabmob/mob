import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {MongoDsDataSource} from '../datasources';
import {Affiliation, Citizen} from '../models';
import {AFFILIATION_STATUS} from '../utils';

export class AffiliationRepository extends DefaultCrudRepository<
  Affiliation,
  typeof Affiliation.prototype.id
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    super(Affiliation, dataSource);
  }

  /**
   * Creates affiliation based on enterpriseEmail, enterpriseId and enterprise manual affiliation
   * @param citizen Citizen
   * @param hasManualAffiliation boolean
   * @returns Promise<Affiliation>
   */
  async createAffiliation(
    citizen: Citizen,
    hasManualAffiliation: boolean,
  ): Promise<Affiliation> {
    // Create object : affiliation
    const rawAffiliation: Affiliation = new Affiliation(citizen.affiliation);
    // Set enterpriseEmail & enterpriseId to null if not present
    rawAffiliation.enterpriseEmail = rawAffiliation?.enterpriseEmail || null;
    rawAffiliation.enterpriseId = rawAffiliation?.enterpriseId || null;

    // Handle affiliation status
    if (
      (rawAffiliation.enterpriseEmail && rawAffiliation.enterpriseId) ||
      (!rawAffiliation.enterpriseEmail &&
        rawAffiliation.enterpriseId &&
        hasManualAffiliation)
    ) {
      rawAffiliation.status = AFFILIATION_STATUS.TO_AFFILIATE;
    } else {
      rawAffiliation.status = AFFILIATION_STATUS.UNKNOWN;
    }

    // Assign citizenId
    rawAffiliation.citizenId = citizen.id;

    const affiliation: Affiliation = await this.create(rawAffiliation);

    return affiliation;
  }
}
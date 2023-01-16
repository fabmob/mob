import {expect} from '@loopback/testlab';

import {AffiliationRepository} from '../../repositories';
import {AFFILIATION_STATUS} from '../../utils';
import {testdbMongo} from './testdb.datasource';

describe('Affiliation repository (unit)', () => {
  let repository: AffiliationRepository;

  beforeEach(() => {
    repository = new AffiliationRepository(testdbMongo);
  });

  describe('Affiliation Repository', async () => {
    it('Create Affiliation : successful with mail and id provided', async () => {
      const citizen = Object.assign({
        id: 'citizenId',
        affiliation: {
          enterpriseEmail: 'toto@example.com',
          enterpriseId: 'affId',
        },
      });
      const result = await repository.createAffiliation(citizen, false);

      expect(result.id).to.not.null;
      expect(result.enterpriseEmail).to.equal(citizen.affiliation.enterpriseEmail);
      expect(result.enterpriseId).to.equal(citizen.affiliation.enterpriseId);
      expect(result.status).to.equal(AFFILIATION_STATUS.TO_AFFILIATE);
    });
    it('Create Affiliation : successful with id provided and hasManualAffiliation', async () => {
      const citizen = Object.assign({
        id: 'citizenId',
        affiliation: {
          enterpriseId: 'affId',
        },
      });
      const result = await repository.createAffiliation(citizen, true);

      expect(result.id).to.not.null;
      expect(result.enterpriseEmail).to.be.null;
      expect(result.enterpriseId).to.equal(citizen.affiliation.enterpriseId);
      expect(result.status).to.equal(AFFILIATION_STATUS.TO_AFFILIATE);
    });
    it('Create Affiliation : successful with id or mail not provided', async () => {
      const citizen = Object.assign({
        id: 'citizenId',
        affiliation: {
          enterpriseId: 'affId',
        },
      });
      const result = await repository.createAffiliation(citizen, false);

      expect(result.id).to.not.null;
      expect(result.enterpriseEmail).to.be.null;
      expect(result.enterpriseId).to.equal(citizen.affiliation.enterpriseId);
      expect(result.status).to.equal(AFFILIATION_STATUS.UNKNOWN);
    });
  });
});

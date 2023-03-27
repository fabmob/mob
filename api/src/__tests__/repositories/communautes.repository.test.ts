import {createStubInstance, expect, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';

import {CommunityRepository, FunderRepository} from '../../repositories';
import {testdbMongo} from './testdb.datasource';

describe('Community repository (unit)', () => {
  let repository: CommunityRepository, funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>;

  beforeEach(() => {
    repository = new CommunityRepository(testdbMongo, async () => funderRepository);
  });

  describe('Community', () => {
    it('Community findByFunderId : successful', async () => {
      const result = await repository.findByFunderId('757fa925-bcd9-4d88-a071-b6b189377029');
      expect(result).to.deepEqual([]);
    });
  });
});

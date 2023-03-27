import {createStubInstance, expect, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';

import {CommunityRepository} from '../../../repositories';
import {FunderV1Controller} from '../../../controllers/external';
import {Community} from '../../../models';

/**
 * TODO: REMOVING DEPRECATED ENDPOINT v1/maas/funder/{funderId}/communities.
 * Remove this file 🏌️‍♀️
 */
describe('funderV1Controller (unit)', () => {
  let communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>,
    controller: FunderV1Controller;

  beforeEach(() => {
    givenStubbedRepository();
    controller = new FunderV1Controller(communityRepository);
  });

  const community: Community = new Community({
    id: 'randomInputId',
    name: 'RabbitCo',
  });
  describe('FunderV1Controller', () => {
    it('FunderV1Controller findCommunitiesByFunderId : successful', async () => {
      communityRepository.stubs.findByFunderId.resolves([community]);
      const result = await controller.findCommunitiesByFunderId('randomInputId');
      expect(result[0].id).to.equal(community.id);
    });
    it('FunderV1Controller findCommunitiesByFunderId : fail', async () => {
      try {
        communityRepository.stubs.findByFunderId.rejects();
        await controller.findCommunitiesByFunderId('Id');
      } catch (error) {
        expect(error.message).equal('Error');
      }
    });
  });
  function givenStubbedRepository() {
    communityRepository = createStubInstance(CommunityRepository);
  }
});

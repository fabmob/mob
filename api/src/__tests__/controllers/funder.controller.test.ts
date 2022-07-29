import {
  createStubInstance,
  expect,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';

import {FunderController} from '../../controllers';
import {Collectivity, Community, Enterprise} from '../../models';
import {FunderService} from '../../services';

import {
  CommunityRepository,
  EnterpriseRepository,
  CollectivityRepository,
} from '../../repositories';
import {ValidationError} from '../../validationError';
import {FUNDER_TYPE, ResourceName, StatusCode} from '../../utils';

describe('Funder Controller ', () => {
  let collectivityRepository: StubbedInstanceWithSinonAccessor<CollectivityRepository>,
    communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>,
    enterpriseRepository: StubbedInstanceWithSinonAccessor<EnterpriseRepository>,
    funderService: StubbedInstanceWithSinonAccessor<FunderService>,
    controller: FunderController;

  beforeEach(() => {
    givenStubbedCollectivityRepository();
    givenStubbedCommunityRepository();
    givenStubbedEnterpriseRepository();
    givenStubbedFunderService();
    controller = new FunderController(
      communityRepository,
      enterpriseRepository,
      collectivityRepository,
      funderService,
    );
  });

  it('get(/v1/funders)', async () => {
    funderService.stubs.getFunders.resolves(mockReturnFunder);
    const result = await controller.find();

    expect(result).to.deepEqual(mockReturnFunder);
    funderService.stubs.getFunders.restore();
  });

  it('FunderController create : succeeded-enterprise', async () => {
    const community = new Community({name: 'random', funderId: 'randomId'});

    communityRepository.stubs.find.resolves([]);
    enterpriseRepository.stubs.find.resolves([
      new Enterprise({name: 'randomEnterprise'}),
    ]);
    communityRepository.stubs.create.resolves(community);

    const res = await controller.create(community);
    expect(res).to.deepEqual(community);
  });

  it('FunderController create : succeeded-collectivity', async () => {
    const community = new Community({name: 'random', funderId: 'randomId'});

    communityRepository.stubs.find.resolves([]);
    enterpriseRepository.stubs.find.resolves([]);
    collectivityRepository.stubs.find.resolves([
      new Collectivity({name: 'randomEnterprise'}),
    ]);
    communityRepository.stubs.create.resolves(community);

    const res = await controller.create(community);
    expect(res).to.deepEqual(community);
  });

  it('FunderController create : fails because name already exists', async () => {
    const community = new Community({name: 'random', funderId: 'randomId'});
    const communityExisted = new Community({name: 'random', funderId: 'randomId2'});

    const error = new ValidationError(
      `communities.error.name.unique`,
      `/communities`,
      StatusCode.UnprocessableEntity,
      ResourceName.Community,
    );
    try {
      communityRepository.stubs.find.resolves([communityExisted]);

      await controller.create(community);
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('FunderController create : fails because funder is not present', async () => {
    const community = new Community({name: 'random', funderId: 'randomId'});
    const error = new ValidationError(
      `communities.error.funders.missed`,
      `/communities`,
      StatusCode.UnprocessableEntity,
      ResourceName.Community,
    );

    communityRepository.stubs.find.resolves([]);
    enterpriseRepository.stubs.find.resolves([]);
    collectivityRepository.stubs.find.resolves([]);
    try {
      const res = await controller.create(community);
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('FunderController get by funderId : successful', async () => {
    const funderId = 'randomFunderId';
    const communitiesResult: [] = [];
    communityRepository.stubs.findByFunderId.resolves(communitiesResult);
    const res = await controller.findByFunderId(funderId);

    expect(res).to.deepEqual(communitiesResult);
  });

  it('FunderController count : successful', async () => {
    const countRes = {
      count: 10,
    };

    communityRepository.stubs.count.resolves(countRes);
    const result = await controller.count();

    expect(result).to.deepEqual(countRes);
  });

  it('FunderController v1/funders/communities', async () => {
    communityRepository.stubs.find.resolves([newCommunity]);
    funderService.stubs.getFunders.resolves(mockReturnFunder);
    const result = await controller.findCommunities();

    expect(result).to.deepEqual([mockAllCommunities]);
    funderService.stubs.getFunders.restore();
    communityRepository.stubs.find.restore();
  });

  function givenStubbedCollectivityRepository() {
    collectivityRepository = createStubInstance(CollectivityRepository);
  }

  function givenStubbedCommunityRepository() {
    communityRepository = createStubInstance(CommunityRepository);
  }

  function givenStubbedFunderService() {
    funderService = createStubInstance(FunderService);
  }

  function givenStubbedEnterpriseRepository() {
    enterpriseRepository = createStubInstance(EnterpriseRepository);
  }
});

const mockCollectivity = new Collectivity({
  id: 'randomInputIdCollectivity',
  name: 'nameCollectivity',
  citizensCount: 10,
  mobilityBudget: 12,
});

const mockEnterprise = new Enterprise({
  id: 'randomInputIdEnterprise',
  emailFormat: ['test@outlook.com', 'test@outlook.fr', 'test@outlook.xxx'],
  name: 'nameEnterprise',
  siretNumber: 50,
  employeesCount: 2345,
  budgetAmount: 102,
});

const mockReturnFunder = [
  {...mockCollectivity, funderType: FUNDER_TYPE.collectivity},
  {...mockEnterprise, funderType: FUNDER_TYPE.enterprise},
];

const newCommunity = new Community({
  id: '6175d61442ebca0660ddf3fb',
  name: 'fio',
  funderId: 'randomInputIdEnterprise',
});

const mockAllCommunities = {
  funderId: 'randomInputIdEnterprise',
  funderName: 'nameEnterprise',
  funderType: 'Entreprise',
  id: '6175d61442ebca0660ddf3fb',
  name: 'fio',
};

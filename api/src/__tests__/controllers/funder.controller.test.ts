import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {FunderController} from '../../controllers';
import {
  Collectivity,
  Community,
  Enterprise,
  EncryptionKey,
  PrivateKeyAccess,
  Client,
} from '../../models';
import {FunderService} from '../../services';

import {
  CommunityRepository,
  EnterpriseRepository,
  CollectivityRepository,
  ClientScopeRepository,
} from '../../repositories';
import {ValidationError} from '../../validationError';
import {FUNDER_TYPE, ResourceName, StatusCode, IUser} from '../../utils';
import {Clients} from 'keycloak-admin/lib/resources/clients';

describe('Funder Controller ', () => {
  let collectivityRepository: StubbedInstanceWithSinonAccessor<CollectivityRepository>,
    communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>,
    enterpriseRepository: StubbedInstanceWithSinonAccessor<EnterpriseRepository>,
    clientScopeRepository: StubbedInstanceWithSinonAccessor<ClientScopeRepository>,
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
      clientScopeRepository,
    );
  });

  it('get(/v1/funders)', async () => {
    funderService.stubs.getFunders.resolves(mockReturnFunder);
    const result = await controller.find();

    expect(result).to.deepEqual(mockReturnFunder);
    funderService.stubs.getFunders.restore();
  });

  it('FunderController create : succeeded-enterprise', async () => {
    const community = new Community({
      name: 'random',
      funderId: 'randomId',
    });

    communityRepository.stubs.find.resolves([]);
    enterpriseRepository.stubs.find.resolves([
      new Enterprise({name: 'randomEnterprise'}),
    ]);
    communityRepository.stubs.create.resolves(community);

    const res = await controller.create(community);
    expect(res).to.deepEqual(community);
  });

  it('FunderController create : succeeded-collectivity', async () => {
    const community = new Community({
      name: 'random',
      funderId: 'randomId',
    });

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
    const community = new Community({
      name: 'random',
      funderId: 'randomId',
    });
    const communityExisted = new Community({
      name: 'random',
      funderId: 'randomId2',
    });

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
    const community = new Community({
      name: 'random',
      funderId: 'randomId',
    });
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

  it('encryption_key : asserts encryption key has been stored for collectivity', async () => {
    collectivityRepository.stubs.findOne.resolves(mockCollectivity2);
    collectivityRepository.stubs.updateById.resolves();
    enterpriseRepository.stubs.create.resolves(undefined);
    await controller.storeEncryptionKey(mockCollectivity2.id, mockencryptionKeyValid);
    sinon.assert.called(collectivityRepository.stubs.updateById);
  });

  it('encryption_key : asserts encryption key has been stored for enterprise', async () => {
    collectivityRepository.stubs.findOne.resolves(undefined);
    enterpriseRepository.stubs.updateById.resolves();
    enterpriseRepository.stubs.findOne.resolves(mockEnterprise);
    await controller.storeEncryptionKey(mockEnterprise.id, mockencryptionKeyValid);
    sinon.assert.called(enterpriseRepository.stubs.updateById);
  });

  it('findFunderById : returns enterprise when funder is of type enterprise', async () => {
    collectivityRepository.stubs.findOne.resolves(undefined);
    enterpriseRepository.stubs.findOne.resolves(mockEnterprise);
    const enterprise = await controller.findFunderById(mockEnterprise.id);
    expect(enterprise).to.deepEqual(mockEnterprise);
  });

  it('findFunderById : returns collectivity when funder is of type collectivity', async () => {
    collectivityRepository.stubs.findOne.resolves(mockCollectivity);
    enterpriseRepository.stubs.findOne.resolves(undefined);
    const collectivity = await controller.findFunderById(mockCollectivity.id);
    expect(collectivity).to.deepEqual(mockCollectivity);
  });

  it('findClients : returns list of clients', async () => {
    clientScopeRepository.stubs.getClients.resolves(mockClientsList);
    const clients = await controller.findClients();
    expect(clients).to.deepEqual(mockClientsList);
  });

  it('findFunderById : throws error when funder not found', async () => {
    const funderNotFoundError = new ValidationError(
      `Funder not found`,
      `/Funder`,
      StatusCode.NotFound,
      ResourceName.Funder,
    );
    try {
      collectivityRepository.stubs.findOne.resolves(undefined);
      enterpriseRepository.stubs.findOne.resolves(undefined);
      await controller.findFunderById('wrongFunderId');
      sinon.assert.fail();
    } catch (error) {
      expect(error).to.deepEqual(funderNotFoundError);
    }
  });

  function givenStubbedCollectivityRepository() {
    collectivityRepository = createStubInstance(CollectivityRepository);
  }

  function givenStubbedCommunityRepository() {
    communityRepository = createStubInstance(CommunityRepository);
    clientScopeRepository = createStubInstance(ClientScopeRepository);
  }

  function givenStubbedFunderService() {
    funderService = createStubInstance(FunderService);
  }

  function givenStubbedEnterpriseRepository() {
    enterpriseRepository = createStubInstance(EnterpriseRepository);
  }
});

const today = new Date();
const expirationDate = new Date(today.setMonth(today.getMonth() + 7));
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApkUKTww771tjeFsYFCZq
n76SSpOzolmtf9VntGlPfbP5j1dEr6jAuTthQPoIDaEed6P44yyL3/1GqWJMgRbf
n8qqvnu8dH8xB+c9+er0tNezafK9eK37RqzsTj7FNW2Dpk70nUYncTiXxjf+ofLq
sokEIlp2zHPEZce2o6jAIoFOV90MRhJ4XcCik2w3IljxdJSIfBYX2/rDgEVN0T85
OOd9ChaYpKCPKKfnpvhjEw+KdmzUFP1u8aao2BNKyI2C+MHuRb1wSIu2ZAYfHgoG
X6FQc/nXeb1cAY8W5aUXOP7ITU1EtIuCD8WuxXMflS446vyfCmJWt+OFyveqgJ4n
owIDAQAB
-----END PUBLIC KEY-----
`;

const mockencryptionKeyValid = new EncryptionKey({
  id: '62977dc80929474f84c403de',
  version: 1,
  publicKey,
  expirationDate,
  lastUpdateDate: new Date(),
  privateKeyAccess: new PrivateKeyAccess(
    new PrivateKeyAccess({loginURL: 'loginURL', getKeyURL: 'getKeyURL'}),
  ),
});

const mockClientsList = [
  {
    clientId: '62977dc80929474f84c403de',
  } as Client,
];
const mockencryptionKeyNogetKeyURL = new EncryptionKey({
  id: '62977dc80929474f84c403de',
  version: 1,
  publicKey,
  expirationDate,
  lastUpdateDate: new Date(),
});

const mockCollectivity2 = new Collectivity({
  id: '2b6ee373-4c5b-403b-afe5-3bf3cbd2473c',
  name: 'Mulhouse',
  citizensCount: 1,
  mobilityBudget: 1,
  encryptionKey: mockencryptionKeyValid,
});

const mockCollectivity = new Collectivity({
  id: 'randomInputIdCollectivity',
  name: 'nameCollectivity',
  citizensCount: 10,
  mobilityBudget: 12,
  encryptionKey: mockencryptionKeyValid,
});

const mockEnterprise = new Enterprise({
  id: 'randomInputIdEnterprise',
  emailFormat: ['test@outlook.com', 'test@outlook.fr', 'test@outlook.xxx'],
  name: 'nameEnterprise',
  siretNumber: 50,
  employeesCount: 2345,
  budgetAmount: 102,
  encryptionKey: mockencryptionKeyValid,
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

const currentUser: IUser = {
  id: 'idUser',
  emailVerified: true,
  maas: undefined,
  membership: ['/entreprises/Capgemini'],
  roles: ['gestionnaires'],
  [securityId]: 'idEnterprise',
};

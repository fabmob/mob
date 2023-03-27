import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {FunderController} from '../../controllers';
import {
  Collectivity,
  Community,
  EncryptionKey,
  Enterprise,
  EnterpriseDetails,
  Funder,
  NationalAdministration,
  PrivateKeyAccess,
  UserEntity,
} from '../../models';
import {
  ClientScopeRepository,
  CommunityRepository,
  FunderRepository,
  UserEntityRepository,
} from '../../repositories';
import {CitizenService, KeycloakService, SubscriptionService} from '../../services';
import {AFFILIATION_STATUS, FUNDER_TYPE, GROUPS, IUser, PartialCitizen, ResourceName} from '../../utils';
import {BadRequestError} from '../../validationError';

describe('Funder Controller ', () => {
  let funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>,
    communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>,
    clientScopeRepository: StubbedInstanceWithSinonAccessor<ClientScopeRepository>,
    userEntityRepository: StubbedInstanceWithSinonAccessor<UserEntityRepository>,
    keycloakService: StubbedInstanceWithSinonAccessor<KeycloakService>,
    citizenService: StubbedInstanceWithSinonAccessor<CitizenService>,
    subscriptionService: StubbedInstanceWithSinonAccessor<SubscriptionService>,
    funderController: FunderController;

  const responseOK: any = {
    status: function () {
      return this;
    },
    contentType: function () {
      return this;
    },
    send: (body: any) => body,
  };

  beforeEach(() => {
    const currentUser: IUser = {
      id: 'idEnterprise',
      emailVerified: true,
      maas: undefined,
      membership: ['/entreprises/Capgemini'],
      funderType: FUNDER_TYPE.ENTERPRISE,
      roles: ['gestionnaires'],
      [securityId]: 'idEnterprise',
    };

    givenStubbedRepository();
    givenStubbedService();
    funderController = new FunderController(
      responseOK,
      funderRepository,
      communityRepository,
      clientScopeRepository,
      userEntityRepository,
      keycloakService,
      citizenService,
      subscriptionService,
      currentUser,
    );
  });

  function givenStubbedRepository() {
    funderRepository = createStubInstance(FunderRepository);
    communityRepository = createStubInstance(CommunityRepository);
    clientScopeRepository = createStubInstance(ClientScopeRepository);
    userEntityRepository = createStubInstance(UserEntityRepository);
  }

  function givenStubbedService() {
    keycloakService = createStubInstance(KeycloakService);
    citizenService = createStubInstance(CitizenService);
    subscriptionService = createStubInstance(SubscriptionService);
  }

  it('FunderController POST v1/funders NationalAdministration: OK', async () => {
    keycloakService.stubs.createGroupKc.resolves({id: 'funderNationalId'});
    funderRepository.stubs.create.resolves(funderNational);

    const result = await funderController.create(funderNational);
    sinon.assert.calledOnceWithExactly(
      keycloakService.stubs.createGroupKc,
      funderNational.name,
      GROUPS.administrations_nationales,
    );
    expect(keycloakService.stubs.addUserGroupMembership).not.called;
    expect(result).to.deepEqual(funderNational);
  });

  it('FunderController POST v1/funders Collectivity: OK', async () => {
    keycloakService.stubs.createGroupKc.resolves({id: 'funderCollectivityId'});
    funderRepository.stubs.create.resolves(funderCollectivity);

    const result = await funderController.create(funderCollectivity);
    sinon.assert.calledOnceWithExactly(
      keycloakService.stubs.createGroupKc,
      funderCollectivity.name,
      GROUPS.collectivities,
    );
    expect(keycloakService.stubs.addUserGroupMembership).not.called;
    expect(result).to.deepEqual(funderCollectivity);
  });

  it('FunderController POST v1/funders Enterprise: OK', async () => {
    keycloakService.stubs.createGroupKc.resolves({id: 'funderEnterpriseId'});
    funderRepository.stubs.create.resolves(funderEnterprise);
    userEntityRepository.stubs.getServiceUser.resolves({id: 'enterpriseClientId'} as UserEntity);

    const result = await funderController.create(funderEnterprise);
    sinon.assert.calledOnceWithExactly(
      keycloakService.stubs.createGroupKc,
      funderEnterprise.name,
      GROUPS.enterprises,
    );
    sinon.assert.calledOnceWithExactly(
      keycloakService.stubs.addUserGroupMembership,
      'enterpriseClientId',
      funderEnterprise.id,
    );
    expect(result).to.deepEqual(funderEnterprise);
  });

  it('FunderController POST v1/funders : Mongo ERROR', async () => {
    try {
      keycloakService.stubs.createGroupKc.resolves({id: 'funderEnterpriseId'});
      funderRepository.stubs.create.rejects(new Error('Error'));
      keycloakService.stubs.deleteGroupKc.resolves();
      await funderController.create(funderEnterprise);
    } catch (err) {
      sinon.assert.calledOnceWithExactly(keycloakService.stubs.deleteGroupKc, funderEnterprise.id);
      expect(err.message).to.equal('Error');
    }
  });

  it('FunderController GET /v1/funders/count: OK', async () => {
    const funderCount = {
      count: 12,
    };
    funderRepository.stubs.count.resolves(funderCount);
    const result = await funderController.count();
    expect(result).to.deepEqual(funderCount);
  });

  it('FunderController GET /v1/funders/count: Mongo ERROR', async () => {
    try {
      funderRepository.stubs.count.rejects(new Error('Error'));
      await funderController.count();
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
  });

  it('FunderController GET /v1/funders: OK', async () => {
    funderRepository.stubs.find.resolves([funderNational]);
    const result = await funderController.find();
    expect(result).to.deepEqual([funderNational]);
  });

  it('FunderController GET /v1/funders: Mongo ERROR', async () => {
    try {
      funderRepository.stubs.find.rejects(new Error('Error'));
      await funderController.find();
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
  });

  it('FunderController GET /v1/funders/{funderId}: OK', async () => {
    funderRepository.stubs.findById.resolves(funderNational);
    const result = await funderController.findById('funderNationalId');
    expect(result).to.deepEqual(funderNational);
  });

  it('FunderController GET /v1/funders/{funderId}: Mongo ERROR', async () => {
    try {
      funderRepository.stubs.findById.rejects(new Error('Error'));
      await funderController.findById('funderNationalId');
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
  });

  it('FunderController PUT /v1/funders/{funderId}/encryption_key: Mongo ERROR', async () => {
    try {
      funderRepository.stubs.findById.rejects(new Error('Error'));

      await funderController.storeEncryptionKey(funderCollectivity.id, mockencryptionKeyValid);
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
  });

  it('FunderController PUT /v1/funders/{funderId}/encryption_key: OK', async () => {
    funderRepository.stubs.findById.resolves(funderCollectivity);
    funderRepository.stubs.updateById.resolves();
    await funderController.storeEncryptionKey(funderCollectivity.id, mockencryptionKeyValid);
    sinon.assert.called(funderRepository.stubs.updateById);
  });

  it('FunderController GET /v1/funders/communities/count : OK', async () => {
    const countRes = {
      count: 10,
    };
    communityRepository.stubs.count.resolves(countRes);
    const result = await funderController.countCommunities();
    expect(result).to.deepEqual(countRes);
  });

  it('FunderController GET /v1/funders/communities: Mongo ERROR', async () => {
    try {
      communityRepository.stubs.find.rejects(new Error('Error'));

      await funderController.findCommunities();
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
  });

  it('FunderController GET /v1/funders/communities: OK', async () => {
    communityRepository.stubs.find.resolves([newCommunity]);
    funderRepository.stubs.find.resolves(mockReturnFunder);
    const result = await funderController.findCommunities();

    expect(result).to.deepEqual([mockAllCommunities]);
  });

  it('FunderController POST /v1/funders/communities : OK result', async () => {
    const community = new Community({
      name: 'random',
      funderId: 'randomId',
    });

    communityRepository.stubs.findOne.resolves();
    funderRepository.stubs.findById.resolves(funderCollectivity);
    communityRepository.stubs.create.resolves(community);

    const res = await funderController.createCommunity(community);
    expect(res).to.deepEqual(community);
  });

  it('FunderController POST /v1/funders/communities : no funder OK undefined', async () => {
    const community = new Community({
      name: 'random',
      funderId: 'randomId',
    });
    communityRepository.stubs.findOne.resolves();
    funderRepository.stubs.findById.resolves(undefined);

    const res = await funderController.createCommunity(community);
    expect(res).to.equal(undefined);
  });

  it('FunderController POST /v1/funders/communities : OK undefined', async () => {
    const community = new Community({
      name: 'random',
      funderId: 'randomId',
    });

    communityRepository.stubs.findOne.resolves(community);

    const res = await funderController.createCommunity(community);
    expect(res).to.equal(undefined);
  });

  it('FunderController POST /v1/funders/communities : Mongo Error', async () => {
    try {
      const community = new Community({
        name: 'random',
        funderId: 'randomId',
      });

      communityRepository.stubs.findOne.rejects(new Error('Error'));
      await funderController.createCommunity(community);
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
  });

  it('FunderController GET /v1/funders/{funderId}/communities : OK', async () => {
    const funderId = 'funderCollectivityId';
    const communitiesResult: [] = [];
    communityRepository.stubs.findByFunderId.resolves(communitiesResult);
    const res = await funderController.findByFunderId(funderId);

    expect(res).to.deepEqual(communitiesResult);
  });

  it('FunderController GET /v1/funders/{funderId}/citizens enterprise funder: OK', async () => {
    const funderId = 'funderEnterpriseId';
    const status = AFFILIATION_STATUS.AFFILIATED;
    const lastName = 'lastName';
    const skip = 0;
    const limit = 10;

    citizenService.stubs.getEnterpriseEmployees.resolves([mockCitizen]);

    const result = await funderController.getCitizens(funderId, status, lastName, skip, limit);

    expect(result).to.eql([mockCitizen]);
    sinon.assert.calledWith(citizenService.stubs.getEnterpriseEmployees, {
      funderId,
      status,
      lastName,
      skip,
      limit,
    });
    sinon.assert.notCalled(subscriptionService.stubs.getCitizensWithSubscription);
  });

  it('FunderController GET /v1/funders/{funderId}/citizens collectivity funder: OK', async () => {
    const funderId = 'funderCollectivityId';
    const lastName = 'lastName';
    const skip = 0;
    const limit = 10;

    const currentUser: IUser = {
      id: 'idCollectivity',
      emailVerified: true,
      maas: undefined,
      membership: ['/collectivities/SM'],
      funderType: FUNDER_TYPE.COLLECTIVITY,
      roles: ['gestionnaires'],
      [securityId]: 'idCollectivity',
    };

    funderController = new FunderController(
      responseOK,
      funderRepository,
      communityRepository,
      clientScopeRepository,
      userEntityRepository,
      keycloakService,
      citizenService,
      subscriptionService,
      currentUser,
    );

    subscriptionService.stubs.getCitizensWithSubscription.resolves([mockCitizenWithSubscription]);

    const result = await funderController.getCitizens(funderId, undefined, lastName, skip, limit);

    expect(result).to.eql([mockCitizenWithSubscription]);
    sinon.assert.calledWith(subscriptionService.stubs.getCitizensWithSubscription, {
      funderId,
      lastName,
      skip,
      limit,
    });
    sinon.assert.notCalled(citizenService.stubs.getEnterpriseEmployees);
  });

  it('FunderController GET /v1/funders/{funderId}/citizens funderType not found', async () => {
    const funderId = '123';
    const status = AFFILIATION_STATUS.AFFILIATED;
    const lastName = 'Doe';
    const skip = 0;
    const limit = 10;

    const currentUser: IUser = {
      id: 'idEnterprise',
      emailVerified: true,
      maas: undefined,
      membership: ['/entreprises/Capgemini'],
      funderType: 'invalidFunderType' as FUNDER_TYPE,
      roles: ['gestionnaires'],
      [securityId]: 'idEnterprise',
    };

    funderController = new FunderController(
      responseOK,
      funderRepository,
      communityRepository,
      clientScopeRepository,
      userEntityRepository,
      keycloakService,
      citizenService,
      subscriptionService,
      currentUser,
    );

    const expectedError = new BadRequestError(
      FunderController.name,
      'getCitizens',
      'funderType.not.found',
      '/funderTypeNotFound',
      ResourceName.Funder,
      currentUser.funderType,
    );

    try {
      await funderController.getCitizens(funderId, status, lastName, skip, limit);
    } catch (error) {
      expect(error).to.eql(expectedError);
    }
  });
});

const funderNational: Funder = new NationalAdministration({
  id: 'funderNationalId',
  type: FUNDER_TYPE.NATIONAL,
  name: 'France',
}) as Funder;

const funderCollectivity: Funder = new Collectivity({
  id: 'funderCollectivityId',
  type: FUNDER_TYPE.COLLECTIVITY,
  name: 'Mulhouse',
  siretNumber: 1110000,
}) as Funder;

const funderEnterprise: Funder = new Enterprise({
  id: 'funderEnterpriseId',
  type: FUNDER_TYPE.ENTERPRISE,
  name: 'Capgemini',
  mobilityBudget: 1110000,
  clientId: 'enterprise-client',
  enterpriseDetails: new EnterpriseDetails({
    isHris: false,
    hasManualAffiliation: false,
    emailDomainNames: ['@example.com'],
  }),
}) as Funder;

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

const newCommunity: Community = new Community({
  id: '6175d61442ebca0660ddf3fb',
  name: 'fio',
  funderId: 'funderEnterpriseId',
});

const mockReturnFunder: Funder[] = [funderEnterprise, funderCollectivity];

const mockAllCommunities = {
  funderId: 'funderEnterpriseId',
  funderName: 'Capgemini',
  funderType: FUNDER_TYPE.ENTERPRISE,
  id: '6175d61442ebca0660ddf3fb',
  name: 'fio',
};

const mockCitizen: PartialCitizen = {
  id: 'randomInputId',
  lastName: 'lastName',
  firstName: 'firstName',
  birthdate: 'birthdate',
  email: 'email',
  enterpriseEmail: 'email@email.com',
  isCitizenDeleted: false,
};

const mockCitizenWithSubscription: PartialCitizen = {
  id: 'citizenId',
  lastName: 'lastName',
  firstName: 'firstName',
  birthdate: 'birthdate',
  email: 'email',
  isCitizenDeleted: false,
};

import {AnyObject} from '@loopback/repository';
import {
  createStubInstance,
  expect,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {IncentiveController} from '../../controllers';
import {
  Incentive,
  Collectivity,
  Enterprise,
  Citizen,
  Link,
  Territory,
} from '../../models';
import {
  CitizenRepository,
  CollectivityRepository,
  EnterpriseRepository,
  IncentiveRepository,
  TerritoryRepository,
} from '../../repositories';
import {ValidationError} from '../../validationError';
import {IncentiveService, FunderService} from '../../services';
import {
  AFFILIATION_STATUS,
  CITIZEN_STATUS,
  Roles,
  StatusCode,
  HTTP_METHOD,
  GET_INCENTIVES_INFORMATION_MESSAGES,
  FUNDER_TYPE,
  IUser,
  ResourceName,
} from '../../utils';
import {WEBSITE_FQDN} from '../../constants';
import {TerritoryService} from '../../services/territory.service';

describe('Incentives Controller', () => {
  let repository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    repositoryCollectivity: StubbedInstanceWithSinonAccessor<CollectivityRepository>,
    repositoryEnterprise: StubbedInstanceWithSinonAccessor<EnterpriseRepository>,
    repositoryCitizen: StubbedInstanceWithSinonAccessor<CitizenRepository>,
    repositoryTerritory: StubbedInstanceWithSinonAccessor<TerritoryRepository>,
    incentiveService: StubbedInstanceWithSinonAccessor<IncentiveService>,
    funderService: StubbedInstanceWithSinonAccessor<FunderService>,
    territoryService: StubbedInstanceWithSinonAccessor<TerritoryService>;

  beforeEach(() => {
    givenStubbedRepository();
    givenStubbedCollectivityRepository();
    givenStubbedEntrpriseRepository();
    givenStubbedCitizenRepository();
    givenStubbedTerritoryRepository();
    givenStubbedIncentiveService();
    givenStubbedFunderService();
    givenStubbedTerritoryService();
  });

  it('post(/v1/incentives) with funderName=AideEmployeur', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repositoryTerritory.stubs.findById.resolves(territoryMock);
    repository.stubs.create.resolves(mockCreateEnterpriseIncentive);
    repositoryEnterprise.stubs.find.resolves([mockEnterprise]);
    const result = await controller.create(mockEnterpriseIncentive);

    expect(result.funderId).to.deepEqual('randomInputIdEnterprise');
  });

  it('post(/v1/incentives) with funderName=AideEmployeur but enterprise not exist', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    try {
      repositoryTerritory.stubs.findById.resolves(territoryMock);
      repository.stubs.create.resolves(mockCreateEnterpriseIncentive);
      repositoryEnterprise.stubs.find.resolves([]);
      await controller.create(mockEnterpriseIncentive);
    } catch ({message}) {
      expect(error.message).to.equal(message);
    }
  });

  it('post(/v1/incentives) with funderName=AideTerritoire', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repositoryTerritory.stubs.findById.resolves(territoryMock);
    repository.stubs.create.resolves(mockCreateCollectivityIncentive);
    repositoryCollectivity.stubs.find.resolves([mockCollectivity]);
    const result = await controller.create(mockCollectivityIncentive);

    expect(result.funderId).to.deepEqual('randomInputIdCollectivity');
  });

  it('post(/v1/incentives) with specific fields', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repositoryTerritory.stubs.findById.resolves(territoryMock);
    repository.stubs.create.resolves(mockCreateIncentiveWithSpecificFields);
    repositoryCollectivity.stubs.find.resolves([mockCollectivity]);
    const result = await controller.create(mockIncentiveWithSpecificFields);

    expect(result.funderId).to.deepEqual('randomInputIdCollectivity');
  });

  it('post(/v1/incentives) with territory mismatched name', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repositoryTerritory.stubs.findById.resolves(territoryWrongName);

    try {
      await controller.create(mockEnterpriseIncentive);
    } catch ({message}) {
      expect(territoryNameMismatch.message).to.equal(message);
    }
  });

  it('post(/v1/incentives) create territory', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    territoryService.stubs.createTerritory.resolves(territoryMock);
    repository.stubs.create.resolves(mockCreateEnterpriseIncentive);
    repositoryEnterprise.stubs.find.resolves([mockEnterprise]);
    const result = await controller.create(mockIncentiveTerritoryPayload);
    expect(result.funderId).to.deepEqual('randomInputIdEnterprise');
  });

  it('post(/v1/incentives) transaction', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    try {
      territoryService.stubs.createTerritory.resolves(territoryMock);
      repository.stubs.create.resolves(mockCreateEnterpriseIncentive);
      repositoryEnterprise.stubs.find.resolves([]);
      repositoryTerritory.stubs.deleteById.resolves();
      await controller.create(mockEnterpriseIncentivePayload2);
    } catch ({message}) {
      expect(error.message).to.equal(message);
    }
  });

  it('GET v1/incentives returns an error when a user or maas token is not provided', async () => {
    const noToken = new ValidationError(
      'Authorization header not found',
      '/authorization',
      StatusCode.Unauthorized,
    );
    try {
      const controller = new IncentiveController(
        repository,
        repositoryCollectivity,
        repositoryEnterprise,
        repositoryCitizen,
        repositoryTerritory,
        incentiveService,
        funderService,
        territoryService,
        currentUser,
      );
      repository.stubs.find.resolves([]);
      const response: any = {};
      await controller.find(response);
    } catch (err) {
      expect(err).to.equal(noToken);
    }
  });
  it('GET /v1/incentives should return public and private incentives for user content_editor', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repository.stubs.find.resolves([mockIncentiveWithSpecificFields]);
    const response: any = {};
    const result = await controller.find(response);

    expect(result).to.deepEqual([mockIncentiveWithSpecificFields]);
  });

  it('GET /v1/incentives should return incentive belonging to user manager connected', async () => {
    const userManager = currentUser;
    userManager.roles = [Roles.MANAGERS];
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      userManager,
    );
    repository.stubs.find.resolves([mockEnterpriseIncentive]);
    const response: any = {};
    const result = controller.find(response);

    expect(result).to.deepEqual(mockReturnIncentivesFunderEnterprise);
  });

  it('GET v1/incentives should return public incentives with user service_maas', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUserMaas,
    );
    const incentiveFindStub = repository.stubs.find;
    incentiveFindStub.onCall(0).resolves(mockReturnPublicAid);
    incentiveFindStub.onCall(1).resolves(mockReturnPrivateAid);
    funderService.stubs.getFunders.resolves([newFunder]);
    repositoryCitizen.stubs.findOne.resolves(mockCitizen);
    const response: any = {};
    const result: any = await controller.find(response);
    expect(result).to.have.length(2);
    expect(result).to.deepEqual(mockReturnPublicAid);
    funderService.stubs.getFunders.restore();
    repositoryCitizen.stubs.findOne.restore();
    repository.stubs.find.restore();
  });

  it('GET v1/incentives should return message when citizen affiliated but no private incentive', async () => {
    const message =
      GET_INCENTIVES_INFORMATION_MESSAGES.CITIZEN_AFFILIATED_WITHOUT_INCENTIVES;
    const userMaaS = currentUser;
    userMaaS.roles = [Roles.MAAS];
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      userMaaS,
    );
    funderService.stubs.getFunders.resolves([newFunder]);
    repositoryCitizen.stubs.findOne.resolves(mockCitizen);
    repository.stubs.find.resolves([]);
    const response: any = {
      status: function () {
        return this;
      },
      contentType: function () {
        return this;
      },
      send: (buffer: Buffer) => buffer,
    };
    const result: any = await controller.find(response);
    expect(result.message).to.equal(message);
  });

  it('GET v1/incentives returns public incentives if has no affiliation', async () => {
    const userMaaS = currentUser;
    userMaaS.roles = [Roles.MAAS];
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      userMaaS,
    );
    repository.stubs.find.resolves(mockReturnPublicAid);
    funderService.stubs.getFunders.resolves([]);
    repositoryCitizen.stubs.findOne.resolves(mockCitizenNonSalarie);
    repository.stubs.find.resolves(mockReturnPublicAid);
    const response: any = {};
    const result: any = await controller.find(response);

    expect(result).to.have.length(2);
    expect(result).to.deepEqual(mockReturnPublicAid);

    funderService.stubs.getFunders.restore();
    repositoryCitizen.stubs.findOne.restore();
    repository.stubs.find.restore();
  });

  it('GET v1/incentives should return message if citizen not affiliated', async () => {
    const message = GET_INCENTIVES_INFORMATION_MESSAGES.CITIZEN_NOT_AFFILIATED;
    const userMaaS = currentUser;
    userMaaS.roles = [Roles.MAAS];
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      userMaaS,
    );
    funderService.stubs.getFunders.resolves([newFunder]);
    repositoryCitizen.stubs.findOne.resolves(mockReturnCitizenNotAffiliated);
    repository.stubs.find.resolves(mockReturnPublicAid);
    const response: any = {
      status: function () {
        return this;
      },
      contentType: function () {
        return this;
      },
      send: (buffer: Buffer) => buffer,
    };
    const result: any = await controller.find(response);
    expect(result.message).to.equal(message);
  });

  it('GET v1/incentives returns the public and private incentives when citizen affiliated', async () => {
    const userMaaS = currentUser;
    userMaaS.roles = [Roles.MAAS];
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      userMaaS,
    );
    const incentiveFindStub = repository.stubs.find;
    incentiveFindStub.onCall(0).resolves(mockReturnPublicAid);
    incentiveFindStub.onCall(1).resolves(mockReturnPrivateAid);
    funderService.stubs.getFunders.resolves([newFunder]);
    repositoryCitizen.stubs.findOne.resolves(mockCitizen);
    const response: any = {
      status: function () {
        return this;
      },
      contentType: function () {
        return this;
      },
      send: (buffer: Buffer) => buffer,
    };
    const result: any = await controller.find(response);

    expect(result).to.have.length(3);
    expect(result).to.deepEqual([...mockReturnPublicAid, ...mockReturnPrivateAid]);

    funderService.stubs.getFunders.restore();
    repositoryCitizen.stubs.findOne.restore();
    repository.stubs.findOne.restore();
  });

  it('get(/v1/incentives/search)', done => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repository.stubs.execute.resolves([mockIncentiveWithSpecificFields]);
    const incentiveList = controller
      .search('AideNationale, AideTerritoire', 'vélo')
      .then(res => res)
      .catch(err => err);

    expect(incentiveList).to.deepEqual(mockReturnIncentives);
    done();
  });

  it('get(/v1/incentives/count)', async () => {
    const countRes = {
      count: 10,
    };
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repository.stubs.count.resolves(countRes);
    const result = await controller.count();

    expect(result).to.deepEqual(countRes);
  });

  it('get(/v1/incentives/{incentiveId})', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    const mockIncentive = Object.assign({}, mockCollectivityIncentive, {
      isMCMStaff: false,
    });
    repository.stubs.findById.resolves(mockIncentive);
    const incentive = await controller.findIncentiveById('606c236a624cec2becdef276');

    expect(incentive).to.deepEqual(mockIncentive);
  });

  it('get(/v1/incentives/{incentiveId}) with links', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repository.stubs.findById.resolves(mockIncentive);
    const links = [
      new Link({
        href: `${WEBSITE_FQDN}/subscriptions/new?incentiveId=randomNationalId`,
        rel: 'subscribe',
        method: HTTP_METHOD.GET,
      }),
    ];
    const result = await controller.findIncentiveById('randomNationalId');
    mockIncentive.links = links;
    expect(result).to.deepEqual(mockIncentive);
  });

  it('patch(/v1/incentives/{incentiveId}) territory id not given', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repository.stubs.updateById.resolves();
    try {
      await controller.updateById(
        '606c236a624cec2becdef276',
        mockIncentiveWithoutTerritoryId,
      );
    } catch (err) {
      expect(err).to.deepEqual(territoryIdNotGiven);
    }
  });

  it('patch(/v1/incentives/{incentiveId}) mismatch territory name', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repositoryTerritory.stubs.findById.resolves(territoryWrongName);
    repository.stubs.updateById.resolves();
    try {
      await controller.updateById(
        '606c236a624cec2becdef276',
        mockIncentiveWithSubscriptionLink,
      );
    } catch (err) {
      expect(err).to.deepEqual(territoryNameMismatch);
    }
  });

  it('patch(/v1/incentives/{incentiveId}) subscription link', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repositoryTerritory.stubs.findById.resolves(territoryMock);

    repository.stubs.updateById.resolves();
    const incentiveList = await controller.updateById(
      '606c236a624cec2becdef276',
      mockIncentiveWithSubscriptionLink,
    );

    expect(incentiveList).to.deepEqual(mockIncentiveWithSubscriptionLink);
  });
  it('patch(/v1/incentives/{incentiveId}) additionalInfos', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repository.stubs.updateById.resolves();
    const incentiveList = await controller.updateById(
      '606c236a624cec2becdef276',
      mockIncentiveWithoutAdditionalInfos,
    );

    expect(incentiveList).to.deepEqual(mockIncentiveWithoutAdditionalInfos);
  });
  it('patch(/v1/incentives/{incentiveId}) validityDate', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repository.stubs.updateById.resolves();
    const incentiveList = await controller.updateById(
      '606c236a624cec2becdef276',
      mockIncentiveWithoutValidityDate,
    );

    expect(incentiveList).to.deepEqual(mockIncentiveWithoutValidityDate);
  });
  it('patch(/v1/incentives/{incentiveId}) validityDuration', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repository.stubs.updateById.resolves();
    const incentiveList = await controller.updateById(
      '606c236a624cec2becdef276',
      mockIncentiveWithoutValidityDuration,
    );

    expect(incentiveList).to.deepEqual(mockIncentiveWithoutValidityDuration);
  });
  it('patch(/v1/incentives/{incentiveId}) contact', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repository.stubs.updateById.resolves();
    const incentiveList = await controller.updateById(
      '606c236a624cec2becdef276',
      mockIncentiveWithoutContact,
    );

    expect(incentiveList).to.deepEqual(mockIncentiveWithoutContact);
  });

  it('patch(/v1/incentives/{incentiveId}) specific fields', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repositoryTerritory.stubs.findById.resolves(territoryMock);
    repository.stubs.updateById.resolves();
    const incentiveList = await controller.updateById(
      '606c236a624cec2becdef276',
      mockIncentiveWithSpecificFields,
    );

    expect(incentiveList).to.deepEqual(mockIncentiveWithSpecificFields);
  });

  it('del(/v1/incentives/{incentiveId})', async () => {
    const controller = new IncentiveController(
      repository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryCitizen,
      repositoryTerritory,
      incentiveService,
      funderService,
      territoryService,
      currentUser,
    );
    repository.stubs.deleteById.resolves();

    const incentiveList = await controller.deleteById('606c236a624cec2becdef276');

    expect(incentiveList).to.deepEqual(undefined);
  });

  function givenStubbedRepository() {
    repository = createStubInstance(IncentiveRepository);
  }
  function givenStubbedCollectivityRepository() {
    repositoryCollectivity = createStubInstance(CollectivityRepository);
  }

  function givenStubbedEntrpriseRepository() {
    repositoryEnterprise = createStubInstance(EnterpriseRepository);
  }

  function givenStubbedCitizenRepository() {
    repositoryCitizen = createStubInstance(CitizenRepository);
  }

  function givenStubbedTerritoryRepository() {
    repositoryTerritory = createStubInstance(TerritoryRepository);
  }

  function givenStubbedIncentiveService() {
    incentiveService = createStubInstance(IncentiveService);
  }

  function givenStubbedFunderService() {
    funderService = createStubInstance(FunderService);
  }

  function givenStubbedTerritoryService() {
    territoryService = createStubInstance(TerritoryService);
  }
});

const mockCollectivityIncentive = new Incentive({
  territory: {name: 'Toulouse', id: 'test'} as Territory,
  additionalInfos: 'test',
  funderName: 'Mairie',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef276',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
});

const mockCreateCollectivityIncentive = new Incentive({
  territory: {name: 'Toulouse', id: 'test'} as Territory,
  additionalInfos: 'test',
  funderName: 'nameTerritoire',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef276',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
  funderId: 'randomInputIdCollectivity',
});

const mockEnterpriseIncentive = new Incentive({
  territory: {name: 'Toulouse', id: 'test'} as Territory,
  additionalInfos: 'test',
  funderName: 'Capgemini',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideEmployeur',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef276',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
});

const mockCreateEnterpriseIncentive = new Incentive({
  territory: {name: 'Toulouse', id: 'test'} as Territory,
  additionalInfos: 'test',
  funderName: 'nameEnterprise',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideEmployeur',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef276',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
  funderId: 'randomInputIdEnterprise',
});

const mockCreateIncentiveWithSpecificFields = new Incentive({
  territory: {name: 'Toulouse', id: 'test'} as Territory,
  additionalInfos: 'test',
  funderName: 'nameTerritoire',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef276',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
  funderId: 'randomInputIdCollectivity',
  specificFields: [
    {
      title: 'Liste de choix',
      inputFormat: 'listeChoix',
      choiceList: {
        possibleChoicesNumber: 2,
        inputChoiceList: [
          {
            inputChoice: 'choix1',
          },
          {
            inputChoice: 'choix2',
          },
        ],
      },
    },
    {
      title: 'Un texte',
      inputFormat: 'Texte',
    },
  ],
  jsonSchema: {
    properties: {
      'Liste de choix': {
        type: 'array',
        maxItems: 2,
        items: [
          {
            enum: ['choix1', 'choix2'],
          },
        ],
      },
      'Un texte': {
        type: 'string',
        minLength: 1,
      },
    },
    title: 'Aide pour acheter vélo électrique',
    type: 'object',
    required: ['Liste de choix', 'Un texte'],
  },
});

const mockIncentiveWithSpecificFields = new Incentive({
  territory: {name: 'Toulouse', id: 'test'} as Territory,
  additionalInfos: 'test',
  funderName: 'nameTerritoire',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef276',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
  specificFields: [
    {
      title: 'Liste de choix',
      inputFormat: 'listeChoix',
      choiceList: {
        possibleChoicesNumber: 2,
        inputChoiceList: [
          {
            inputChoice: 'choix1',
          },
          {
            inputChoice: 'choix2',
          },
        ],
      },
    },
    {
      title: 'Un texte',
      inputFormat: 'Texte',
    },
  ],
});

const mockIncentiveWithSubscriptionLink = new Incentive({
  territory: {name: 'Toulouse', id: 'test'} as Territory,
  additionalInfos: 'test',
  funderName: 'nameTerritoire',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef276',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: false,
  subscriptionLink: 'http://link.com',
});
const mockIncentiveWithoutAdditionalInfos = new Incentive({
  funderName: 'nameTerritoire',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef276',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: false,
  subscriptionLink: 'http://link.com',
});
const mockIncentiveWithoutValidityDate = new Incentive({
  additionalInfos: 'test',
  funderName: 'nameTerritoire',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef276',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: false,
  subscriptionLink: 'http://link.com',
});
const mockIncentiveWithoutValidityDuration = new Incentive({
  additionalInfos: 'test',
  funderName: 'nameTerritoire',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef276',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: false,
  subscriptionLink: 'http://link.com',
});
const mockIncentiveWithoutContact = new Incentive({
  additionalInfos: 'test',
  funderName: 'nameTerritoire',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef276',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: false,
  subscriptionLink: 'http://link.com',
});

const mockReturnIncentives: Promise<AnyObject> = new Promise(() => {
  return [
    {
      id: '606c236a624cec2becdef276',
      title: 'Aide pour acheter vélo électrique',
      minAmount: 'A partir de 100 €',
      incentiveType: 'AideTerritoire',
      transportList: ['vélo'],
      updatedAt: new Date('2021-04-06T09:01:30.778Z'),
    },
    {
      id: '606c236a624cec2becdef276',
      title: 'Bonus écologique pour une voiture ou une camionnette électrique ou hybride',
      minAmount: 'A partir de 1 000 €',
      incentiveType: 'AideNationale',
      transportList: ['autopartage', 'voiture'],
      updatedAt: new Date('2021-04-06T09:01:30.778Z'),
    },
  ];
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

const mockReturnIncentivesFunderEnterprise: Promise<AnyObject> = new Promise(() => {
  return [mockEnterpriseIncentive];
});

const error = new ValidationError(
  `incentives.error.fundername.enterprise.notExist`,
  '/enterpriseNotExist',
);

const currentUser: IUser = {
  id: 'idEnterprise',
  emailVerified: true,
  maas: undefined,
  membership: ['/entreprises/Capgemini'],
  roles: ['content_editor', 'gestionnaires'],
  [securityId]: 'idEnterprise',
};

const currentUserMaas: IUser = {
  id: 'citizenId',
  emailVerified: true,
  clientName: undefined,
  membership: ['/citoyens'],
  roles: ['offline_access', 'uma_authorization', 'maas', 'service_maas'],
  [securityId]: 'citizenId',
};
const mockReturnCitizenNotAffiliated = new Citizen({
  id: 'citizenId',
  identity: Object.assign({
    firstName: Object.assign({
      value: 'Gerard',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
    lastName: Object.assign({
      value: 'Kenny',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
    birthDate: Object.assign({
      value: '1994-02-18T00:00:00.000Z',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
  }),
  personalInformation: Object.assign({
    email: Object.assign({
      value: 'kennyg@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    }),
  }),
  city: 'Mulhouse',
  postcode: '75000',
  status: CITIZEN_STATUS.EMPLOYEE,
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: 'someFunderId',
    enterpriseEmail: 'walid.housni@adevinta.com',
    affiliationStatus: AFFILIATION_STATUS.TO_AFFILIATE,
  }),
});

const mockReturnPrivateAid = [
  new Incentive({
    id: 'randomEmployeurId',
    title: 'Mulhouse',
    funderName: 'nameEnterprise',
    incentiveType: 'AideEmployeur',
    minAmount: '200',
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
    transportList: ['transportsCommun', 'voiture'],
    validityDate: '2023-06-07T00:00:00.000Z',
    funderId: 'someFunderId',
  }),
];

const mockReturnPublicAid = [
  new Incentive({
    id: 'randomTerritoireId',
    title: 'Aide pour acheter vélo électrique',
    minAmount: 'A partir de 100 €',
    incentiveType: 'AideTerritoire',
    transportList: ['vélo'],
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  }),
  new Incentive({
    id: '606c236a624cec2becdef276',
    title: 'Bonus écologique pour une voiture ou une camionnette électrique ou hybride',
    minAmount: 'A partir de 1 000 €',
    incentiveType: 'AideNationale',
    transportList: ['autopartage', 'voiture'],
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  }),
];

const newFunder = {
  id: 'someFunderId',
  name: 'nameEnterprise',
  funderType: FUNDER_TYPE.enterprise,
};

const mockCitizen = new Citizen({
  id: 'citizenId',
  identity: Object.assign({
    firstName: Object.assign({
      value: 'Gerard',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
    lastName: Object.assign({
      value: 'Kenny',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
    birthDate: Object.assign({
      value: '1994-02-18T00:00:00.000Z',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
  }),
  personalInformation: Object.assign({
    email: Object.assign({
      value: 'kennyg@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    }),
  }),
  city: 'Mulhouse',
  postcode: '75000',
  status: CITIZEN_STATUS.EMPLOYEE,
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: 'someFunderId',
    enterpriseEmail: 'walid.housni@adevinta.com',
    affiliationStatus: AFFILIATION_STATUS.AFFILIATED,
  }),
});

const mockCitizenNonSalarie = new Citizen({
  identity: Object.assign({
    firstName: Object.assign({
      value: 'youssef',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
    lastName: Object.assign({
      value: 'Samy',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
    birthDate: Object.assign({
      value: '1995-02-18T00:00:00.000Z',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
  }),
  personalInformation: Object.assign({
    email: Object.assign({
      value: 'kennyg@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    }),
  }),
  city: 'Paris',
  postcode: '75000',
  status: CITIZEN_STATUS.STUDENT,
  tos1: true,
  tos2: true,
});

const mockIncentive = new Incentive({
  territory: {name: 'Toulouse', id: 'test'} as Territory,
  additionalInfos: 'test',
  funderName: 'Mairie',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: 'randomNationalId',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
});

const mockIncentiveWithoutTerritoryId = new Incentive({
  territory: {name: 'Toulouse', id: ''} as Territory,
});

const territoryIdNotGiven = new ValidationError(
  `territory.id.undefined`,
  `/territory`,
  StatusCode.PreconditionFailed,
  ResourceName.Territory,
);

const territoryNameMismatch = new ValidationError(
  `territory.name.mismatch`,
  `/territory`,
  StatusCode.UnprocessableEntity,
  ResourceName.Territory,
);

const territoryMock = new Territory({
  name: 'Toulouse',
  id: 'test',
});

const territoryWrongName = new Territory({
  name: 'Toulouse Wrong Name',
  id: '245',
});

const mockIncentiveTerritoryPayload = new Incentive({
  territory: {name: 'Toulouse'} as Territory,
  additionalInfos: 'test',
  funderName: 'nameEnterprise',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideEmployeur',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef276',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
  funderId: 'randomInputIdEnterprise',
});

const mockEnterpriseIncentivePayload2 = new Incentive({
  territory: {name: 'Toulouse'} as Territory,
  additionalInfos: 'test',
  funderName: 'Capgemini',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideEmployeur',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef276',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
});

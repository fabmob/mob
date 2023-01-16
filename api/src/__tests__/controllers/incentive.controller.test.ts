import {AnyObject} from '@loopback/repository';
import {
  createStubInstance,
  expect,
  sinon,
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
  IncentiveEligibilityChecks,
  EligibilityCheck,
} from '../../models';
import {
  CollectivityRepository,
  EnterpriseRepository,
  IncentiveRepository,
  TerritoryRepository,
  IncentiveEligibilityChecksRepository,
} from '../../repositories';
import {ValidationError} from '../../validationError';
import {IncentiveService, FunderService, CitizenService} from '../../services';
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
  SUBSCRIPTION_CHECK_MODE,
  ELIGIBILITY_CHECKS_LABEL,
} from '../../utils';
import {WEBSITE_FQDN} from '../../constants';
import {TerritoryService} from '../../services/territory.service';
import {createIncentive} from '../dataFactory';

describe('Incentives Controller', () => {
  let controllerCurrentUser: IncentiveController,
    incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    repositoryCollectivity: StubbedInstanceWithSinonAccessor<CollectivityRepository>,
    repositoryEnterprise: StubbedInstanceWithSinonAccessor<EnterpriseRepository>,
    repositoryTerritory: StubbedInstanceWithSinonAccessor<TerritoryRepository>,
    eligibilityChecksRepository: StubbedInstanceWithSinonAccessor<IncentiveEligibilityChecksRepository>,
    incentiveService: StubbedInstanceWithSinonAccessor<IncentiveService>,
    funderService: StubbedInstanceWithSinonAccessor<FunderService>,
    territoryService: StubbedInstanceWithSinonAccessor<TerritoryService>,
    citizenService: StubbedInstanceWithSinonAccessor<CitizenService>;

  beforeEach(() => {
    givenStubbedRepository();
    givenStubbedCollectivityRepository();
    givenStubbedEntrpriseRepository();
    givenStubbedTerritoryRepository();
    givenStubbedIncentiveEligibilityChecksRepository();
    givenStubbedIncentiveService();
    givenStubbedFunderService();
    givenStubbedTerritoryService();
    givenStubbedCitizenService();
    controllerCurrentUser = new IncentiveController(
      incentiveRepository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryTerritory,
      eligibilityChecksRepository,
      incentiveService,
      funderService,
      territoryService,
      citizenService,
      currentUser,
    );
  });

  it('post(/v1/incentives) with funderName=AideEmployeur', async () => {
    repositoryTerritory.stubs.findById.resolves(territoryMock);
    incentiveRepository.stubs.create.resolves(mockCreateEnterpriseIncentive);
    repositoryEnterprise.stubs.find.resolves([mockEnterprise]);
    const result = await controllerCurrentUser.create(mockEnterpriseIncentive);

    expect(result.funderId).to.deepEqual('randomInputIdEnterprise');
  });

  it('post(/v1/incentives) with funderName=AideEmployeur but enterprise not exist', async () => {
    try {
      repositoryTerritory.stubs.findById.resolves(territoryMock);
      incentiveRepository.stubs.create.resolves(mockCreateEnterpriseIncentive);
      repositoryEnterprise.stubs.find.resolves([]);
      await controllerCurrentUser.create(mockEnterpriseIncentive);
    } catch ({message}) {
      expect(error.message).to.equal(message);
    }
  });

  it('post(/v1/incentives) with funderName=AideTerritoire', async () => {
    repositoryTerritory.stubs.findById.resolves(territoryMock);
    incentiveRepository.stubs.create.resolves(mockCreateCollectivityIncentive);
    repositoryCollectivity.stubs.find.resolves([mockCollectivity]);
    const result = await controllerCurrentUser.create(mockCollectivityIncentive);

    expect(result.funderId).to.deepEqual('randomInputIdCollectivity');
  });

  it('post(/v1/incentives) with specific fields', async () => {
    repositoryTerritory.stubs.findById.resolves(territoryMock);
    incentiveRepository.stubs.create.resolves(mockCreateIncentiveWithSpecificFields);
    repositoryCollectivity.stubs.find.resolves([mockCollectivity]);
    const result = await controllerCurrentUser.create(mockIncentiveWithSpecificFields);

    expect(result.funderId).to.deepEqual('randomInputIdCollectivity');
  });

  it('post(/v1/incentives) with territory mismatched name', async () => {
    repositoryTerritory.stubs.findById.resolves(territoryWrongName);

    try {
      await controllerCurrentUser.create(mockEnterpriseIncentive);
    } catch ({message}) {
      expect(territoryNameMismatch.message).to.equal(message);
    }
  });

  it('post(/v1/incentives) create territory', async () => {
    territoryService.stubs.createTerritory.resolves(territoryMock);
    incentiveRepository.stubs.create.resolves(mockCreateEnterpriseIncentive);
    repositoryEnterprise.stubs.find.resolves([mockEnterprise]);
    const result = await controllerCurrentUser.create(mockIncentiveTerritoryPayload);
    expect(result.funderId).to.deepEqual('randomInputIdEnterprise');
  });

  it('post(/v1/incentives) transaction', async () => {
    try {
      territoryService.stubs.createTerritory.resolves(territoryMock);
      incentiveRepository.stubs.create.resolves(mockCreateEnterpriseIncentive);
      repositoryEnterprise.stubs.find.resolves([]);
      repositoryTerritory.stubs.deleteById.resolves();
      await controllerCurrentUser.create(mockEnterpriseIncentivePayload2);
    } catch ({message}) {
      expect(error.message).to.equal(message);
    }
  });

  it('post(/v1/incentives) check mode auto delete created incentive on error', async () => {
    try {
      repositoryTerritory.stubs.findById.resolves(territoryMock);
      repositoryCollectivity.stubs.find.resolves([mockCollectivity]);
      incentiveRepository.stubs.create.returnsArg(0);
      incentiveRepository.stubs.deleteById.resolves();
      incentiveRepository.stubs.find.resolves([
        mockCollectivityIncentiveWithEligibilityCheck,
      ]);
      eligibilityChecksRepository.stubs.findOne.rejects();
      await controllerCurrentUser.create(mockCollectivityIncentiveWithEligibilityCheck);
      sinon.assert.fail();
    } catch (error) {
      sinon.assert.calledOnce(incentiveRepository.stubs.deleteById);
    }
  });

  it('post(/v1/incentives) with check without exclusion', async () => {
    try {
      const incentive = createIncentive({
        eligibilityChecks: [
          new EligibilityCheck({
            id: 'uuid-fc',
            value: [],
            active: true,
          }),
        ],
      });
      repositoryTerritory.stubs.findById.resolves(territoryMock);
      repositoryCollectivity.stubs.find.resolves([mockCollectivity]);
      incentiveRepository.stubs.create.returnsArg(0);
      eligibilityChecksRepository.stubs.findOne.resolves(
        mockIncentiveEligibilityCheck[1],
      );

      const createdIncentive = await controllerCurrentUser.create(incentive);

      sinon.assert.notCalled(incentiveRepository.stubs.find);
      sinon.assert.notCalled(incentiveRepository.stubs.updateById);
      expect(createdIncentive).to.deepEqual(incentive);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('post(/v1/incentives) with exclusion', async () => {
    try {
      const excludedIncentive1 = createIncentive({id: 'id-delete-aide1'});
      delete excludedIncentive1.eligibilityChecks;
      const excludedIncentive2 = createIncentive({
        id: 'id-delete-aide2',
        eligibilityChecks: [
          new EligibilityCheck({
            id: 'uuid-fc',
            value: [],
            active: true,
          }),
        ],
      });
      const excludedIncentive3 = createIncentive({
        id: 'id-delete-aide3',
        eligibilityChecks: [
          new EligibilityCheck({
            id: 'uuid-fc',
            value: [],
            active: true,
          }),
          new EligibilityCheck({
            id: 'uuid-exclusion',
            value: ['test'],
            active: true,
          }),
        ],
      });
      const incentive = createIncentive({
        eligibilityChecks: [
          new EligibilityCheck({
            id: 'uuid-fc',
            value: [],
            active: true,
          }),
          new EligibilityCheck({
            id: 'uuid-exclusion',
            value: [excludedIncentive1.id, excludedIncentive2.id, excludedIncentive3.id],
            active: false,
          }),
        ],
      });

      repositoryTerritory.stubs.findById.resolves(territoryMock);
      repositoryCollectivity.stubs.find.resolves([mockCollectivity]);
      incentiveService.stubs.addIncentiveToExclusions.returns([
        new EligibilityCheck({
          id: 'uuid-exclusion',
          value: [incentive.id],
          active: incentive.eligibilityChecks![1].active,
        }),
      ]);
      incentiveRepository.stubs.create.returnsArg(0);
      incentiveRepository.stubs.find.resolves([
        excludedIncentive1,
        excludedIncentive2,
        excludedIncentive3,
      ]);
      incentiveRepository.stubs.updateById.resolves();
      eligibilityChecksRepository.stubs.findOne.resolves(
        mockIncentiveEligibilityCheck[1],
      );

      const createdIncentive = await controllerCurrentUser.create(incentive);

      expect(createdIncentive).to.deepEqual(incentive);
      sinon.assert.calledWith(
        incentiveRepository.stubs.updateById,
        excludedIncentive1.id,
        sinon.match.has('eligibilityChecks', [
          new EligibilityCheck({
            id: 'uuid-exclusion',
            value: [incentive.id],
            active: incentive.eligibilityChecks![1].active,
          }),
        ]),
      );
      sinon.assert.calledWith(
        incentiveRepository.stubs.updateById,
        excludedIncentive1.id,
      );
      sinon.assert.calledWith(
        incentiveRepository.stubs.updateById,
        excludedIncentive2.id,
      );
      sinon.assert.calledWith(
        incentiveRepository.stubs.updateById,
        excludedIncentive3.id,
      );
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('GET v1/incentives returns an error when a user or maas token is not provided', async () => {
    const noToken = new ValidationError(
      'Authorization header not found',
      '/authorization',
      StatusCode.Unauthorized,
    );
    try {
      incentiveRepository.stubs.find.resolves([]);
      const response: any = {};
      await controllerCurrentUser.find(response);
    } catch (err) {
      expect(err).to.equal(noToken);
    }
  });
  it('GET /v1/incentives should return public and private incentives for user content_editor', async () => {
    incentiveRepository.stubs.find.resolves([mockIncentiveWithSpecificFields]);
    const response: any = {};
    const result = await controllerCurrentUser.find(response);

    expect(result).to.deepEqual([mockIncentiveWithSpecificFields]);
  });

  it('GET /v1/incentives should return incentive belonging to user manager connected', async () => {
    const userManager = currentUser;
    userManager.roles = [Roles.MANAGERS];
    const controller = new IncentiveController(
      incentiveRepository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryTerritory,
      eligibilityChecksRepository,
      incentiveService,
      funderService,
      territoryService,
      citizenService,
      userManager,
    );
    incentiveRepository.stubs.find.resolves([mockEnterpriseIncentive]);
    const response: any = {};
    const result = controller.find(response);

    expect(result).to.deepEqual(mockReturnIncentivesFunderEnterprise);
  });

  it('GET v1/incentives should return public incentives with user service_maas', async () => {
    const controller = new IncentiveController(
      incentiveRepository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryTerritory,
      eligibilityChecksRepository,
      incentiveService,
      funderService,
      territoryService,
      citizenService,
      currentUserMaas,
    );
    const incentiveFindStub = incentiveRepository.stubs.find;
    incentiveFindStub.onCall(0).resolves(mockReturnPublicAid);
    incentiveFindStub.onCall(1).resolves(mockReturnPrivateAid);
    funderService.stubs.getFunders.resolves([newFunder]);
    citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);
    const response: any = {};
    const result: any = await controller.find(response);
    expect(result).to.have.length(2);
    expect(result).to.deepEqual(mockReturnPublicAid);
    funderService.stubs.getFunders.restore();
    citizenService.stubs.getCitizenWithAffiliationById.restore();
    incentiveRepository.stubs.find.restore();
  });

  it('GET v1/incentives should return message when citizen affiliated but no private incentive', async () => {
    const message =
      GET_INCENTIVES_INFORMATION_MESSAGES.CITIZEN_AFFILIATED_WITHOUT_INCENTIVES;
    const userMaaS = currentUser;
    userMaaS.roles = [Roles.MAAS];
    const controller = new IncentiveController(
      incentiveRepository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryTerritory,
      eligibilityChecksRepository,
      incentiveService,
      funderService,
      territoryService,
      citizenService,
      userMaaS,
    );
    funderService.stubs.getFunders.resolves([newFunder]);
    citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);
    incentiveRepository.stubs.find.resolves([]);
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
      incentiveRepository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryTerritory,
      eligibilityChecksRepository,
      incentiveService,
      funderService,
      territoryService,
      citizenService,
      userMaaS,
    );
    incentiveRepository.stubs.find.resolves(mockReturnPublicAid);
    funderService.stubs.getFunders.resolves([]);
    citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizenNonSalarie);
    incentiveRepository.stubs.find.resolves(mockReturnPublicAid);
    const response: any = {};
    const result: any = await controller.find(response);

    expect(result).to.have.length(2);
    expect(result).to.deepEqual(mockReturnPublicAid);

    funderService.stubs.getFunders.restore();
    citizenService.stubs.getCitizenWithAffiliationById.restore();
    incentiveRepository.stubs.find.restore();
  });

  it('GET v1/incentives should return message if citizen not affiliated', async () => {
    const message = GET_INCENTIVES_INFORMATION_MESSAGES.CITIZEN_NOT_AFFILIATED;
    const userMaaS = currentUser;
    userMaaS.roles = [Roles.MAAS];
    const controller = new IncentiveController(
      incentiveRepository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryTerritory,
      eligibilityChecksRepository,
      incentiveService,
      funderService,
      territoryService,
      citizenService,
      userMaaS,
    );
    funderService.stubs.getFunders.resolves([newFunder]);
    citizenService.stubs.getCitizenWithAffiliationById.resolves(
      mockReturnCitizenNotAffiliated,
    );
    incentiveRepository.stubs.find.resolves(mockReturnPublicAid);
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
      incentiveRepository,
      repositoryCollectivity,
      repositoryEnterprise,
      repositoryTerritory,
      eligibilityChecksRepository,
      incentiveService,
      funderService,
      territoryService,
      citizenService,
      userMaaS,
    );
    const incentiveFindStub = incentiveRepository.stubs.find;
    incentiveFindStub.onCall(0).resolves(mockReturnPublicAid);
    incentiveFindStub.onCall(1).resolves(mockReturnPrivateAid);
    funderService.stubs.getFunders.resolves([newFunder]);
    citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);
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
    citizenService.stubs.getCitizenWithAffiliationById.restore();
    incentiveRepository.stubs.findOne.restore();
  });

  it('get(/v1/incentives/search)', done => {
    incentiveRepository.stubs.execute.resolves([mockIncentiveWithSpecificFields]);
    const incentiveList = controllerCurrentUser
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
    incentiveRepository.stubs.count.resolves(countRes);
    const result = await controllerCurrentUser.count();

    expect(result).to.deepEqual(countRes);
  });

  it('get(/v1/incentives/{incentiveId})', async () => {
    const mockIncentive = Object.assign({}, mockCollectivityIncentive, {
      isMCMStaff: false,
    });
    incentiveRepository.stubs.findById.resolves(mockIncentive);
    const incentive = await controllerCurrentUser.findIncentiveById(
      '606c236a624cec2becdef276',
    );

    expect(incentive).to.deepEqual(mockIncentive);
  });

  it('get(/v1/incentives/{incentiveId}) with links', async () => {
    incentiveRepository.stubs.findById.resolves(mockIncentive);
    const links = [
      new Link({
        href: `${WEBSITE_FQDN}/subscriptions/new?incentiveId=randomNationalId`,
        rel: 'subscribe',
        method: HTTP_METHOD.GET,
      }),
    ];
    const result = await controllerCurrentUser.findIncentiveById('randomNationalId');
    mockIncentive.links = links;
    expect(result).to.deepEqual(mockIncentive);
  });

  it('patch(/v1/incentives/{incentiveId}) territory id not given', async () => {
    incentiveRepository.stubs.updateById.resolves();
    try {
      await controllerCurrentUser.updateById(
        '606c236a624cec2becdef276',
        mockIncentiveWithoutTerritoryId,
      );
    } catch (err) {
      expect(err).to.deepEqual(territoryIdNotGiven);
    }
  });

  it('patch(/v1/incentives/{incentiveId}) mismatch territory name', async () => {
    repositoryTerritory.stubs.findById.resolves(territoryWrongName);
    incentiveRepository.stubs.updateById.resolves();
    try {
      await controllerCurrentUser.updateById(
        '606c236a624cec2becdef276',
        mockIncentiveWithSubscriptionLink,
      );
    } catch (err) {
      expect(err).to.deepEqual(territoryNameMismatch);
    }
  });

  it('patch(/v1/incentives/{incentiveId}) subscription link', async () => {
    repositoryTerritory.stubs.findById.resolves(territoryMock);

    eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithSubscriptionLink);
    incentiveRepository.stubs.updateById.resolves();
    await controllerCurrentUser.updateById(
      '606c236a624cec2becdef276',
      mockIncentiveWithSubscriptionLink,
    );

    expect(incentiveRepository.stubs.updateById.called).true();
  });

  it('patch(/v1/incentives/{incentiveId}) additionalInfos', async () => {
    eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithoutAdditionalInfos);
    incentiveRepository.stubs.updateById.resolves();
    await controllerCurrentUser.updateById(
      '606c236a624cec2becdef276',
      mockIncentiveWithoutAdditionalInfos,
    );

    expect(incentiveRepository.stubs.updateById.called).true();
  });
  it('patch(/v1/incentives/{incentiveId}) removeFunderId', async () => {
    eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithoutFunderId);
    incentiveRepository.stubs.updateById.resolves();
    await controllerCurrentUser.updateById(
      '606c236a624cec2becdef276',
      mockIncentiveWithFunderId,
    );

    expect(incentiveRepository.stubs.updateById.called).true();
  });
  it('patch(/v1/incentives/{incentiveId}) validityDate', async () => {
    eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithoutValidityDate);
    incentiveRepository.stubs.updateById.resolves();
    await controllerCurrentUser.updateById(
      '606c236a624cec2becdef276',
      mockIncentiveWithoutValidityDate,
    );

    expect(incentiveRepository.stubs.updateById.called).true();
  });
  it('patch(/v1/incentives/{incentiveId}) validityDuration', async () => {
    eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithoutValidityDuration);
    incentiveRepository.stubs.updateById.resolves();
    await controllerCurrentUser.updateById(
      '606c236a624cec2becdef276',
      mockIncentiveWithoutValidityDuration,
    );

    expect(incentiveRepository.stubs.updateById.called).true();
  });
  it('patch(/v1/incentives/{incentiveId}) contact', async () => {
    eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithoutContact);
    incentiveRepository.stubs.updateById.resolves();
    await controllerCurrentUser.updateById(
      '606c236a624cec2becdef276',
      mockIncentiveWithoutContact,
    );

    expect(incentiveRepository.stubs.updateById.called).true();
  });

  it('patch(/v1/incentives/{incentiveId}) specific fields', async () => {
    eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithSpecificFields);
    repositoryTerritory.stubs.findById.resolves(territoryMock);
    incentiveRepository.stubs.updateById.resolves();
    await controllerCurrentUser.updateById(
      '606c236a624cec2becdef276',
      mockIncentiveWithSpecificFields,
    );

    expect(incentiveRepository.stubs.updateById.called).true();
  });

  it('patch(/v1/incentives/{incentiveId}) add exclusion to current incentive', async () => {
    try {
      const currentIncentive = createIncentive({
        id: 'id-current-incentive',
        eligibilityChecks: [
          new EligibilityCheck({
            id: 'uuid-fc',
            value: [],
            active: true,
          }),
          new EligibilityCheck({
            id: 'uuid-exclusion',
            value: ['test'],
            active: true,
          }),
        ],
      });
      const excludedIncentive1 = createIncentive({id: 'id-add-aide1'});
      delete excludedIncentive1.eligibilityChecks;
      const excludedIncentive2 = createIncentive({
        id: 'id-add-aide2',
        eligibilityChecks: [
          new EligibilityCheck({id: 'uuid-fc', value: [], active: true}),
        ],
      });
      const excludedIncentive3 = createIncentive({
        id: 'id-add-aide3',
        eligibilityChecks: [
          new EligibilityCheck({
            id: 'uuid-fc',
            value: [],
            active: true,
          }),
          new EligibilityCheck({
            id: 'uuid-exclusion',
            value: ['test'],
            active: false,
          }),
        ],
      });
      const updatedIncentive = createIncentive({
        id: currentIncentive.id,
        eligibilityChecks: [
          new EligibilityCheck({
            id: 'uuid-fc',
            value: [],
            active: true,
          }),
          new EligibilityCheck({
            id: 'uuid-exclusion',
            value: ['test', excludedIncentive1.id, excludedIncentive2.id],
            active: true,
          }),
        ],
      });

      eligibilityChecksRepository.stubs.findOne.resolves(
        mockIncentiveEligibilityCheck[1],
      );
      incentiveRepository.stubs.findById.resolves(currentIncentive);
      repositoryTerritory.stubs.findById.resolves(territoryMock);
      incentiveRepository.stubs.updateById.resolves();
      incentiveRepository.stubs.find.resolves([
        excludedIncentive1,
        excludedIncentive2,
        excludedIncentive3,
      ]);
      incentiveService.stubs.getIncentiveIdsToDelete.returns([]);
      incentiveService.stubs.getIncentiveIdsToAdd.returns([
        excludedIncentive1.id,
        excludedIncentive2.id,
        excludedIncentive3.id,
      ]);
      incentiveService.stubs.addIncentiveToExclusions.returns([
        new EligibilityCheck({
          id: 'uuid-exclusion',
          value: [updatedIncentive.id],
          active: updatedIncentive.eligibilityChecks![1].active,
        }),
      ]);

      await controllerCurrentUser.updateById(updatedIncentive.id, updatedIncentive);

      sinon.assert.calledWith(
        incentiveRepository.stubs.updateById,
        excludedIncentive1.id,
      );
      sinon.assert.calledWith(
        incentiveRepository.stubs.updateById,
        excludedIncentive2.id,
      );
      sinon.assert.calledWith(
        incentiveRepository.stubs.updateById,
        excludedIncentive3.id,
      );
      sinon.assert.calledWith(
        incentiveRepository.stubs.updateById,
        currentIncentive.id,
        sinon.match.has('eligibilityChecks', updatedIncentive.eligibilityChecks),
      );
      sinon.assert.calledWith(
        incentiveRepository.stubs.updateById,
        currentIncentive.id,
        updatedIncentive,
      );
      expect(updatedIncentive.eligibilityChecks![1].value.includes(excludedIncentive1.id))
        .to.be.true;
      expect(updatedIncentive.eligibilityChecks![1].value.includes(excludedIncentive2.id))
        .to.be.true;
      expect(updatedIncentive.eligibilityChecks![1].value.includes(excludedIncentive3.id))
        .to.be.true;
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('patch(/v1/incentives/{incentiveId}) remove exclusion from current incentive', async () => {
    try {
      const updatedIncentive = createIncentive({
        id: 'id-current-incentive',
        eligibilityChecks: [
          new EligibilityCheck({
            id: 'uuid-fc',
            value: [],
            active: true,
          }),
          new EligibilityCheck({
            id: 'uuid-exclusion',
            value: ['test'],
            active: true,
          }),
        ],
      });
      const excludedIncentive1 = createIncentive({
        id: 'id-delete-aide1',
        eligibilityChecks: [
          new EligibilityCheck({
            id: 'uuid-exclusion',
            value: [updatedIncentive.id],
            active: true,
          }),
        ],
      });
      const excludedIncentive2 = createIncentive({
        id: 'id-delete-aide2',
        eligibilityChecks: [
          new EligibilityCheck({
            id: 'uuid-fc',
            value: [],
            active: true,
          }),
          new EligibilityCheck({
            id: 'uuid-exclusion',
            value: [updatedIncentive.id],
            active: true,
          }),
        ],
      });
      const excludedIncentive3 = createIncentive({
        id: 'id-delete-aide3',
        eligibilityChecks: [
          new EligibilityCheck({
            id: 'uuid-exclusion',
            value: ['test', updatedIncentive.id],
            active: true,
          }),
        ],
      });
      const currentIncentive = createIncentive({
        id: updatedIncentive.id,
        eligibilityChecks: [
          new EligibilityCheck({
            id: 'uuid-fc',
            value: [],
            active: true,
          }),
          new EligibilityCheck({
            id: 'uuid-exclusion',
            value: [
              'test',
              excludedIncentive1.id,
              excludedIncentive2.id,
              excludedIncentive3.id,
            ],
            active: true,
          }),
        ],
      });

      eligibilityChecksRepository.stubs.findOne.resolves(
        mockIncentiveEligibilityCheck[1],
      );
      incentiveRepository.stubs.findById.resolves(currentIncentive);
      repositoryTerritory.stubs.findById.resolves(territoryMock);
      incentiveRepository.stubs.updateById.resolves();
      incentiveRepository.stubs.find.resolves([
        excludedIncentive1,
        excludedIncentive2,
        excludedIncentive3,
      ]);
      const excludedIncentive1NoEC = JSON.parse(JSON.stringify(excludedIncentive1));
      delete excludedIncentive1NoEC.eligibilityChecks;
      incentiveService.stubs.getIncentiveIdsToAdd.returns([]);
      incentiveService.stubs.getIncentiveIdsToDelete.returns([
        excludedIncentive1.id,
        excludedIncentive2.id,
        excludedIncentive3.id,
      ]);
      incentiveService.stubs.removeIncentiveFromExclusions
        .onFirstCall()
        .returns(excludedIncentive1NoEC);
      incentiveService.stubs.removeIncentiveFromExclusions
        .onSecondCall()
        .returns(excludedIncentive2);
      incentiveService.stubs.removeIncentiveFromExclusions
        .onThirdCall()
        .returns(excludedIncentive3);
      await controllerCurrentUser.updateById(updatedIncentive.id, updatedIncentive);

      sinon.assert.calledWith(
        incentiveRepository.stubs.updateById,
        excludedIncentive1.id,
        {
          $unset: {eligibilityChecks: []},
        } as any,
      );
      sinon.assert.calledWith(
        incentiveRepository.stubs.updateById,
        excludedIncentive2.id,
        {
          eligibilityChecks: excludedIncentive2.eligibilityChecks,
        },
      );
      sinon.assert.calledWith(
        incentiveRepository.stubs.updateById,
        excludedIncentive3.id,
        {
          eligibilityChecks: excludedIncentive3.eligibilityChecks,
        },
      );
      sinon.assert.calledWith(
        incentiveRepository.stubs.updateById,
        currentIncentive.id,
        updatedIncentive,
      );
      expect(updatedIncentive.eligibilityChecks![1].value.includes(excludedIncentive1.id))
        .to.be.false;
      expect(updatedIncentive.eligibilityChecks![1].value.includes(excludedIncentive2.id))
        .to.be.false;
      expect(updatedIncentive.eligibilityChecks![1].value.includes(excludedIncentive3.id))
        .to.be.false;
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('del(/v1/incentives/{incentiveId})', async () => {
    incentiveRepository.stubs.deleteById.resolves();

    const incentiveList = await controllerCurrentUser.deleteById(
      '606c236a624cec2becdef276',
    );

    expect(incentiveList).to.deepEqual(undefined);
  });

  function givenStubbedRepository() {
    incentiveRepository = createStubInstance(IncentiveRepository);
  }
  function givenStubbedCollectivityRepository() {
    repositoryCollectivity = createStubInstance(CollectivityRepository);
  }

  function givenStubbedEntrpriseRepository() {
    repositoryEnterprise = createStubInstance(EnterpriseRepository);
  }

  function givenStubbedCitizenService() {
    citizenService = createStubInstance(CitizenService);
  }

  function givenStubbedTerritoryRepository() {
    repositoryTerritory = createStubInstance(TerritoryRepository);
  }

  function givenStubbedIncentiveEligibilityChecksRepository() {
    eligibilityChecksRepository = createStubInstance(
      IncentiveEligibilityChecksRepository,
    );
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

const mockIncentiveEligibilityCheck = [
  new IncentiveEligibilityChecks({
    id: 'uuid-fc',
    label: ELIGIBILITY_CHECKS_LABEL.FRANCE_CONNECT,
    name: 'Identité FranceConnect',
    description:
      "Les données d'identité doivent être fournies/certifiées par FranceConnect",
    type: 'boolean',
    motifRejet: 'CompteNonFranceConnect',
  }),
  new IncentiveEligibilityChecks({
    id: 'uuid-exclusion',
    label: ELIGIBILITY_CHECKS_LABEL.EXCLUSION,
    name: 'Offre à caractère exclusive, non cumulable',
    description: "1 souscription valide pour un ensemble d'aides mutuellement exclusives",
    type: 'array',
    motifRejet: 'SouscriptionValideeExistante',
  }),
];

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
  subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.MANUAL,
});

const mockCollectivityIncentiveWithEligibilityCheck = new Incentive({
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
  subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.AUTOMATIC,
  eligibilityChecks: [
    new EligibilityCheck({
      id: 'uuid-fc',
      value: [],
      active: true,
    }),
    new EligibilityCheck({
      id: 'uuid-exclusion',
      value: ['test'],
      active: true,
    }),
  ],
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
      isRequired: true,
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
      isRequired: true,
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

const mockIncentiveWithSpecificFields: Incentive = new Incentive({
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
      isRequired: true,
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
      isRequired: true,
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
const mockIncentiveWithFunderId = new Incentive({
  funderId: '@@ra-create',
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
const mockIncentiveWithoutFunderId = new Incentive({
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
    status: AFFILIATION_STATUS.TO_AFFILIATE,
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
    status: AFFILIATION_STATUS.AFFILIATED,
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

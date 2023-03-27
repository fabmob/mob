import {AnyObject, Filter} from '@loopback/repository';
import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor, toJSON} from '@loopback/testlab';
import {securityId} from '@loopback/security';
import _ from 'lodash';

import {IncentiveController} from '../../controllers';
import {
  Incentive,
  Citizen,
  Link,
  Territory,
  IncentiveEligibilityChecks,
  EligibilityCheck,
  Collectivity,
  Enterprise,
  EnterpriseDetails,
  NationalAdministration,
  Funder,
  Affiliation,
} from '../../models';
import {
  IncentiveRepository,
  TerritoryRepository,
  IncentiveEligibilityChecksRepository,
  FunderRepository,
  AffiliationRepository,
} from '../../repositories';
import {IncentiveService, CitizenService, GeoApiGouvService} from '../../services';
import {
  AFFILIATION_STATUS,
  CITIZEN_STATUS,
  StatusCode,
  HTTP_METHOD,
  IUser,
  SUBSCRIPTION_CHECK_MODE,
  ELIGIBILITY_CHECKS_LABEL,
  INCENTIVE_TYPE,
  IGeoApiGouvResponseResult,
  SCALE,
  FilterSearchIncentive,
} from '../../utils';
import {WEBSITE_FQDN} from '../../constants';
import {TerritoryService} from '../../services/territory.service';
import {createIncentive} from '../dataFactory';
import {testdbMongo} from '../repositories/testdb.datasource';
import {givenEmptyIncentiveCollection, givenIncentives} from '../helpers';

describe('Incentives Controller', () => {
  let controllerCurrentUser: IncentiveController,
    incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>,
    repositoryTerritory: StubbedInstanceWithSinonAccessor<TerritoryRepository>,
    eligibilityChecksRepository: StubbedInstanceWithSinonAccessor<IncentiveEligibilityChecksRepository>,
    incentiveService: StubbedInstanceWithSinonAccessor<IncentiveService>,
    territoryService: StubbedInstanceWithSinonAccessor<TerritoryService>,
    geoApiGouvService: StubbedInstanceWithSinonAccessor<GeoApiGouvService>,
    citizenService: StubbedInstanceWithSinonAccessor<CitizenService>,
    incentiveRepositoryReelDatabase: IncentiveRepository,
    affiliationRepository: StubbedInstanceWithSinonAccessor<AffiliationRepository>;

  before(async () => {
    incentiveRepositoryReelDatabase = new IncentiveRepository(
      testdbMongo,
      async () => repositoryTerritory,
      async () => funderRepository,
    );
  });

  beforeEach(givenEmptyIncentiveCollection);

  const responseOk: any = {
    status: function () {
      return this;
    },
    contentType: function () {
      return this;
    },
    send: (body: any) => body,
  };
  beforeEach(() => {
    givenStubbedRepository();
    givenStubbedService();
    controllerCurrentUser = new IncentiveController(
      responseOk,
      incentiveRepository,
      funderRepository,
      repositoryTerritory,
      eligibilityChecksRepository,
      affiliationRepository,
      incentiveService,
      territoryService,
      citizenService,
      geoApiGouvService,
      currentUser,
    );
  });

  it('post(/v1/incentives) with incentive type ENTERPRISE', async () => {
    repositoryTerritory.stubs.find.resolves([territoryMock]);
    incentiveRepository.stubs.create.resolves(mockCreateEnterpriseIncentive);
    funderRepository.stubs.getEnterpriseById.resolves(mockEnterprise);
    const result = await controllerCurrentUser.create(mockEnterpriseIncentive);

    expect(result.funderId).to.deepEqual('randomInputIdEnterprise');
  });

  it('post(/v1/incentives) with incentive type COLLECTIVITY', async () => {
    repositoryTerritory.stubs.find.resolves([territoryMock]);
    incentiveRepository.stubs.create.resolves(mockCreateCollectivityIncentive);
    funderRepository.stubs.getCollectivityById.resolves(mockCollectivity);
    const result = await controllerCurrentUser.create(mockCollectivityIncentive);

    expect(result.funderId).to.deepEqual('randomInputIdCollectivity');
  });

  it('post(/v1/incentives) with incentive type NATIONAL', async () => {
    repositoryTerritory.stubs.find.resolves([territoryMock]);
    incentiveRepository.stubs.create.resolves(mockCreateNationalIncentive);
    funderRepository.stubs.findById.resolves(mockNational);
    const result = await controllerCurrentUser.create(mockCreateNationalIncentive);

    expect(result.funderId).to.deepEqual('randomInputIdNational');
  });

  it('post(/v1/incentives) with specific fields', async () => {
    repositoryTerritory.stubs.find.resolves([territoryMock]);
    incentiveRepository.stubs.create.resolves(mockCreateIncentiveWithSpecificFields);
    funderRepository.stubs.getCollectivityById.resolves(mockCollectivity);
    const result = await controllerCurrentUser.create(mockIncentiveWithSpecificFields);

    expect(result.funderId).to.deepEqual('randomInputIdCollectivity');
  });

  it('post(/v1/incentives) check mode auto delete created incentive on error', async () => {
    try {
      repositoryTerritory.stubs.find.resolves([territoryMock]);
      funderRepository.stubs.getCollectivityById.resolves(mockCollectivity);
      incentiveRepository.stubs.create.returnsArg(0);
      incentiveRepository.stubs.deleteById.resolves();
      incentiveRepository.stubs.find.resolves([mockCollectivityIncentiveWithEligibilityCheck]);
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
      repositoryTerritory.stubs.find.resolves([territoryMock]);
      funderRepository.stubs.getCollectivityById.resolves(mockCollectivity);
      incentiveRepository.stubs.create.returnsArg(0);
      eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);

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

      repositoryTerritory.stubs.find.resolves([territoryMock]);
      funderRepository.stubs.getCollectivityById.resolves(mockCollectivity);
      incentiveService.stubs.addIncentiveToExclusions.returns([
        new EligibilityCheck({
          id: 'uuid-exclusion',
          value: [incentive.id],
          active: incentive.eligibilityChecks![1].active,
        }),
      ]);
      incentiveRepository.stubs.create.returnsArg(0);
      incentiveRepository.stubs.find.resolves([excludedIncentive1, excludedIncentive2, excludedIncentive3]);
      incentiveRepository.stubs.updateById.resolves();
      eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);

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
      sinon.assert.calledWith(incentiveRepository.stubs.updateById, excludedIncentive1.id);
      sinon.assert.calledWith(incentiveRepository.stubs.updateById, excludedIncentive2.id);
      sinon.assert.calledWith(incentiveRepository.stubs.updateById, excludedIncentive3.id);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('post(/v1/incentives) territory id not given', async () => {
    repositoryTerritory.stubs.find.resolves([]);
    incentiveRepository.stubs.create.resolves();
    try {
      await controllerCurrentUser.create(mockIncentiveWithoutTerritoryId);
    } catch (err) {
      expect(err.message).to.equal('territory.not.found');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('GET v1/incentives ERROR', async () => {
    try {
      incentiveRepository.stubs.find.rejects(new Error('Error'));
      const response: any = {};
      await controllerCurrentUser.find(response);
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
  });

  it('GET /v1/incentives should return public and private incentives for user content_editor', async () => {
    const currentUserContentEditor: IUser = {
      id: 'contentEditorId',
      emailVerified: true,
      clientName: undefined,
      funderType: undefined,
      funderName: undefined,
      incentiveType: undefined,
      groups: ['admins'],
      roles: ['default-roles-mcm', 'content_editor', 'offline_access', 'uma_authorization', 'platform'],
      [securityId]: 'contentEditorId',
    };

    // add incentive to database
    const incentiveList = await givenIncentives([
      incentiveMockEmployee,
      incentiveMockTerritory,
      incentiveMockNational,
    ]);

    const controller = new IncentiveController(
      responseOk,
      new IncentiveRepository(
        testdbMongo,
        async () => repositoryTerritory,
        async () => funderRepository,
      ),
      funderRepository,
      repositoryTerritory,
      eligibilityChecksRepository,
      affiliationRepository,
      incentiveService,
      territoryService,
      citizenService,
      geoApiGouvService,
      currentUserContentEditor,
    );

    const filter: Filter<Incentive> = {
      fields: {
        updatedAt: false,
      },
    };

    const result = await controller.find(filter);
    expect(result).to.be.an.instanceOf(Array);
    expect(toJSON(result)).to.deepEqual(
      toJSON(incentiveList.map(incentive => _.omit(incentive, ['updatedAt']))),
    );
  });

  it('GET /v1/incentives should return public incentives for MAAS_BACKEND user', async () => {
    const currentUserMaasBackend: IUser = {
      id: 'maasId',
      emailVerified: undefined,
      clientName: 'simulation-maas-backend',
      funderType: undefined,
      funderName: undefined,
      incentiveType: undefined,
      groups: undefined,
      roles: ['offline_access', 'service_maas', 'maas'],
      [securityId]: 'maasId',
    };

    const incentives = await givenIncentives([
      incentiveMockEmployee,
      incentiveMockTerritory,
      incentiveMockNational,
    ]);

    const controller = new IncentiveController(
      responseOk,
      new IncentiveRepository(
        testdbMongo,
        async () => repositoryTerritory,
        async () => funderRepository,
      ),
      funderRepository,
      repositoryTerritory,
      eligibilityChecksRepository,
      affiliationRepository,
      incentiveService,
      territoryService,
      citizenService,
      geoApiGouvService,
      currentUserMaasBackend,
    );

    const filter: Filter<Incentive> = {
      fields: {
        updatedAt: false,
      },
    };

    const result = await controller.find(filter);
    expect(result).to.be.an.instanceOf(Array);
    expect(toJSON(result)).to.deepEqual(
      toJSON([
        _.omit(incentives[1], [
          'updatedAt',
          'eligibilityChecks',
          'isCertifiedTimestampRequired',
          'subscriptionCheckMode',
        ]),
        _.omit(incentives[2], [
          'updatedAt',
          'eligibilityChecks',
          'isCertifiedTimestampRequired',
          'subscriptionCheckMode',
        ]),
      ]),
    );
  });

  it('GET /v1/incentives should return private incentives for affiliated SERVICE_MAAS user', async () => {
    const currentUserServiceMaas: IUser = {
      clientName: 'maas-client',
      emailVerified: undefined,
      funderName: undefined,
      funderType: undefined,
      groups: undefined,
      id: 'maasId',
      roles: ['default-roles-mcm', 'offline_access', 'citoyens', 'uma_authorization', 'maas'],
      [securityId]: 'maasId',
    };

    const incentives = await givenIncentives([
      incentiveMockEmployee,
      incentiveMockTerritory,
      incentiveMockNational,
    ]);

    affiliationRepository.stubs.findById.resolves({
      enterpriseId: 'funderId',
      status: AFFILIATION_STATUS.AFFILIATED,
    } as Affiliation);

    const controller = new IncentiveController(
      responseOk,
      incentiveRepositoryReelDatabase,
      funderRepository,
      repositoryTerritory,
      eligibilityChecksRepository,
      affiliationRepository,
      incentiveService,
      territoryService,
      citizenService,
      geoApiGouvService,
      currentUserServiceMaas,
    );

    const filter: Filter<Incentive> = {
      fields: {
        updatedAt: false,
        createdAt: false,
        transportList: false,
      },
      where: {incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE},
    };

    const result = await controller.find(filter);
    expect(result).to.be.an.instanceOf(Array);
    expect(toJSON(result)).to.deepEqual(
      toJSON([
        _.omit(incentives[0], [
          'updatedAt',
          'transportList',
          'createdAt',
          'isCertifiedTimestampRequired',
          'subscriptionCheckMode',
        ]),
      ]),
    );
  });

  it('GET /v1/incentives should not return private incentives for not affiliated user', async () => {
    const currentUserServiceMaas: IUser = {
      clientName: 'maas-client',
      emailVerified: undefined,
      funderName: undefined,
      funderType: undefined,
      groups: undefined,
      id: 'maasId',
      roles: ['default-roles-mcm', 'offline_access', 'citoyens', 'uma_authorization', 'maas'],
      [securityId]: 'maasId',
    };

    await givenIncentives([incentiveMockEmployee, incentiveMockTerritory, incentiveMockNational]);

    affiliationRepository.stubs.findById.resolves({status: AFFILIATION_STATUS.TO_AFFILIATE} as Affiliation);

    const controller = new IncentiveController(
      responseOk,
      incentiveRepositoryReelDatabase,
      funderRepository,
      repositoryTerritory,
      eligibilityChecksRepository,
      affiliationRepository,
      incentiveService,
      territoryService,
      citizenService,
      geoApiGouvService,
      currentUserServiceMaas,
    );

    const filter: Filter<Incentive> = {
      fields: {
        updatedAt: false,
        createdAt: false,
        transportList: false,
      },
      where: {incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE},
    };

    const result = await controller.find(filter);
    expect(result).to.be.an.instanceOf(Array);
    expect(toJSON(result)).to.deepEqual([]);
  });

  it('GET /v1/incentives should not return other private incentives when citizen affiliated', async () => {
    const currentUserServiceMaas: IUser = {
      clientName: 'maas-client',
      emailVerified: undefined,
      funderName: undefined,
      funderType: undefined,
      groups: undefined,
      id: 'maasId',
      roles: ['default-roles-mcm', 'offline_access', 'citoyens', 'uma_authorization', 'maas'],
      [securityId]: 'maasId',
    };

    const incentives = await givenIncentives([
      incentiveMockEmployee,
      incentiveMockTerritory,
      incentiveMockNational,
    ]);

    affiliationRepository.stubs.findById.resolves({
      enterpriseId: 'differentFunderId',
      status: AFFILIATION_STATUS.AFFILIATED,
    } as Affiliation);

    const controller = new IncentiveController(
      responseOk,
      incentiveRepositoryReelDatabase,
      funderRepository,
      repositoryTerritory,
      eligibilityChecksRepository,
      affiliationRepository,
      incentiveService,
      territoryService,
      citizenService,
      geoApiGouvService,
      currentUserServiceMaas,
    );

    const filter: Filter<Incentive> = {
      fields: {
        updatedAt: false,
        transportList: false,
      },
    };

    const result = await controller.find(filter);
    expect(result).to.be.an.instanceOf(Array);
    expect(toJSON(result)).to.deepEqual(
      toJSON([
        _.omit(incentives[1], [
          'updatedAt',
          'eligibilityChecks',
          'isCertifiedTimestampRequired',
          'subscriptionCheckMode',
          'transportList',
        ]),
        _.omit(incentives[2], [
          'updatedAt',
          'eligibilityChecks',
          'isCertifiedTimestampRequired',
          'subscriptionCheckMode',
          'transportList',
        ]),
      ]),
    );
  });

  it('GET /v1/incentives should return err when only inaccessible fields are requested', async () => {
    const currentUserMaasBackend: IUser = {
      id: 'maasId',
      emailVerified: undefined,
      clientName: 'simulation-maas-backend',
      funderType: undefined,
      funderName: undefined,
      incentiveType: undefined,
      groups: undefined,
      roles: ['offline_access', 'service_maas', 'maas'],
      [securityId]: 'maasrId',
    };

    const controller = new IncentiveController(
      responseOk,
      incentiveRepository,
      funderRepository,
      repositoryTerritory,
      eligibilityChecksRepository,
      affiliationRepository,
      incentiveService,
      territoryService,
      citizenService,
      geoApiGouvService,
      currentUserMaasBackend,
    );

    const filter: Filter<Incentive> = {
      fields: {
        eligibilityChecks: true,
        isCertifiedTimestampRequired: true,
        subscriptionCheckMode: true,
      },
    };

    try {
      await controller.find(filter);
    } catch (err) {
      expect(err.message).to.deepEqual('Access denied');
    }
  });

  it('get(/v1/incentives/search) ERROR', async () => {
    try {
      incentiveRepository.stubs.execute.rejects(
        Promise.resolve({
          catch: () => Promise.reject(new Error('Error')),
        }),
      );
      await controllerCurrentUser.search();
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
  });

  it('get(/v1/incentives/search) no arguments not connected no fields', async () => {
    incentiveRepository.stubs.execute.resolves(
      Promise.resolve({
        get: () => [mockIncentiveWithSpecificFields],
      }),
    );

    const incentiveList = await controllerCurrentUser.search();

    const expectedMatch = {
      incentiveType: {$ne: INCENTIVE_TYPE.EMPLOYER_INCENTIVE} as any,
    };

    const args = incentiveRepository.stubs.execute.getCall(0).args;

    expect(args[0]).equal('Incentive');
    expect(args[1]).equal('aggregate');
    expect(args[2]).to.be.Array();
    // Bypass match of addfields because of indentation issues
    expect(args[2]).matchAny({$match: expectedMatch});
    expect(args[2]).matchAny({$lookup: expectedLookup});
    expect(args[2]).matchAny({$sort: expectedSort});
    expect(args[2]).matchAny({$unset: expectedUnset});

    expect(incentiveList).to.deepEqual([mockIncentiveWithSpecificFields]);
  });

  it('get(/v1/incentives/search) no arguments not connected no fields with filter territoryIds', async () => {
    incentiveRepository.stubs.execute.resolves(
      Promise.resolve({
        get: () => [mockIncentiveWithSpecificFields],
      }),
    );

    const filter: AnyObject = {limit: 10, where: {territoryIds: {inq: ['test']}}};
    const incentiveList = await controllerCurrentUser.search(undefined, filter);

    const expectedMatch = {
      incentiveType: {$ne: INCENTIVE_TYPE.EMPLOYER_INCENTIVE} as any,
    };

    const expectedTerritoryIdsMatch = {
      territoryIds: {$in: ['test']},
    };

    const args = incentiveRepository.stubs.execute.getCall(0).args;

    expect(args[0]).equal('Incentive');
    expect(args[1]).equal('aggregate');
    expect(args[2]).to.be.Array();
    // Bypass match of addfields because of indentation issues
    expect(args[2]).matchAny({$match: expectedMatch});
    expect(args[2]).matchAny({$lookup: expectedLookup});
    expect(args[2]).matchAny({$match: expectedTerritoryIdsMatch});
    expect(args[2]).matchAny({$sort: expectedSort});
    expect(args[2]).matchAny({$unset: expectedUnset});

    expect(incentiveList).to.deepEqual([mockIncentiveWithSpecificFields]);
  });

  it('get(/v1/incentives/search) no arguments connected postcode city affiliated', async () => {
    const controller = new IncentiveController(
      responseOk,
      incentiveRepository,
      funderRepository,
      repositoryTerritory,
      eligibilityChecksRepository,
      affiliationRepository,
      incentiveService,
      territoryService,
      citizenService,
      geoApiGouvService,
      currentUserMaas,
    );

    const geoApiGouvResultMock: IGeoApiGouvResponseResult[] = [
      {nom: 'Paris', code: '11111', codeDepartement: '75', codeRegion: '75', _score: 1},
    ];

    citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);

    geoApiGouvService.stubs.getCommunesByPostalCodeAndCity.resolves(geoApiGouvResultMock);

    incentiveRepository.stubs.execute.resolves(
      Promise.resolve({
        get: () => [mockIncentiveWithSpecificFields],
      }),
    );

    const incentiveList = await controller.search();

    const expectedMatch = {
      $or: [
        {
          incentiveType: {
            $in: [INCENTIVE_TYPE.NATIONAL_INCENTIVE, INCENTIVE_TYPE.TERRITORY_INCENTIVE],
          },
        },
        {
          incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
          funderId: 'someFunderId',
        },
      ],
    };

    const expectedFacet = {
      filterIncentiveByMatch: [
        {
          $match: {
            $or: [
              {
                'territoryLookup.inseeValueList': {
                  $in: [
                    geoApiGouvResultMock![0].code,
                    geoApiGouvResultMock![0].codeDepartement,
                    geoApiGouvResultMock![0].codeRegion,
                  ],
                },
              },
              {
                'territoryLookup.scale': {$eq: SCALE.NATIONAL},
              },
            ],
          },
        },
        {
          $sort: {
            'territoryLookup.scaleWeight': 1,
            funderName: 1,
          },
        },
      ],
      filterIncentiveByNotMatch: [
        {
          $match: {
            $and: [
              {
                'territoryLookup.inseeValueList': {
                  $nin: [
                    geoApiGouvResultMock![0].code,
                    geoApiGouvResultMock![0].codeDepartement,
                    geoApiGouvResultMock![0].codeRegion,
                  ],
                },
              },
              {
                'territoryLookup.scale': {
                  $ne: SCALE.NATIONAL,
                },
              },
            ],
          },
        },
        {$sort: {funderName: 1}},
      ],
    };

    const expectedReplaceRoot = {newRoot: '$result'};

    const args = incentiveRepository.stubs.execute.getCall(0).args;

    expect(args[0]).equal('Incentive');
    expect(args[1]).equal('aggregate');
    expect(args[2]).to.be.Array();
    // Bypass match of addfields because of indentation issues
    expect(args[2]).matchAny({$match: expectedMatch});
    expect(args[2]).matchAny({$lookup: expectedLookup});
    expect(args[2]).matchAny({$facet: expectedFacet});
    expect(args[2]).matchAny({$project: expectedProject});
    expect(args[2]).matchAny({$unwind: '$result'});
    expect(args[2]).matchAny({$replaceRoot: expectedReplaceRoot});
    expect(args[2]).matchAny({$unset: expectedUnset});

    sinon.assert.calledWith(
      geoApiGouvService.stubs.getCommunesByPostalCodeAndCity,
      mockCitizen.postcode,
      mockCitizen.city,
    );

    expect(incentiveList).to.deepEqual([mockIncentiveWithSpecificFields]);
  });

  it('get(/v1/incentives/search) no arguments connected postcode city affiliated geogouv empty', async () => {
    const controller = new IncentiveController(
      responseOk,
      incentiveRepository,
      funderRepository,
      repositoryTerritory,
      eligibilityChecksRepository,
      affiliationRepository,
      incentiveService,
      territoryService,
      citizenService,
      geoApiGouvService,
      currentUserMaas,
    );

    citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);

    geoApiGouvService.stubs.getCommunesByPostalCodeAndCity.resolves([]);

    incentiveRepository.stubs.execute.resolves(
      Promise.resolve({
        get: () => [mockIncentiveWithSpecificFields],
      }),
    );

    const incentiveList = await controller.search();

    const expectedMatch = {
      $or: [
        {
          incentiveType: {
            $in: [INCENTIVE_TYPE.NATIONAL_INCENTIVE, INCENTIVE_TYPE.TERRITORY_INCENTIVE],
          },
        },
        {
          incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
          funderId: 'someFunderId',
        },
      ],
    };

    const args = incentiveRepository.stubs.execute.getCall(0).args;

    expect(args[0]).equal('Incentive');
    expect(args[1]).equal('aggregate');
    expect(args[2]).to.be.Array();
    // Bypass match of addfields because of indentation issues
    expect(args[2]).matchAny({$match: expectedMatch});
    expect(args[2]).matchAny({$lookup: expectedLookup});
    expect(args[2]).matchAny({$sort: expectedSort});
    expect(args[2]).matchAny({$unset: expectedUnset});

    sinon.assert.calledWith(
      geoApiGouvService.stubs.getCommunesByPostalCodeAndCity,
      mockCitizen.postcode,
      mockCitizen.city,
    );

    expect(incentiveList).to.deepEqual([mockIncentiveWithSpecificFields]);
  });

  it('get(/v1/incentives/search) with fields not connected', async () => {
    incentiveRepository.stubs.execute.resolves(
      Promise.resolve({
        get: () => [{id: 'test'}],
      }),
    );

    const incentiveList = await controllerCurrentUser.search(undefined, {
      fields: {id: true},
    });

    const expectedMatch = {
      incentiveType: {$ne: INCENTIVE_TYPE.EMPLOYER_INCENTIVE} as any,
    };

    const expectedProject = {id: true};

    const args = incentiveRepository.stubs.execute.getCall(0).args;

    expect(args[0]).equal('Incentive');
    expect(args[1]).equal('aggregate');
    expect(args[2]).to.be.Array();
    // Bypass match of addfields because of indentation issues
    expect(args[2]).matchAny({$match: expectedMatch});
    expect(args[2]).matchAny({$lookup: expectedLookup});
    expect(args[2]).matchAny({$sort: expectedSort});
    expect(args[2]).matchAny({$unset: expectedUnset});
    expect(args[2]).matchAny({$project: expectedProject});

    expect(incentiveList).to.deepEqual([{id: 'test'}]);
  });

  it('get(/v1/incentives/count)', async () => {
    const countRes = {
      count: 10,
    };
    incentiveRepository.stubs.count.resolves(countRes);
    const result = await controllerCurrentUser.count();

    expect(result).to.deepEqual(countRes);
  });

  it('get(/v1/incentives/{incentiveId}) ERROR', async () => {
    try {
      incentiveRepository.stubs.findById.rejects(new Error('Error'));
      await controllerCurrentUser.findIncentiveById('606c236a624cec2becdef276');
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
  });

  it('get(/v1/incentives/{incentiveId})', async () => {
    const mockIncentive = Object.assign({}, mockCollectivityIncentive, {
      isMCMStaff: false,
    });
    incentiveRepository.stubs.findById.resolves(mockIncentive);
    const incentive = await controllerCurrentUser.findIncentiveById('606c236a624cec2becdef276');

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
    repositoryTerritory.stubs.find.resolves([]);
    incentiveRepository.stubs.updateById.resolves();
    try {
      await controllerCurrentUser.updateById('606c236a624cec2becdef276', mockIncentiveWithoutTerritoryId);
    } catch (err) {
      expect(err.message).to.equal('territory.not.found');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('patch(/v1/incentives/{incentiveId}) subscription link', async () => {
    repositoryTerritory.stubs.find.resolves([territoryMock]);

    eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithSubscriptionLink);
    incentiveRepository.stubs.updateById.resolves();
    await controllerCurrentUser.updateById('606c236a624cec2becdef276', mockIncentiveWithSubscriptionLink);

    expect(incentiveRepository.stubs.updateById.called).true();
  });

  it('patch(/v1/incentives/{incentiveId}) additionalInfos', async () => {
    repositoryTerritory.stubs.find.resolves([territoryMock]);
    eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithoutAdditionalInfos);
    incentiveRepository.stubs.updateById.resolves();
    await controllerCurrentUser.updateById('606c236a624cec2becdef276', mockIncentiveWithoutAdditionalInfos);

    expect(incentiveRepository.stubs.updateById.called).true();
  });
  it('patch(/v1/incentives/{incentiveId}) removeFunderId', async () => {
    repositoryTerritory.stubs.find.resolves([territoryMock]);
    eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithoutFunderId);
    incentiveRepository.stubs.updateById.resolves();
    await controllerCurrentUser.updateById('606c236a624cec2becdef276', mockIncentiveWithFunderId);

    expect(incentiveRepository.stubs.updateById.called).true();
  });
  it('patch(/v1/incentives/{incentiveId}) validityDate', async () => {
    repositoryTerritory.stubs.find.resolves([territoryMock]);
    eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithoutValidityDate);
    incentiveRepository.stubs.updateById.resolves();
    await controllerCurrentUser.updateById('606c236a624cec2becdef276', mockIncentiveWithoutValidityDate);

    expect(incentiveRepository.stubs.updateById.called).true();
  });
  it('patch(/v1/incentives/{incentiveId}) validityDuration', async () => {
    repositoryTerritory.stubs.find.resolves([territoryMock]);
    eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithoutValidityDuration);
    incentiveRepository.stubs.updateById.resolves();
    await controllerCurrentUser.updateById('606c236a624cec2becdef276', mockIncentiveWithoutValidityDuration);

    expect(incentiveRepository.stubs.updateById.called).true();
  });
  it('patch(/v1/incentives/{incentiveId}) contact', async () => {
    repositoryTerritory.stubs.find.resolves([territoryMock]);
    eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithoutContact);
    incentiveRepository.stubs.updateById.resolves();
    await controllerCurrentUser.updateById('606c236a624cec2becdef276', mockIncentiveWithoutContact);

    expect(incentiveRepository.stubs.updateById.called).true();
  });

  it('patch(/v1/incentives/{incentiveId}) specific fields', async () => {
    repositoryTerritory.stubs.find.resolves([territoryMock]);
    eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithSpecificFields);
    repositoryTerritory.stubs.find.resolves([territoryMock]);
    incentiveRepository.stubs.updateById.resolves();
    await controllerCurrentUser.updateById('606c236a624cec2becdef276', mockIncentiveWithSpecificFields);

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
        eligibilityChecks: [new EligibilityCheck({id: 'uuid-fc', value: [], active: true})],
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

      eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
      incentiveRepository.stubs.findById.resolves(currentIncentive);
      repositoryTerritory.stubs.find.resolves([territoryMock]);
      incentiveRepository.stubs.updateById.resolves();
      incentiveRepository.stubs.find.resolves([excludedIncentive1, excludedIncentive2, excludedIncentive3]);
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

      sinon.assert.calledWith(incentiveRepository.stubs.updateById, excludedIncentive1.id);
      sinon.assert.calledWith(incentiveRepository.stubs.updateById, excludedIncentive2.id);
      sinon.assert.calledWith(incentiveRepository.stubs.updateById, excludedIncentive3.id);
      sinon.assert.calledWith(
        incentiveRepository.stubs.updateById,
        currentIncentive.id,
        sinon.match.has('eligibilityChecks', updatedIncentive.eligibilityChecks),
      );
      sinon.assert.calledWith(incentiveRepository.stubs.updateById, currentIncentive.id, updatedIncentive);
      expect(updatedIncentive.eligibilityChecks![1].value.includes(excludedIncentive1.id)).to.be.true;
      expect(updatedIncentive.eligibilityChecks![1].value.includes(excludedIncentive2.id)).to.be.true;
      expect(updatedIncentive.eligibilityChecks![1].value.includes(excludedIncentive3.id)).to.be.true;
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
            value: ['test', excludedIncentive1.id, excludedIncentive2.id, excludedIncentive3.id],
            active: true,
          }),
        ],
      });

      eligibilityChecksRepository.stubs.findOne.resolves(mockIncentiveEligibilityCheck[1]);
      incentiveRepository.stubs.findById.resolves(currentIncentive);
      repositoryTerritory.stubs.find.resolves([territoryMock]);
      incentiveRepository.stubs.updateById.resolves();
      incentiveRepository.stubs.find.resolves([excludedIncentive1, excludedIncentive2, excludedIncentive3]);
      const excludedIncentive1NoEC = JSON.parse(JSON.stringify(excludedIncentive1));
      delete excludedIncentive1NoEC.eligibilityChecks;
      incentiveService.stubs.getIncentiveIdsToAdd.returns([]);
      incentiveService.stubs.getIncentiveIdsToDelete.returns([
        excludedIncentive1.id,
        excludedIncentive2.id,
        excludedIncentive3.id,
      ]);
      incentiveService.stubs.removeIncentiveFromExclusions.onFirstCall().returns(excludedIncentive1NoEC);
      incentiveService.stubs.removeIncentiveFromExclusions.onSecondCall().returns(excludedIncentive2);
      incentiveService.stubs.removeIncentiveFromExclusions.onThirdCall().returns(excludedIncentive3);
      await controllerCurrentUser.updateById(updatedIncentive.id, updatedIncentive);

      sinon.assert.calledWith(incentiveRepository.stubs.updateById, excludedIncentive1.id, {
        $unset: {eligibilityChecks: []},
      } as any);
      sinon.assert.calledWith(incentiveRepository.stubs.updateById, excludedIncentive2.id, {
        eligibilityChecks: excludedIncentive2.eligibilityChecks,
      });
      sinon.assert.calledWith(incentiveRepository.stubs.updateById, excludedIncentive3.id, {
        eligibilityChecks: excludedIncentive3.eligibilityChecks,
      });
      sinon.assert.calledWith(incentiveRepository.stubs.updateById, currentIncentive.id, updatedIncentive);
      expect(updatedIncentive.eligibilityChecks![1].value.includes(excludedIncentive1.id)).to.be.false;
      expect(updatedIncentive.eligibilityChecks![1].value.includes(excludedIncentive2.id)).to.be.false;
      expect(updatedIncentive.eligibilityChecks![1].value.includes(excludedIncentive3.id)).to.be.false;
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('del(/v1/incentives/{incentiveId})', async () => {
    incentiveRepository.stubs.deleteById.resolves();

    const incentiveList = await controllerCurrentUser.deleteById('606c236a624cec2becdef276');

    expect(incentiveList).to.deepEqual(undefined);
  });

  function givenStubbedRepository() {
    incentiveRepository = createStubInstance(IncentiveRepository);
    funderRepository = createStubInstance(FunderRepository);
    repositoryTerritory = createStubInstance(TerritoryRepository);
    eligibilityChecksRepository = createStubInstance(IncentiveEligibilityChecksRepository);
    affiliationRepository = createStubInstance(AffiliationRepository);
  }

  function givenStubbedService() {
    citizenService = createStubInstance(CitizenService);
    incentiveService = createStubInstance(IncentiveService);
    territoryService = createStubInstance(TerritoryService);
    geoApiGouvService = createStubInstance(GeoApiGouvService);
  }
});

const mockIncentiveEligibilityCheck = [
  new IncentiveEligibilityChecks({
    id: 'uuid-fc',
    label: ELIGIBILITY_CHECKS_LABEL.FRANCE_CONNECT,
    name: 'Identité FranceConnect',
    description: "Les données d'identité doivent être fournies/certifiées par FranceConnect",
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
  territoryIds: ['test'],
  additionalInfos: 'test',
  funderId: 'randomFunderId',
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
  funderName: '',
});

const mockCollectivityIncentiveWithEligibilityCheck = new Incentive({
  territoryIds: ['test'],
  additionalInfos: 'test',
  funderId: 'randomFunderId',
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

const mockCreateNationalIncentive = new Incentive({
  territoryIds: ['test'],
  additionalInfos: 'test',
  funderId: 'randomInputIdNational',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: INCENTIVE_TYPE.NATIONAL_INCENTIVE,
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
  territoryIds: ['test'],
  additionalInfos: 'test',
  funderId: 'randomInputIdCollectivity',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
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

const mockEnterpriseIncentive = new Incentive({
  territoryIds: ['test'],
  additionalInfos: 'test',
  funderId: 'randomInputIdEnterprise',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
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
  territoryIds: ['test'],
  additionalInfos: 'test',
  funderId: 'randomInputIdEnterprise',
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

const mockCreateIncentiveWithSpecificFields = new Incentive({
  territoryIds: ['test'],
  additionalInfos: 'test',
  funderId: 'randomInputIdCollectivity',
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
  territoryIds: ['test'],
  additionalInfos: 'test',
  funderId: 'randomInputIdCollectivity',
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
  territoryIds: ['test'],
  additionalInfos: 'test',
  funderId: 'randomInputIdCollectivity',
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
  funderId: 'randomInputIdCollectivity',
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
  additionalInfos: 'test',
  funderId: 'randomInputIdCollectivity',
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
  funderId: 'randomInputIdCollectivity',
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
  funderId: 'randomInputIdCollectivity',
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
  funderId: 'randomInputIdCollectivity',
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
  funderId: 'randomInputIdCollectivity',
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

const mockNational: Funder = new NationalAdministration({
  id: 'randomInputIdNational',
  name: 'nameNational',
}) as Funder;

const mockCollectivity = new Collectivity({
  id: 'randomInputIdCollectivity',
  name: 'nameCollectivity',
  citizensCount: 10,
  mobilityBudget: 12,
});

const mockEnterprise = new Enterprise({
  id: 'randomInputIdEnterprise',
  name: 'nameEnterprise',
  siretNumber: 50,
  citizensCount: 2345,
  mobilityBudget: 102,
  enterpriseDetails: new EnterpriseDetails({
    emailDomainNames: ['test@outlook.com', 'test@outlook.fr', 'test@outlook.xxx'],
  }),
});

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
  roles: ['offline_access', 'citoyens', 'uma_authorization', 'maas', 'service_maas'],
  [securityId]: 'citizenId',
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

const mockIncentive = new Incentive({
  territoryIds: ['test'],
  additionalInfos: 'test',
  funderId: 'randomFunderId',
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
  territoryIds: [],
});

const territoryMock = new Territory({
  name: 'Toulouse',
  id: 'test',
});

const expectedLookup = {
  from: 'Territory',
  localField: 'territoryIds',
  foreignField: '_id',
  as: 'territoryLookup',
};
const expectedUnset = ['_id', 'territoryLookup'];

const expectedProject = {
  result: {
    $concatArrays: ['$filterIncentiveByMatch', '$filterIncentiveByNotMatch'],
  },
};

const expectedSort = {
  'territoryLookup.scaleWeight': -1,
  funderName: 1,
};

const incentiveMockEmployee: Partial<Incentive> = {
  title: 'Lorem ipsum dolor sit amet.',
  description: 'Lorem ipsum dolor sit amet.',
  funderName: 'funderName',
  funderId: 'funderId',
  incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
  conditions: 'Lorem ipsum dolor sit amet.',
  paymentMethod: 'Lorem ipsum dolor sit amet.',
  allocatedAmount: 'Lorem ipsum dolor sit amet.',
  minAmount: 'Lorem ipsum dolor sit amet.',
  transportList: ['voiture'],
  isMCMStaff: true,
  isCertifiedTimestampRequired: true,
  subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.MANUAL,
  isCitizenNotificationsDisabled: false,
  territoryIds: ['territoryId1'],
};

const incentiveMockTerritory: Partial<Incentive> = {
  additionalInfos: 'Lorem ipsum dolor sit amet.',
  allocatedAmount: 'Lorem ipsum dolor sit amet.',
  attachments: ['attestationHonneur'],
  conditions: 'Lorem ipsum dolor sit amet.',
  description: 'Lorem ipsum dolor sit amet.',
  funderId: 'funderId2',
  funderName: 'funderName',
  incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
  isCertifiedTimestampRequired: false,
  isCitizenNotificationsDisabled: false,
  isMCMStaff: true,
  minAmount: 'Lorem ipsum dolor sit amet.',
  paymentMethod: 'Lorem ipsum dolor sit amet.',
  specificFields: [
    {
      title: 'Date de début',
      inputFormat: 'Date',
      isRequired: true,
    },
  ],
  subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.MANUAL,
  title: 'Lorem ipsum dolor sit amet.',
  transportList: ['velo'],
  territoryIds: ['territoryId1'],
};

const incentiveMockNational: Partial<Incentive> = {
  title: 'Lorem ipsum dolor sit amet.',
  description: 'Lorem ipsum dolor sit amet.',
  funderName: 'funderName',
  funderId: 'funderId3',
  incentiveType: INCENTIVE_TYPE.NATIONAL_INCENTIVE,
  conditions: 'Lorem ipsum dolor sit amet.',
  paymentMethod: 'Lorem ipsum dolor sit amet.',
  allocatedAmount: 'Lorem ipsum dolor sit amet.',
  minAmount: 'Lorem ipsum dolor sit amet.',
  transportList: ['voiture'],
  isMCMStaff: true,
  isCertifiedTimestampRequired: false,
  subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.AUTOMATIC,
  isCitizenNotificationsDisabled: false,
  eligibilityChecks: [
    {
      id: 'id1',
      value: [],
      active: true,
    },
    {
      id: 'id2',
      value: ['valueId'],
      active: false,
    },
    {
      id: 'id3',
      value: [],
      active: false,
    },
  ] as EligibilityCheck[],
  territoryIds: ['territoryId1'],
};

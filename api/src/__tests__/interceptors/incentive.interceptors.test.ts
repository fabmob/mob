import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {IncentiveInterceptor} from '../../interceptors';
import {EligibilityCheck, Funder, Incentive, IncentiveEligibilityChecks} from '../../models';
import {
  IncentiveRepository,
  IncentiveEligibilityChecksRepository,
  FunderRepository,
} from '../../repositories';
import {
  ELIGIBILITY_CHECKS_LABEL,
  FUNDER_TYPE,
  INCENTIVE_TYPE,
  IUser,
  StatusCode,
  SUBSCRIPTION_CHECK_MODE,
} from '../../utils';
import {LIMIT_MAX} from '../../constants';

describe('IncentiveInterceptor', () => {
  let interceptor: any = null;

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

  const mockEligibilityCheck = [
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
  ];

  const invocationContextCreates = {
    target: {},
    methodName: 'create',
    args: [
      {
        title: 'incentives to test',
        description: 'incentive to test in unit test',
        territoryIds: ['randomTerritoryId'],
        funderName: 'idf',
        funderId: 'funderId',
        incentiveType: 'AideTerritoire',
        conditions: '',
        paymentMethod: 'cb',
        allocatedAmount: '1231',
        minAmount: '15',
        transportList: ['velo'],
        additionalInfos: '',
        contact: '',
        validityDate: '2010-06-08',
        isMCMStaff: true,
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationCtxDeleteById = {
    target: {},
    methodName: 'deleteById',
    args: ['azezaeaz'],
  };

  const invocationContextCreatesMCMStaffCases = {
    target: {},
    methodName: 'create',
    args: [
      {
        id: '',
        title: 'incentives to test',
        description: 'incentive to test in unit test',
        territoryIds: ['randomTerritoryId'],
        funderName: 'idf',
        funderId: 'funderId',
        incentiveType: 'AideTerritoire',
        conditions: '',
        paymentMethod: 'cb',
        allocatedAmount: '1231',
        minAmount: '15',
        transportList: ['velo'],
        additionalInfos: '',
        contact: '',
        validityDate: '3000-06-08',
        isMCMStaff: true,
        subscriptionLink: 'https://subscriptionLink.com',
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationCtxCreateMCMStaffSubLink = {
    target: {},
    methodName: 'create',
    args: [
      {
        title: 'incentives to test',
        description: 'incentive to test in unit test',
        territoryIds: ['randomTerritoryId'],
        funderName: 'idf',
        funderId: 'funderId',
        incentiveType: 'AideTerritoire',
        conditions: '',
        paymentMethod: 'cb',
        allocatedAmount: '1231',
        minAmount: '15',
        transportList: ['velo'],
        additionalInfos: '',
        contact: '',
        validityDate: '3000-06-08',
        isMCMStaff: true,
        subscriptionLink: 'https://subscriptionLink.com',
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationContextCreate = {
    target: {},
    methodName: 'create',
    args: [
      {
        title: 'incentives to test',
        description: 'incentive to test in unit test',
        territoryIds: ['randomTerritoryId'],
        funderName: 'idf',
        funderId: 'funderId',
        incentiveType: 'AideTerritoire',
        conditions: '',
        paymentMethod: 'cb',
        allocatedAmount: '1231',
        minAmount: '15',
        transportList: ['velo'],
        additionalInfos: '',
        contact: '',
        validityDate: '3000-06-08',
        isMCMStaff: true,
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationCtxCreateEligibilityCheck = {
    target: {},
    methodName: 'create',
    args: [
      {
        title: 'incentives to test',
        description: 'incentive to test in unit test',
        territoryIds: ['randomTerritoryId'],
        funderName: 'idf',
        funderId: 'funderId',
        incentiveType: 'AideTerritoire',
        conditions: '',
        paymentMethod: 'cb',
        allocatedAmount: '1231',
        minAmount: '15',
        transportList: ['velo'],
        additionalInfos: '',
        contact: '',
        validityDate: '3000-06-08',
        isMCMStaff: true,
        subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.AUTOMATIC,
        eligibilityChecks: mockEligibilityCheck,
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationCtxCreateTerritoryError = {
    target: {},
    methodName: 'create',
    args: [
      {
        title: 'incentive',
        description: 'incentive to test in unit test',
        territoryIds: ['randomTerritoryId', 'randomTerritoryId2'],
        funderName: 'idf',
        funderId: 'funderId',
        incentiveType: 'AideTerritoire',
        conditions: '',
        paymentMethod: 'cb',
        allocatedAmount: '1231',
        minAmount: '15',
        transportList: ['velo'],
        additionalInfos: '',
        contact: '',
        validityDate: '3000-06-08',
        isMCMStaff: true,
        subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.AUTOMATIC,
        eligibilityChecks: mockEligibilityCheck,
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationCtxCreateFunderIDMissing = {
    target: {},
    methodName: 'create',
    args: [
      {
        title: 'incentives to test',
        description: 'incentive to test in unit test',
        territoryIds: ['randomTerritoryId'],
        funderName: 'idf',
        incentiveType: 'AideNationale',
        conditions: '',
        paymentMethod: 'cb',
        allocatedAmount: '1231',
        minAmount: '15',
        transportList: ['velo'],
        additionalInfos: '',
        contact: '',
        validityDate: '3000-06-08',
        isMCMStaff: true,
        subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.AUTOMATIC,
        eligibilityChecks: [],
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationCtxCreateWrongType = {
    target: {},
    methodName: 'create',
    args: [
      {
        title: 'incentives to test',
        description: 'incentive to test in unit test',
        territoryIds: ['randomTerritoryId'],
        funderId: 'randomFunderId',
        incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
        conditions: '',
        paymentMethod: 'cb',
        allocatedAmount: '1231',
        minAmount: '15',
        transportList: ['velo'],
        additionalInfos: '',
        contact: '',
        validityDate: '3000-06-08',
        isMCMStaff: true,
        subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.AUTOMATIC,
        eligibilityChecks: [],
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationContextReplaceById = {
    target: {},
    methodName: 'replaceById',
    args: [
      'id',
      {
        title: 'incentives to test',
        description: 'incentive to test in unit test',
        territoryIds: ['randomTerritoryId'],
        funderName: 'idf',
        funderId: 'funderId',
        incentiveType: 'AideTerritoire',
        conditions: '',
        paymentMethod: 'cb',
        allocatedAmount: '1231',
        minAmount: '15',
        transportList: ['velo'],
        additionalInfos: '',
        contact: '',
        validityDate: '2010-06-08',
        isMCMStaff: true,
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationCtxUpdateFunderIdError = {
    target: {},
    methodName: 'updateById',
    args: [
      'id',
      {
        title: 'Un réseau de transport en commun régional plus performant',
        description: 'incentive to test in unit test',
        territoryIds: ['randomTerritoryId'],
        funderName: 'Mulhouse',
        funderId: 'randomInputIdCollectivity2',
        incentiveType: 'AideTerritoire',
        conditions: '',
        paymentMethod: 'cb',
        allocatedAmount: '1231',
        minAmount: '15',
        transportList: ['velo'],
        additionalInfos: '',
        contact: '',
        validityDate: '2024-06-08',
        isMCMStaff: true,
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationContextUpdateById = {
    target: {},
    methodName: 'updateById',
    args: [
      'id',
      {
        title: 'Un réseau de transport en commun régional plus performant',
        description: 'incentive to test in unit test',
        territoryIds: ['randomTerritoryId'],
        funderName: 'Mulhouse',
        funderId: 'randomInputIdCollectivity',
        incentiveType: 'AideTerritoire',
        conditions: '',
        paymentMethod: 'cb',
        allocatedAmount: '1231',
        minAmount: '15',
        transportList: ['velo'],
        additionalInfos: '',
        contact: '',
        validityDate: '2024-06-08',
        isMCMStaff: true,
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationCtxUpdateTerritoryError = {
    target: {},
    methodName: 'updateById',
    args: [
      'id',
      {
        title: 'incentive',
        description: 'incentive to test in unit test',
        territoryIds: ['randomTerritoryId', 'randomTerritoryId2'],
        funderName: 'idf',
        funderId: 'funderId',
        incentiveType: 'AideTerritoire',
        conditions: '',
        paymentMethod: 'cb',
        allocatedAmount: '1231',
        minAmount: '15',
        transportList: ['velo'],
        additionalInfos: '',
        contact: '',
        validityDate: '3000-06-08',
        isMCMStaff: true,
        subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.AUTOMATIC,
        eligibilityChecks: mockEligibilityCheck,
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationCtxFind = {
    target: {},
    methodName: 'find',
    args: [{limit: LIMIT_MAX + 30}],
  };

  const invocationCtxFindInaccessibleFields = {
    target: {},
    methodName: 'find',
    args: [
      {fields: {eligibilityChecks: true, isCertifiedTimestampRequired: true, subscriptionCheckMode: true}},
    ],
  };

  const mockCollectivity = new Funder({
    id: 'randomInputIdCollectivity',
    name: 'nameCollectivity',
    type: FUNDER_TYPE.COLLECTIVITY,
    citizensCount: 10,
    mobilityBudget: 12,
  });

  const mockTerritoryIncentive = new Incentive({
    id: '61d372bcf3a8e84cc09ace7f',
    title: 'Un réseau de transport en commun régional plus performant',
    description: 'Description dolor sit amet, consectetur adipiscing elit.',
    territoryIds: ['randomTerritoryId'],
    funderName: 'Mulhouse',
    incentiveType: 'AideTerritoire',
    conditions: "Conditions d'obtention: Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    paymentMethod: 'Modalité de versement: Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    allocatedAmount: 'Montant: Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    minAmount: 'A partir de 5€ par mois sous conditions',
    transportList: ['transportsCommun'],
    attachments: ['justificatifDomicile'],
    additionalInfos: 'Info complémentaire: Ut bibendum tincidunt turpis gravida iaculis.',
    contact: 'Contactez le numéro vert au 05 603 603',
    validityDuration: '24 mois',
    validityDate: '2024-07-31T00:00:00.000Z',
    isMCMStaff: true,
    createdAt: new Date('2022-01-03T22:03:40.565Z'),
    updatedAt: new Date('2022-01-05T09:31:10.289Z'),
    funderId: 'randomInputIdCollectivity',
  });

  let incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    eligibilityChecksRepository: StubbedInstanceWithSinonAccessor<IncentiveEligibilityChecksRepository>,
    funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>,
    currentUser: IUser;

  function givenStubbedRepository() {
    incentiveRepository = createStubInstance(IncentiveRepository);
    eligibilityChecksRepository = createStubInstance(IncentiveEligibilityChecksRepository);
    funderRepository = createStubInstance(FunderRepository);
    currentUser = {
      clientName: 'maas-client',
      emailVerified: undefined,
      funderName: undefined,
      funderType: undefined,
      groups: undefined,
      id: 'maasId',
      roles: ['default-roles-mcm', 'offline_access', 'citoyens', 'uma_authorization', 'maas'],
      [securityId]: 'maasId',
    };
  }

  beforeEach(() => {
    givenStubbedRepository();
    interceptor = new IncentiveInterceptor(
      incentiveRepository,
      eligibilityChecksRepository,
      funderRepository,
      currentUser,
    );
  });

  it('IncentiveInterceptor creates: error date', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      await interceptor.intercept(invocationContextCreates);
    } catch (err) {
      expect(err.message).to.equal('incentives.error.validityDate.minDate');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('IncentiveInterceptor creates: error minmax items territoryIds', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      await interceptor.intercept(invocationCtxCreateTerritoryError);
    } catch (err) {
      expect(err.message).to.equal('incentives.error.territoryIds.minMaxItems');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('IncentiveInterceptor creates: error MCM false no subscription', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      const invocationCtxMCMStaffFalse = invocationContextCreatesMCMStaffCases;
      invocationCtxMCMStaffFalse.args[0].isMCMStaff = false;
      delete (invocationCtxMCMStaffFalse?.args[0] as Partial<Incentive>).subscriptionLink;
      await interceptor.intercept(invocationCtxMCMStaffFalse);
    } catch (err) {
      expect(err.message).to.equal('incentives.error.isMCMStaff.specificFieldOrSubscriptionLink');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('IncentiveInterceptor creates: error MCM false specific Fields', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      const invocationCtxMCMStaffFalse = invocationContextCreatesMCMStaffCases;
      invocationCtxMCMStaffFalse.args[0].isMCMStaff = false;
      (invocationCtxMCMStaffFalse.args[0] as Partial<Incentive>).specificFields = [{} as any];
      await interceptor.intercept(invocationCtxMCMStaffFalse);
    } catch (err) {
      expect(err.message).to.equal('incentives.error.isMCMStaff.specificFieldOrSubscriptionLink');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('IncentiveInterceptor creates: error title already used for same funder', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(mockTerritoryIncentive);
      await interceptor.intercept(invocationContextCreate);
    } catch (err) {
      expect(err.message).to.equal('incentives.error.title.alreadyUsedForFunder');
      expect(err.statusCode).to.equal(StatusCode.Conflict);
    }
  });

  it('IncentiveInterceptor creates: error when isMCMStaff true and no funderId', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      funderRepository.stubs.findById.resolves(undefined);
      await interceptor.intercept(invocationCtxCreateFunderIDMissing);
    } catch (err) {
      expect(err.message).to.equal('incentives.error.funderId.notExist');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('IncentiveInterceptor creates: error wrong type', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      funderRepository.stubs.findById.resolves(new Funder({type: FUNDER_TYPE.ENTERPRISE}));
      await interceptor.intercept(invocationCtxCreateWrongType);
    } catch (err) {
      expect(err.message).to.equal('incentives.error.funder.wrongType');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('IncentiveInterceptor creates: error control not found', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      funderRepository.stubs.findById.resolves(mockCollectivity);
      eligibilityChecksRepository.stubs.find.resolves(mockIncentiveEligibilityCheck);
      const invocationCtxCreateEligibilityCheckControlNotFound = invocationCtxCreateEligibilityCheck;
      invocationCtxCreateEligibilityCheckControlNotFound.args[0].eligibilityChecks[0].id = 'wrong-id';
      await interceptor.intercept(invocationCtxCreateEligibilityCheckControlNotFound);
    } catch (err) {
      expect(err.message).to.equal('EligibilityCheck not found');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('IncentiveInterceptor creates: error exclusion list empty', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      funderRepository.stubs.findById.resolves(mockCollectivity);
      eligibilityChecksRepository.stubs.find.resolves(mockIncentiveEligibilityCheck);
      const invocationCtxCreateEligibilityCheckExclusionEmpty = invocationCtxCreateEligibilityCheck;
      invocationCtxCreateEligibilityCheckExclusionEmpty.args[0].eligibilityChecks[0].id = 'uuid-fc';
      invocationCtxCreateEligibilityCheckExclusionEmpty.args[0].eligibilityChecks[1].value = [];
      await interceptor.intercept(invocationCtxCreateEligibilityCheckExclusionEmpty);
    } catch (err) {
      expect(err.message).to.equal('incentives.error.eligibilityChecks.array.empty');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('IncentiveInterceptor creates: successful with isMCMStaff true and subscriptionLink', async () => {
    incentiveRepository.stubs.findOne.resolves(null);
    funderRepository.stubs.findById.resolves(mockCollectivity);
    const result = await interceptor.intercept(invocationCtxCreateMCMStaffSubLink, () => {});

    expect(result).to.Null;
  });

  it('IncentiveInterceptor creates: successful', async () => {
    incentiveRepository.stubs.findOne.resolves(null);
    funderRepository.stubs.findById.resolves(mockCollectivity);
    const result = await interceptor.intercept(invocationContextCreate, () => {});

    expect(result).to.Null;
  });

  it('IncentiveInterceptor ReplaceById: error date', async () => {
    try {
      await interceptor.intercept(invocationContextReplaceById);
    } catch (err) {
      expect(err.message).to.equal('incentives.error.validityDate.minDate');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('IncentiveInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });

  it('IncentiveInterceptor updateById: error title already used for same funder', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(mockTerritoryIncentive);
      await interceptor.intercept(invocationContextUpdateById);
    } catch (err) {
      expect(err.message).to.equal('incentives.error.title.alreadyUsedForFunder');
      expect(err.statusCode).to.equal(StatusCode.Conflict);
    }
  });

  it('IncentiveInterceptor updateById: error minmax items territoryIds', async () => {
    try {
      incentiveRepository.stubs.findOne.onCall(0).resolves(mockTerritoryIncentive);
      incentiveRepository.stubs.findOne.onCall(1).resolves(null);
      await interceptor.intercept(invocationCtxUpdateTerritoryError);
    } catch (err) {
      expect(err.message).to.equal('incentives.error.territoryIds.minMaxItems');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('IncentiveInterceptor updateById: error incentive not found', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      await interceptor.intercept(invocationContextUpdateById);
    } catch (err) {
      expect(err.message).to.equal('Incentive not found');
      expect(err.statusCode).to.equal(StatusCode.NotFound);
    }
  });

  it('IncentiveInterceptor updateById: error cant update funderId', async () => {
    try {
      incentiveRepository.stubs.findOne.onCall(0).resolves(mockTerritoryIncentive);
      incentiveRepository.stubs.findOne.onCall(1).resolves(null);
      await interceptor.intercept(invocationCtxUpdateFunderIdError);
      funderRepository.stubs.findById.resolves(mockCollectivity);
    } catch (err) {
      expect(err.message).to.equal('incentives.error.cantUpdate.funderId');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('IncentiveInterceptor updateById: successful', async () => {
    incentiveRepository.stubs.findOne.onCall(0).resolves(mockTerritoryIncentive);
    incentiveRepository.stubs.findOne.onCall(1).resolves(null);
    funderRepository.stubs.findById.resolves(mockCollectivity);
    expect(await interceptor.intercept(invocationContextUpdateById, () => {})).not.to.throwError();
  });

  it('IncentiveInterceptor deleteById: incentive not found', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationCtxDeleteById, () => {});
    } catch (err) {
      expect(err.message).to.equal('Incentive not found');
      expect(err.statusCode).to.equal(StatusCode.NotFound);
    }
    incentiveRepository.stubs.findOne.restore();
  });

  it('IncentiveInterceptor find: limit is more than limitMax', async () => {
    try {
      await interceptor.intercept(invocationCtxFind, () => {});
    } catch (err) {
      expect(err.message).to.equal('limit.error.max');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('IncentiveInterceptor find: Only inaccessible Fields are requested', async () => {
    try {
      await interceptor.intercept(invocationCtxFindInaccessibleFields, () => {});
    } catch (err) {
      expect(err.message).to.equal('find.error.requested.fields');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });
});

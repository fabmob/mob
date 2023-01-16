import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import {IncentiveInterceptor} from '../../interceptors';
import {
  Collectivity,
  EligibilityCheck,
  Incentive,
  IncentiveEligibilityChecks,
  Territory,
} from '../../models';
import {
  IncentiveRepository,
  IncentiveEligibilityChecksRepository,
  CollectivityRepository,
  EnterpriseRepository,
} from '../../repositories';
import {
  ELIGIBILITY_CHECKS_LABEL,
  ResourceName,
  StatusCode,
  SUBSCRIPTION_CHECK_MODE,
} from '../../utils';
import {ValidationError} from '../../validationError';

describe('IncentiveInterceptor', () => {
  let interceptor: any = null;

  const errorMinDate: any = new ValidationError(
    `incentives.error.validityDate.minDate`,
    '/validityDate',
  );

  const errorIsMCMStaffSpecificFields: any = new ValidationError(
    `incentives.error.isMCMStaff.specificFieldOrSubscriptionLink`,
    '/isMCMStaff',
  );

  const errorTitleAlreadyUsedForFunder: any = new ValidationError(
    `incentives.error.title.alreadyUsedForFunder`,
    '/incentiveTitleAlreadyUsed',
  );

  const errorNotFound = new ValidationError(
    `Incentive not found`,
    '/incentiveNotFound',
    StatusCode.NotFound,
    ResourceName.Incentive,
  );

  const errorFunderIdMissing = new ValidationError(
    `incentives.error.isMCMStaff.funderIdMissing`,
    '/isMCMStaff',
    StatusCode.NotFound,
    ResourceName.Funder,
  );

  const errorControlNotFound = new ValidationError(
    `EligibilityCheck wrong-id not found`,
    '/eligibilityChecks',
    StatusCode.NotFound,
    ResourceName.Incentive,
  );

  const errorExclusionListEmpty = new ValidationError(
    `incentives.error.eligibilityChecks.array.empty`,
    '/eligibilityChecks',
    StatusCode.PreconditionFailed,
    ResourceName.Incentive,
  );

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
      description:
        "1 souscription valide pour un ensemble d'aides mutuellement exclusives",
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
        territory: {name: 'IDF', id: 'randomTerritoryId'} as Territory,
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
        territory: {name: 'IDF', id: 'randomTerritoryId'} as Territory,
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
        territory: {name: 'IDF', id: 'randomTerritoryId'} as Territory,
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
        territory: {name: 'IDF', id: 'randomTerritoryId'} as Territory,
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

  const invocationCtxCreateCheckModeAutoNoControl = {
    target: {},
    methodName: 'create',
    args: [
      {
        title: 'incentives to test',
        description: 'incentive to test in unit test',
        territory: {name: 'IDF', id: 'randomTerritoryId'} as Territory,
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
        eligibilityChecks: [],
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
        territory: {name: 'IDF', id: 'randomTerritoryId'} as Territory,
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
        territory: {name: 'IDF', id: 'randomTerritoryId'} as Territory,
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

  const invocationContextReplaceById = {
    target: {},
    methodName: 'replaceById',
    args: [
      'id',
      {
        title: 'incentives to test',
        description: 'incentive to test in unit test',
        territory: {name: 'IDF', id: 'randomTerritoryId'} as Territory,
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

  const invocationContextUpdateById = {
    target: {},
    methodName: 'updateById',
    args: [
      'id',
      {
        title: 'Un réseau de transport en commun régional plus performant',
        description: 'incentive to test in unit test',
        territory: {name: 'IDF', id: 'randomTerritoryId'} as Territory,
        funderName: 'Mulhouse',
        funderId: 'funderId',
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

  const mockCollectivity = new Collectivity({
    id: 'randomInputIdCollectivity',
    name: 'nameCollectivity',
    citizensCount: 10,
    mobilityBudget: 12,
  });

  const mockTerritoryIncentive = new Incentive({
    id: '61d372bcf3a8e84cc09ace7f',
    title: 'Un réseau de transport en commun régional plus performant',
    description: 'Description dolor sit amet, consectetur adipiscing elit.',
    territory: {name: 'IDF', id: 'randomTerritoryId'} as Territory,
    funderName: 'Mulhouse',
    incentiveType: 'AideTerritoire',
    conditions:
      "Conditions d'obtention: Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    paymentMethod:
      'Modalité de versement: Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
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
    funderId: '0d606650-4689-4438-9911-72bbd069cd2b',
  });

  let incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    eligibilityChecksRepository: StubbedInstanceWithSinonAccessor<IncentiveEligibilityChecksRepository>,
    collectivityRepository: StubbedInstanceWithSinonAccessor<CollectivityRepository>,
    enterpriseRepository: StubbedInstanceWithSinonAccessor<EnterpriseRepository>;

  function givenStubbedRepository() {
    incentiveRepository = createStubInstance(IncentiveRepository);
    eligibilityChecksRepository = createStubInstance(
      IncentiveEligibilityChecksRepository,
    );
    collectivityRepository = createStubInstance(CollectivityRepository);
    enterpriseRepository = createStubInstance(EnterpriseRepository);
  }

  beforeEach(() => {
    givenStubbedRepository();
    interceptor = new IncentiveInterceptor(
      incentiveRepository,
      eligibilityChecksRepository,
      collectivityRepository,
      enterpriseRepository,
    );
  });

  it('IncentiveInterceptor creates: error date', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      await interceptor.intercept(invocationContextCreates);
    } catch (err) {
      expect(err.message).to.equal(errorMinDate.message);
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
      expect(err.message).to.equal(errorIsMCMStaffSpecificFields.message);
    }
  });

  it('IncentiveInterceptor creates: error MCM false specific Fields', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      const invocationCtxMCMStaffFalse = invocationContextCreatesMCMStaffCases;
      invocationCtxMCMStaffFalse.args[0].isMCMStaff = false;
      (invocationCtxMCMStaffFalse.args[0] as Partial<Incentive>).specificFields = [
        {} as any,
      ];
      await interceptor.intercept(invocationCtxMCMStaffFalse);
    } catch (err) {
      expect(err.message).to.equal(errorIsMCMStaffSpecificFields.message);
    }
  });

  it('IncentiveInterceptor creates: error title already used for same funder', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(mockTerritoryIncentive);
      await interceptor.intercept(invocationContextCreate);
    } catch (err) {
      expect(err.message).to.equal(errorTitleAlreadyUsedForFunder.message);
    }
  });

  it('IncentiveInterceptor creates: error when isMCMStaff true and no funderId', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      collectivityRepository.stubs.findOne.resolves(null);
      enterpriseRepository.stubs.findOne.resolves(null);
      await interceptor.intercept(invocationCtxCreateFunderIDMissing);
    } catch (err) {
      expect(err.message).to.equal(errorFunderIdMissing.message);
    }
  });

  it('IncentiveInterceptor creates: error control not found', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      collectivityRepository.stubs.findOne.resolves(mockCollectivity);
      enterpriseRepository.stubs.findOne.resolves(null);
      eligibilityChecksRepository.stubs.find.resolves(mockIncentiveEligibilityCheck);
      const invocationCtxCreateEligibilityCheckControlNotFound =
        invocationCtxCreateEligibilityCheck;
      invocationCtxCreateEligibilityCheckControlNotFound.args[0].eligibilityChecks[0].id =
        'wrong-id';
      await interceptor.intercept(invocationCtxCreateEligibilityCheckControlNotFound);
    } catch (err) {
      expect(err.message).to.equal(errorControlNotFound.message);
    }
  });

  it('IncentiveInterceptor creates: error exclusion list empty', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      collectivityRepository.stubs.findOne.resolves(mockCollectivity);
      enterpriseRepository.stubs.findOne.resolves(null);
      eligibilityChecksRepository.stubs.find.resolves(mockIncentiveEligibilityCheck);
      const invocationCtxCreateEligibilityCheckExclusionEmpty =
        invocationCtxCreateEligibilityCheck;
      invocationCtxCreateEligibilityCheckExclusionEmpty.args[0].eligibilityChecks[0].id =
        'uuid-fc';
      invocationCtxCreateEligibilityCheckExclusionEmpty.args[0].eligibilityChecks[1].value =
        [];
      await interceptor.intercept(invocationCtxCreateEligibilityCheckExclusionEmpty);
    } catch (err) {
      expect(err.message).to.equal(errorExclusionListEmpty.message);
    }
  });

  it('IncentiveInterceptor creates: successful with isMCMStaff true and subscriptionLink', async () => {
    incentiveRepository.stubs.findOne.resolves(null);
    collectivityRepository.stubs.findOne.resolves(mockCollectivity);
    enterpriseRepository.stubs.findOne.resolves(null);
    const result = await interceptor.intercept(
      invocationCtxCreateMCMStaffSubLink,
      () => {},
    );

    expect(result).to.Null;
  });

  it('IncentiveInterceptor creates: successful', async () => {
    incentiveRepository.stubs.findOne.resolves(null);
    collectivityRepository.stubs.findOne.resolves(mockCollectivity);
    enterpriseRepository.stubs.findOne.resolves(null);
    const result = await interceptor.intercept(invocationContextCreate, () => {});

    expect(result).to.Null;
  });

  it('IncentiveInterceptor ReplaceById: error date', async () => {
    try {
      await interceptor.intercept(invocationContextReplaceById);
    } catch (err) {
      expect(err.message).to.equal(errorMinDate.message);
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
      expect(err.message).to.equal(errorTitleAlreadyUsedForFunder.message);
    }
  });

  it('IncentiveInterceptor updateById: error incentive not found', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      await interceptor.intercept(invocationContextUpdateById);
    } catch (err) {
      expect(err.message).to.equal(errorNotFound.message);
    }
  });

  it('IncentiveInterceptor updateById: successful', async () => {
    incentiveRepository.stubs.findOne.onCall(0).resolves(mockTerritoryIncentive);
    incentiveRepository.stubs.findOne.onCall(1).resolves(null);
    collectivityRepository.stubs.findOne.resolves(mockCollectivity);
    enterpriseRepository.stubs.findOne.resolves(null);
    expect(
      await interceptor.intercept(invocationContextUpdateById, () => {}),
    ).not.to.throwError();
  });

  it('IncentiveInterceptor deleteById: incentive not found', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationCtxDeleteById, () => {});
    } catch (err) {
      expect(err).to.deepEqual(errorNotFound);
    }
    incentiveRepository.stubs.findOne.restore();
  });
});

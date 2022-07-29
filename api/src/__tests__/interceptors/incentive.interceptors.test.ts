import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import {IncentiveInterceptor} from '../../interceptors';
import {Incentive} from '../../models';
import {IncentiveRepository} from '../../repositories';
import {ResourceName, StatusCode} from '../../utils';
import {ValidationError} from '../../validationError';

describe('IncentiveInterceptor', () => {
  let interceptor: any = null;

  const errorMinDate: any = new ValidationError(
    `incentives.error.validityDate.minDate`,
    '/validityDate',
  );

  const errorIsMCMStaffSubscription: any = new ValidationError(
    `incentives.error.isMCMStaff.subscriptionLink`,
    '/isMCMStaff',
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

  const invocationContextCreates = {
    target: {},
    methodName: 'create',
    args: [
      {
        title: 'incentives to test',
        description: 'incentive to test in unit test',
        territoryName: 'IDF',
        funderName: 'idf',
        incentiveType: 'AideNationale',
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
        territoryName: 'IDF',
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
        territoryName: 'IDF',
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
        territoryName: 'IDF',
        funderName: 'idf',
        incentiveType: 'AideNationale',
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
        territoryName: 'incentive disponible pour Mulhouse et son agglomération',
        funderName: 'Mulhouse',
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

  const mockTerritoryIncentive = new Incentive({
    id: '61d372bcf3a8e84cc09ace7f',
    title: 'Un réseau de transport en commun régional plus performant',
    description: 'Description dolor sit amet, consectetur adipiscing elit.',
    territoryName: 'incentive disponible pour Mulhouse et son agglomération',
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

  let incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>;

  function givenStubbedRepository() {
    incentiveRepository = createStubInstance(IncentiveRepository);
  }

  beforeEach(() => {
    givenStubbedRepository();
    interceptor = new IncentiveInterceptor(incentiveRepository);
  });

  it('IncentiveInterceptor creates: error date', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      await interceptor.intercept(invocationContextCreates);
    } catch (err) {
      expect(err.message).to.equal(errorMinDate.message);
    }
  });

  it('IncentiveInterceptor creates: error MCM true subscription', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      await interceptor.intercept(invocationContextCreatesMCMStaffCases);
    } catch (err) {
      expect(err.message).to.equal(errorIsMCMStaffSubscription.message);
    }
  });

  it('IncentiveInterceptor creates: error MCM false no subscription', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      invocationContextCreatesMCMStaffCases.args[0].isMCMStaff = false;
      delete (invocationContextCreatesMCMStaffCases.args[0] as Incentive)
        .subscriptionLink;
      await interceptor.intercept(invocationContextCreatesMCMStaffCases);
    } catch (err) {
      expect(err.message).to.equal(errorIsMCMStaffSpecificFields.message);
    }
  });

  it('IncentiveInterceptor creates: error MCM false specific Fields', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);
      (invocationContextCreatesMCMStaffCases.args[0] as Incentive).specificFields = [
        {} as any,
      ];
      await interceptor.intercept(invocationContextCreatesMCMStaffCases);
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

  it('IncentiveInterceptor creates: successful', async () => {
    incentiveRepository.stubs.findOne.resolves(null);
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

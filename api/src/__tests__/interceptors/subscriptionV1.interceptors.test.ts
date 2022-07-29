import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';

import {SubscriptionV1Interceptor} from '../../interceptors';
import {Incentive, Community} from '../../models';
import {ValidationError} from '../../validationError';
import {IncentiveRepository, CommunityRepository} from '../../repositories';

describe('SubscriptionV1 Interceptor', () => {
  let interceptor: any = null;
  let repository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>;

  beforeEach(() => {
    givenStubbedRepository();
    interceptor = new SubscriptionV1Interceptor(repository, communityRepository);
  });

  it('SubscriptionV1Interceptor creates: error format "newField1"', async () => {
    try {
      repository.stubs.findById.resolves(mockIncentive);
      await interceptor.intercept(invocationContextCreates, () => {});
    } catch (err) {
      expect(err.message).to.equal(errorFormat.message);
    }
    repository.stubs.findById.restore();
  });

  it('SubscriptionV1Interceptor creates: error with funderId without communities', async () => {
    try {
      repository.stubs.findById.resolves(mockIncentiveFunderId);
      communityRepository.stubs.findByFunderId.resolves([
        new Community({id: 'community1'}),
      ]);

      await interceptor.intercept(invocationContextCreatesuccessful, () => {});
    } catch (err) {
      expect(err.message).to.equal('subscriptions.error.communities.mismatch');
    }
    repository.stubs.findById.restore();
    communityRepository.stubs.findByFunderId.restore();
  });

  // eslint-disable-next-line
  it('SubscriptionV1Interceptor creates: error with funderId without communities and not mcmstaff', async () => {
    try {
      repository.stubs.findById.resolves(new Incentive({isMCMStaff: false}));

      await interceptor.intercept(invocationContextCreatesuccessful, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
    }
    repository.stubs.findById.restore();
  });

  it('SubscriptionV1Interceptor creates: successful with specificFields', async () => {
    repository.stubs.findById.resolves(mockIncentive);
    const result = await interceptor.intercept(
      invocationContextCreatesuccessful,
      () => {},
    );
    expect(result).to.Null;
    repository.stubs.findById.restore();
  });

  it('SubscriptionV1Interceptor creates: successful without specificFields', async () => {
    repository.stubs.findById.resolves(mockIncentiveWithoutSpecificFields);
    const result = await interceptor.intercept(
      invocationContextCreatesuccessfulwithoutSpecFields,
      () => {},
    );
    expect(result).to.Null;
    repository.stubs.findById.restore();
  });

  it('SubscriptionV1Interceptor args', async () => {
    try {
      repository.stubs.findById.resolves(mockIncentive);
      await interceptor.intercept(invocationContextArgsMimeTypeError);
    } catch (err) {
      expect(err).to.Null;
    }
    repository.stubs.findById.restore();
  });

  it('SubscriptionV1Interceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });

  function givenStubbedRepository() {
    repository = createStubInstance(IncentiveRepository);
    communityRepository = createStubInstance(CommunityRepository);
  }
});

const errorFormat: any = new ValidationError(
  `is not of a type(s) array`,
  '/subscription',
);

const invocationContextCreates = {
  target: {},
  methodName: 'createSubscription',
  args: [
    {
      incentiveId: 'incentiveId',
      newField1: 'field1',
      newField2: 'field2',
      consent: true,
    },
  ],
};

const invocationContextCreatesuccessfulwithoutSpecFields = {
  target: {},
  methodName: 'createSubscription',
  args: [
    {
      incentiveId: 'incentiveId',
      consent: true,
    },
  ],
};

const mockIncentive = new Incentive({
  territoryName: 'Toulouse',
  additionalInfos: 'test',
  funderName: 'Mairie',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'incentiveTitle',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: 'incentiveId',
  conditions: 'Vivre à Toulouse',
  specificFields: [
    {
      title: 'newField1',
      inputFormat: 'listeChoix',
      choiceList: {
        possibleChoicesNumber: 2,
        inputChoiceList: [
          {
            inputChoice: 'newField1',
          },
          {
            inputChoice: 'newField11',
          },
        ],
      },
    },
    {
      title: 'newField2',
      inputFormat: 'Texte',
    },
  ],
  jsonSchema: {
    properties: {
      newField1: {
        type: 'array',
        maxItems: 2,
        items: [
          {
            enum: ['newField1', 'newField11'],
          },
        ],
      },
      newField2: {
        type: 'string',
        minLength: 1,
      },
    },
    title: 'test',
    type: 'object',
    required: ['newField1', 'newField2'],
    additionalProperties: false,
  },
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
});

const mockIncentiveFunderId = new Incentive({
  territoryName: 'Toulouse',
  additionalInfos: 'test',
  funderName: 'Mairie',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'incentiveTitle',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: 'incentiveId',
  conditions: 'Vivre à Toulouse',
  funderId: 'testFunderId',
  specificFields: [
    {
      title: 'newField1',
      inputFormat: 'listeChoix',
      choiceList: {
        possibleChoicesNumber: 2,
        inputChoiceList: [
          {
            inputChoice: 'newField1',
          },
          {
            inputChoice: 'newField11',
          },
        ],
      },
    },
    {
      title: 'newField2',
      inputFormat: 'Texte',
    },
  ],
  jsonSchema: {
    properties: {
      newField1: {
        type: 'array',
        maxItems: 2,
        items: [
          {
            enum: ['newField1', 'newField11'],
          },
        ],
      },
      newField2: {
        type: 'string',
        minLength: 1,
      },
    },
    title: 'test',
    type: 'object',
    required: ['newField1', 'newField2'],
    additionalProperties: false,
  },
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
});

const mockIncentiveWithoutSpecificFields = new Incentive({
  territoryName: 'Toulouse',
  additionalInfos: 'test',
  funderName: 'Mairie',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'incentiveTitle',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: 'incentiveId',
  conditions: 'Vivre à Toulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
});

const invocationContextArgsMimeTypeError = {
  target: {},
  methodName: 'createSubscription',
  args: [
    {
      incentiveId: 'incentiveId',
      newField1: ['newField1'],
      newField2: 'field2',
      consent: true,
    },
    {
      files: [],
    },
  ],
};

const invocationContextCreatesuccessful = {
  target: {},
  methodName: 'createSubscription',
  args: [
    {
      incentiveId: 'incentiveId',
      newField1: ['newField1'],
      newField2: 'field2',
    },
  ],
};

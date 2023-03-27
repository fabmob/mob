import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';

import {SubscriptionV1Interceptor} from '../../interceptors';
import {Incentive, Community} from '../../models';
import {IncentiveRepository, CommunityRepository} from '../../repositories';
import {StatusCode} from '../../utils';

// TODO REMOVE BECAUSE endpoint v1/maas/subscriptions/{subscriptionId} is deprecated
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
      expect(err.message).to.equal('is not of a type(s) array');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
    repository.stubs.findById.restore();
  });

  it('SubscriptionV1Interceptor creates: error with funderId without communities', async () => {
    try {
      repository.stubs.findById.resolves(mockIncentiveFunderId);
      communityRepository.stubs.findByFunderId.resolves([new Community({id: 'community1'})]);

      await interceptor.intercept(invocationContextCreatesuccessful, () => {});
    } catch (err) {
      expect(err.message).to.equal('subscription.error.communities.notValid');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
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
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
    repository.stubs.findById.restore();
  });

  it('SubscriptionV1Interceptor creates: successful with specificFields', async () => {
    repository.stubs.findById.resolves(mockIncentive);
    const result = await interceptor.intercept(invocationContextCreatesuccessful, () => {});
    expect(result).to.Null;
    repository.stubs.findById.restore();
  });

  it('SubscriptionV1Interceptor creates: successful without specificFields', async () => {
    repository.stubs.findById.resolves(mockIncentiveWithoutSpecificFields);
    const result = await interceptor.intercept(invocationContextCreatesuccessfulwithoutSpecFields, () => {});
    expect(result).to.Null;
    repository.stubs.findById.restore();
  });

  it('SubscriptionV1Interceptor create: successful with optional spec', async () => {
    repository.stubs.findById.resolves(mockIncentiveWithOptionalSpecField);
    const result = await interceptor.intercept(invocationContextCreates2, () => {});
    expect(result).to.Null;
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

const invocationContextCreates = {
  target: {},
  methodName: 'createMaasSubscription',
  args: [
    {
      incentiveId: 'incentiveId',
      newField1: 'field1',
      newField2: 'field2',
      consent: true,
    },
  ],
};

const invocationContextCreates2 = {
  target: {},
  methodName: 'createMaasSubscription',
  args: [
    {
      incentiveId: 'incentiveId2',
      newField1: ['newField1'],
      newField2: 'field2',
      newField3: null,
      newField4: undefined,
      consent: true,
    },
  ],
};

const invocationContextCreatesuccessfulwithoutSpecFields = {
  target: {},
  methodName: 'createMaasSubscription',
  args: [
    {
      incentiveId: 'incentiveId',
      consent: true,
    },
  ],
};

const mockIncentive = new Incentive({
  territoryIds: ['randomTerritoryId'],
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
      isRequired: true,
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
      isRequired: true,
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

const mockIncentiveWithOptionalSpecField = new Incentive({
  territoryIds: ['randomTerritoryId'],
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
      isRequired: false,
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
      isRequired: false,
    },
    {
      title: 'newField3',
      inputFormat: 'Numerique',
      isRequired: false,
    },
    {
      title: 'newField4',
      inputFormat: 'Date',
      isRequired: false,
    },
  ],
  jsonSchema: {
    properties: {
      newField1: {
        type: 'array',
        minItems: 1,
        maxItems: 2,
        items: [
          {
            enum: ['newField1', 'newField11'],
          },
        ],
      },
      newField2: {
        type: ['string', 'null'],
      },
      newField3: {
        type: ['number', 'null'],
      },
      newField4: {
        oneOf: [
          {
            type: 'string',
            format: 'date',
          },
          {
            type: 'null',
          },
        ],
      },
    },
    title: 'test',
    type: 'object',
    required: ['newField1'],
    additionalProperties: false,
  },
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
});

const mockIncentiveFunderId = new Incentive({
  territoryIds: ['randomTerritoryId'],
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
      isRequired: true,
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
      isRequired: true,
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
  territoryIds: ['randomTerritoryId'],
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

const invocationContextCreatesuccessful = {
  target: {},
  methodName: 'createMaasSubscription',
  args: [
    {
      incentiveId: 'incentiveId',
      newField1: ['newField1'],
      newField2: 'field2',
    },
  ],
};

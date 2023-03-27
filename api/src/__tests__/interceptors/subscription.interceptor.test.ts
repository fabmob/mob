import {expect, StubbedInstanceWithSinonAccessor, createStubInstance, sinon} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {SubscriptionInterceptor} from '../../interceptors';
import {
  CommunityRepository,
  IncentiveRepository,
  SubscriptionRepository,
  UserRepository,
} from '../../repositories';
import {User, Subscription, Incentive, Community} from '../../models';
import {IUser, StatusCode, SUBSCRIPTION_STATUS} from '../../utils';

describe('SubscriptionInterceptor', () => {
  let interceptor: any = null;

  let subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>,
    currentUserProfile: IUser;

  beforeEach(() => {
    givenStubbedRepository();
    interceptor = new SubscriptionInterceptor(
      userRepository,
      subscriptionRepository,
      incentiveRepository,
      communityRepository,
      currentUserProfile,
    );
  });

  it('SubscriptionInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });
  it('SubscriptionInterceptor creates: error format "newField1"', async () => {
    try {
      incentiveRepository.stubs.findById.resolves(mockIncentive);
      await interceptor.intercept(invocationContextCreates, () => {});
    } catch (err) {
      expect(err.message).to.equal('is not of a type(s) array');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
    incentiveRepository.stubs.findById.restore();
  });

  it('SubscriptionInterceptor creates: error with funderId without communities', async () => {
    try {
      incentiveRepository.stubs.findById.resolves(mockIncentiveFunderId);
      communityRepository.stubs.findByFunderId.resolves([new Community({id: 'community1'})]);

      await interceptor.intercept(invocationContextCreatesuccessful, () => {});
    } catch (err) {
      expect(err.message).to.equal('subscription.error.communities.notValid');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
    incentiveRepository.stubs.findById.restore();
    communityRepository.stubs.findByFunderId.restore();
  });

  // eslint-disable-next-line
  it('SubscriptionInterceptor creates: error with funderId without communities and not mcmstaff', async () => {
    try {
      incentiveRepository.stubs.findById.resolves(new Incentive({isMCMStaff: false}));

      await interceptor.intercept(invocationContextCreatesuccessful, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
    incentiveRepository.stubs.findById.restore();
  });

  it('SubscriptionInterceptor creates: successful with specificFields', async () => {
    incentiveRepository.stubs.findById.resolves(mockIncentive);
    const result = await interceptor.intercept(invocationContextCreatesuccessful, () => {});
    expect(result).to.Null;
    incentiveRepository.stubs.findById.restore();
  });

  it('SubscriptionInterceptor creates: successful without specificFields', async () => {
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithoutSpecificFields);
    const result = await interceptor.intercept(invocationContextCreatesuccessfulwithoutSpecFields, () => {});
    expect(result).to.Null;
    incentiveRepository.stubs.findById.restore();
  });

  it('SubscriptionInterceptor args', async () => {
    try {
      incentiveRepository.stubs.findById.resolves(mockIncentive);
      await interceptor.intercept(invocationContextArgsMimeTypeError);
    } catch (err) {
      expect(err).to.Null;
    }
    incentiveRepository.stubs.findById.restore();
  });

  it('SubscriptionInterceptor create: successful with optional spec', async () => {
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithOptionalSpecField);
    const result = await interceptor.intercept(invocationContextCreates2, () => {});
    expect(result).to.Null;
    incentiveRepository.stubs.findById.restore();
  });

  it('SubscriptionInterceptor user without community', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithoutCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextFindById, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('SubscriptionInterceptor findById : subscription not found', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithoutCom);
      subscriptionRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationContextFindById, () => {});
    } catch (err) {
      expect(err.message).to.equal('Subscription not found');
      expect(err.statusCode).to.equal(StatusCode.NotFound);
    }
  });
  it('SubscriptionInterceptor user with all perimeter', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithAllCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextFindById, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });
  it('SubscriptionInterceptor user with community, findById', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextFindById, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });
  it('SubscriptionInterceptor user with community, validate', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextValidate, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('SubscriptionInterceptor validate : subsciption not found', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationContextValidate, () => {});
    } catch (err) {
      expect(err.message).to.equal('Subscription not found');
      expect(err.statusCode).to.equal(StatusCode.NotFound);
    }
  });

  it('SubscriptionInterceptor user with community, reject', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextReject, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('SubscriptionInterceptor reject : subscription not found', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationContextReject, () => {});
    } catch (err) {
      expect(err.message).to.equal('Subscription not found');
      expect(err.statusCode).to.equal(StatusCode.NotFound);
    }
  });

  it('SubscriptionInterceptor user with community, getSubscriptionFileByName', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextGetSubscriptionFileByName, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('SubscriptionInterceptor getSubscriptionFileByName : subscription not found', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findById.resolves(undefined);

      await interceptor.intercept(invocationContextGetSubscriptionFileByName, () => {});
    } catch (err) {
      expect(err.message).to.equal('Subscription not found');
      expect(err.statusCode).to.equal(StatusCode.NotFound);
    }
  });

  it('SubscriptionInterceptor subscription with wrong status, getSubscriptionFileByName', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscription2);

      await interceptor.intercept(invocationContextSubscriptionStatus, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('SubscriptionInterceptor user with wrong clientName, getSubscriptionFileByName', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextUserClientName, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('SubscriptionInterceptor updateById: Error citizen can Access subscription data', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextUpdateByIdWithData, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('SubscriptionInterceptor updateById: Wrong subscription status', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscriptionUpdateByIdValidated);

      await interceptor.intercept(invocationContextUpdateByIdWithData, () => {});
    } catch (err) {
      expect(err.message).to.equal('subscriptions.error.bad.status');
      expect(err.statusCode).to.equal(StatusCode.Conflict);
    }
  });

  it('SubscriptionInterceptor updateById: No data in body', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscriptionUpdateByIdDraft);

      await interceptor.intercept(invocationContextUpdateByIdNoData, () => {});
    } catch (err) {
      expect(err.message).to.equal('At least one specific field must be provided');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('SubscriptionInterceptor updateById: Incentive not found', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscriptionUpdateByIdDraft);
      incentiveRepository.stubs.findById.resolves(undefined);

      await interceptor.intercept(invocationContextUpdateByIdWithData, () => {});
    } catch (err) {
      expect(err.message).to.equal('Incentive not found');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('SubscriptionInterceptor updateById: Incentive without specificFields', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscriptionUpdateByIdDraft);
      incentiveRepository.stubs.findById.resolves(mockIncentiveWithoutSpecificFields);

      await interceptor.intercept(invocationContextUpdateByIdWithData, () => {});
    } catch (err) {
      expect(err.message).to.equal('Incentive without specific fields');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('SubscriptionInterceptor updateById: Error in between specificField body and jsonSchema', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscriptionUpdateByIdDraft);
      incentiveRepository.stubs.findById.resolves(mockIncentiveWithSpecificFields);

      await interceptor.intercept(invocationContextUpdateByIdWithWrongData, () => {});
    } catch (err) {
      expect(err.message).to.equal('is not allowed to have the additional property "text"');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('SubscriptionInterceptor updateById: Success', async () => {
    subscriptionRepository.stubs.findById.resolves(mockSubscriptionUpdateByIdDraft);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithSpecificFields);

    const result = await interceptor.intercept(invocationContextUpdateByIdWithData, () => {});

    expect(result).to.Null;
  });

  function givenStubbedRepository() {
    userRepository = createStubInstance(UserRepository);
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    incentiveRepository = createStubInstance(IncentiveRepository);
    communityRepository = createStubInstance(CommunityRepository);
    currentUserProfile = {
      id: 'testId',
      clientName: 'testName-client',
      emailVerified: true,
      [securityId]: 'testId',
      roles: ['maas'],
    };
  }
});

const invocationContextFindById = {
  target: {},
  methodName: 'findById',
  args: ['randomInputId'],
};

const invocationContextValidate = {
  target: {},
  methodName: 'findById',
  args: ['validate'],
};

const invocationContextReject = {
  target: {},
  methodName: 'reject',
  args: ['validate'],
};

const invocationContextGetSubscriptionFileByName = {
  target: {},
  methodName: 'getSubscriptionFileByName',
  args: ['validate'],
};

const invocationContextSubscriptionStatus = {
  target: {},
  methodName: 'getSubscriptionFileByName',
  args: ['randomInputId2'],
};

const invocationContextUserClientName = {
  target: {},
  methodName: 'getSubscriptionFileByName',
  args: ['randomInputId'],
};

const invocationContextUpdateByIdNoData = {
  target: {},
  methodName: 'updateById',
  args: ['randomInputId', {}],
};

const invocationContextUpdateByIdWithData = {
  target: {},
  methodName: 'updateById',
  args: ['randomInputId', {TextField: 'text', DateField: '2022-06-02'}],
};

const invocationContextUpdateByIdWithWrongData = {
  target: {},
  methodName: 'updateById',
  args: ['randomInputId', {text: 'text', number: 2}],
};

const mockUserWithoutCom = new User({
  id: 'testId',
  email: 'random@random.fr',
  firstName: 'firstName',
  lastName: 'lastName',
  funderId: 'random',
  roles: ['gestionnaires'],
  communityIds: [],
});
const mockUserWithAllCom = new User({
  id: 'testId',
  email: 'random@random.fr',
  firstName: 'firstName',
  lastName: 'lastName',
  funderId: 'random',
  roles: ['gestionnaires'],
});
const mockUserWithCom = new User({
  id: 'testId',
  email: 'random@random.fr',
  firstName: 'firstName',
  lastName: 'lastName',
  funderId: 'random',
  roles: ['gestionnaires'],
  communityIds: ['id1'],
});

const mockSubscription = new Subscription({
  id: 'randomInputId',
  incentiveId: 'incentiveId',
  funderName: 'funderName',
  incentiveType: 'AideEmployeur',
  incentiveTitle: 'incentiveTitle',
  citizenId: 'email@gmail.com',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  consent: true,
  incentiveTransportList: ['velo'],
  communityId: 'id1',
  status: SUBSCRIPTION_STATUS.TO_PROCESS,
  createdAt: new Date('2021-04-06T09:01:30.778Z'),
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
});

const mockSubscription2 = new Subscription({
  id: 'randomInputId2',
  incentiveId: 'incentiveId',
  funderName: 'funderName',
  incentiveType: 'AideEmployeur',
  incentiveTitle: 'incentiveTitle',
  citizenId: 'email@gmail.com',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  consent: true,
  incentiveTransportList: ['velo'],
  communityId: 'id1',
  status: SUBSCRIPTION_STATUS.VALIDATED,
  createdAt: new Date('2021-04-06T09:01:30.778Z'),
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
});

const mockSubscriptionUpdateByIdValidated = new Subscription({
  id: 'randomInputId',
  incentiveId: 'incentiveId',
  funderName: 'funderName',
  incentiveType: 'AideEmployeur',
  incentiveTitle: 'incentiveTitle',
  citizenId: 'testId',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  consent: true,
  incentiveTransportList: ['velo'],
  communityId: 'id1',
  status: SUBSCRIPTION_STATUS.VALIDATED,
  createdAt: new Date('2021-04-06T09:01:30.778Z'),
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
});

const mockSubscriptionUpdateByIdDraft = new Subscription({
  id: 'randomInputId',
  incentiveId: 'incentiveId',
  funderName: 'funderName',
  incentiveType: 'AideEmployeur',
  incentiveTitle: 'incentiveTitle',
  citizenId: 'testId',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  consent: true,
  incentiveTransportList: ['velo'],
  communityId: 'id1',
  status: SUBSCRIPTION_STATUS.DRAFT,
  createdAt: new Date('2021-04-06T09:01:30.778Z'),
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
});

const mockIncentiveWithSpecificFields = new Incentive({
  id: 'incentiveId',
  specificFields: [
    {
      title: 'TextField',
      inputFormat: 'Texte',
      isRequired: true,
    },
    {
      title: 'NumberField',
      inputFormat: 'Numerique',
      isRequired: true,
    },
    {
      title: 'DateField',
      inputFormat: 'Date',
      isRequired: true,
    },
  ],
  jsonSchema: {
    properties: {
      TextField: {
        type: 'text',
        minLength: 1,
      },
      NumberField: {
        type: 'number',
        minLength: 1,
      },
      DateField: {
        type: 'string',
        format: 'date',
      },
    },
    title: 'test',
    type: 'object',
    required: ['TextField', 'NumberField', 'DateField'],
    additionalProperties: false,
  },
});

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

const invocationContextCreates2 = {
  target: {},
  methodName: 'createSubscription',
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
  methodName: 'createSubscription',
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

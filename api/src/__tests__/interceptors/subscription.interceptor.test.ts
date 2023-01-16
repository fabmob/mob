import {
  expect,
  StubbedInstanceWithSinonAccessor,
  createStubInstance,
  sinon,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {SubscriptionInterceptor} from '../../interceptors';
import {
  IncentiveRepository,
  SubscriptionRepository,
  UserRepository,
} from '../../repositories';
import {User, Subscription, Incentive} from '../../models';
import {ValidationError} from '../../validationError';
import {IUser, ResourceName, StatusCode, SUBSCRIPTION_STATUS} from '../../utils';

describe('SubscriptionInterceptor', () => {
  let interceptor: any = null;

  let subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    currentUserProfile: IUser;

  const error = new ValidationError(
    'Access denied',
    '/authorization',
    StatusCode.Forbidden,
  );

  const errorNotFound = new ValidationError(
    `Subscription not found`,
    '/subscriptionNotFound',
    StatusCode.NotFound,
    ResourceName.Subscription,
  );

  const errorBadStatus = new ValidationError(
    `subscriptions.error.bad.status`,
    '/subscriptionBadStatus',
    StatusCode.PreconditionFailed,
    ResourceName.Subscription,
  );

  const errorAtLeastOneSpecificField = new ValidationError(
    `At least one specific field must be provided`,
    '/subscriptionWithoutData',
    StatusCode.PreconditionFailed,
    ResourceName.Subscription,
  );

  const errorIncentiveNotFound = new ValidationError(
    `Incentive not found`,
    '/incentiveNotFound',
    StatusCode.NotFound,
    ResourceName.Subscription,
  );

  const errorIncentiveNoJsonSchema = new ValidationError(
    `Incentive without specific fields`,
    '/incentiveWithoutSpecificFields',
    StatusCode.UnprocessableEntity,
    ResourceName.Subscription,
  );

  beforeEach(() => {
    givenStubbedRepository();
    interceptor = new SubscriptionInterceptor(
      userRepository,
      subscriptionRepository,
      incentiveRepository,
      currentUserProfile,
    );
  });

  it('DelandesnInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });
  it('SubscriptionInterceptor user without community', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithoutCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextFindById, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('SubscriptionInterceptor findById : subscription not found', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithoutCom);
      subscriptionRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationContextFindById, () => {});
    } catch (err) {
      expect(err).to.deepEqual(errorNotFound);
    }
  });
  it('SubscriptionInterceptor user with all perimeter', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithAllCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextFindById, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });
  it('SubscriptionInterceptor user with community, findById', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextFindById, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });
  it('SubscriptionInterceptor user with community, validate', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextValidate, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('SubscriptionInterceptor validate : subsciption not found', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationContextValidate, () => {});
    } catch (err) {
      expect(err).to.deepEqual(errorNotFound);
    }
  });

  it('SubscriptionInterceptor user with community, reject', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextReject, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('SubscriptionInterceptor reject : subscription not found', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationContextReject, () => {});
    } catch (err) {
      expect(err).to.deepEqual(errorNotFound);
    }
  });

  it('SubscriptionInterceptor user with community, getSubscriptionFileByName', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextGetSubscriptionFileByName, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('SubscriptionInterceptor getSubscriptionFileByName : subscription not found', async () => {
    try {
      userRepository.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findById.resolves(undefined);

      await interceptor.intercept(invocationContextGetSubscriptionFileByName, () => {});
    } catch (err) {
      expect(err).to.deepEqual(errorNotFound);
    }
  });

  it('SubscriptionInterceptor subscription with wrong status, getSubscriptionFileByName', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscription2);

      await interceptor.intercept(invocationContextSubscriptionStatus, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('SubscriptionInterceptor user with wrong clientName, getSubscriptionFileByName', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextUserClientName, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('SubscriptionInterceptor updateById: Error citizen can Access subscription data', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextUpdateByIdWithData, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('SubscriptionInterceptor updateById: Wrong subscription status', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscriptionUpdateByIdValidated);

      await interceptor.intercept(invocationContextUpdateByIdWithData, () => {});
    } catch (err) {
      expect(err).to.deepEqual(errorBadStatus);
    }
  });

  it('SubscriptionInterceptor updateById: No data in body', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscriptionUpdateByIdDraft);

      await interceptor.intercept(invocationContextUpdateByIdNoData, () => {});
    } catch (err) {
      expect(err).to.deepEqual(errorAtLeastOneSpecificField);
    }
  });

  it('SubscriptionInterceptor updateById: Incentive not found', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscriptionUpdateByIdDraft);
      incentiveRepository.stubs.findById.resolves(undefined);

      await interceptor.intercept(invocationContextUpdateByIdWithData, () => {});
    } catch (err) {
      expect(err).to.deepEqual(errorIncentiveNotFound);
    }
  });

  it('SubscriptionInterceptor updateById: Incentive without specificFields', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscriptionUpdateByIdDraft);
      incentiveRepository.stubs.findById.resolves(mockIncentiveWithoutSpecificFields);

      await interceptor.intercept(invocationContextUpdateByIdWithData, () => {});
    } catch (err) {
      expect(err).to.deepEqual(errorIncentiveNoJsonSchema);
    }
  });

  it('SubscriptionInterceptor updateById: Error in between specificField body and jsonSchema', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(mockSubscriptionUpdateByIdDraft);
      incentiveRepository.stubs.findById.resolves(mockIncentiveWithSpecificFields);

      await interceptor.intercept(invocationContextUpdateByIdWithWrongData, () => {});
    } catch (err) {
      expect(err).to.deepEqual(
        new ValidationError(
          'is not allowed to have the additional property "text"',
          '',
          StatusCode.UnprocessableEntity,
          ResourceName.Subscription,
        ),
      );
    }
  });

  it('SubscriptionInterceptor updateById: Success', async () => {
    subscriptionRepository.stubs.findById.resolves(mockSubscriptionUpdateByIdDraft);
    incentiveRepository.stubs.findById.resolves(mockIncentiveWithSpecificFields);

    const result = await interceptor.intercept(
      invocationContextUpdateByIdWithData,
      () => {},
    );

    expect(result).to.Null;
  });

  function givenStubbedRepository() {
    userRepository = createStubInstance(UserRepository);
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    incentiveRepository = createStubInstance(IncentiveRepository);
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

const mockIncentiveWithoutSpecificFields = new Incentive({
  id: 'incentiveId',
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

import {
  expect,
  StubbedInstanceWithSinonAccessor,
  createStubInstance,
  sinon,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {SubscriptionInterceptor} from '../../interceptors';
import {SubscriptionRepository, UserRepository} from '../../repositories';
import {User, Subscription} from '../../models';
import {ValidationError} from '../../validationError';
import {IUser, ResourceName, StatusCode, SUBSCRIPTION_STATUS} from '../../utils';

describe('SubscriptionInterceptor', () => {
  let interceptor: any = null;

  let subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    user: StubbedInstanceWithSinonAccessor<UserRepository>,
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

  beforeEach(() => {
    givenStubbedRepository();
    interceptor = new SubscriptionInterceptor(
      user,
      subscriptionRepository,
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
      user.stubs.findOne.resolves(mockUserWithoutCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextFindById, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('SubscriptionInterceptor findById : subscription not found', async () => {
    try {
      user.stubs.findOne.resolves(mockUserWithoutCom);
      subscriptionRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationContextFindById, () => {});
    } catch (err) {
      expect(err).to.deepEqual(errorNotFound);
    }
  });
  it('SubscriptionInterceptor user with all perimeter', async () => {
    try {
      user.stubs.findOne.resolves(mockUserWithAllCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextFindById, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });
  it('SubscriptionInterceptor user with community, findById', async () => {
    try {
      user.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextFindById, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });
  it('SubscriptionInterceptor user with community, validate', async () => {
    try {
      user.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextValidate, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('SubscriptionInterceptor validate : subsciption not found', async () => {
    try {
      user.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationContextValidate, () => {});
    } catch (err) {
      expect(err).to.deepEqual(errorNotFound);
    }
  });

  it('SubscriptionInterceptor user with community, reject', async () => {
    try {
      user.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextReject, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('SubscriptionInterceptor reject : subscription not found', async () => {
    try {
      user.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationContextReject, () => {});
    } catch (err) {
      expect(err).to.deepEqual(errorNotFound);
    }
  });

  it('SubscriptionInterceptor user with community, getSubscriptionFileByName', async () => {
    try {
      user.stubs.findOne.resolves(mockUserWithCom);
      subscriptionRepository.stubs.findById.resolves(mockSubscription);

      await interceptor.intercept(invocationContextGetSubscriptionFileByName, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('SubscriptionInterceptor getSubscriptionFileByName : subscription not found', async () => {
    try {
      user.stubs.findOne.resolves(mockUserWithCom);
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

  function givenStubbedRepository() {
    user = createStubInstance(UserRepository);
    subscriptionRepository = createStubInstance(SubscriptionRepository);
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

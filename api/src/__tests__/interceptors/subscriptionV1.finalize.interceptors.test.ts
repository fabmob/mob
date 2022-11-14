import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {Subscription} from '../../models';
import {ValidationError} from '../../validationError';
import {SubscriptionRepository} from '../../repositories';
import {IUser, ResourceName, StatusCode, SUBSCRIPTION_STATUS} from '../../utils';
import {SubscriptionV1FinalizeInterceptor} from '../../interceptors/external';

describe('SubscriptionV1 finalize Interceptor', () => {
  let interceptor: any = null;
  let subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    currentUserProfile: IUser;

  const inputSubscription = new Subscription({
    id: 'idSubscription',
    citizenId: 'citizenId',
    status: SUBSCRIPTION_STATUS.DRAFT,
  });

  const inputSubscriptionNotBrouillon = new Subscription({
    id: 'idSubscription',
    citizenId: 'citizenId',
    status: SUBSCRIPTION_STATUS.VALIDATED,
  });

  const inputSubscriptionFail = new Subscription({
    id: 'idSubscription',
    citizenId: 'citizenId2',
    status: SUBSCRIPTION_STATUS.DRAFT,
  });

  beforeEach(() => {
    givenStubbedRepository();
    interceptor = new SubscriptionV1FinalizeInterceptor(
      subscriptionRepository,
      currentUserProfile,
    );
  });

  it('SubscriptionV1FinalizeInterceptor args: error Subscription does not exists', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(undefined);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err).to.deepEqual(errorSubscriptionDoesnotExist);
    }
  });

  it('SubscriptionV1FinalizeInterceptor args: error User id fail : error', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputSubscriptionFail);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err.message).to.equal(errorStatusUser.message);
    }
  });

  it('SubscriptionV1FinalizeInterceptor args: error Subscription not BROUILLON', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputSubscriptionNotBrouillon);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err).to.deepEqual(errorStatus);
    }
  });

  it('SubscriptionV1FinalizeInterceptor args: success', async () => {
    subscriptionRepository.stubs.findById.resolves(inputSubscription);
    await interceptor.intercept(invocationContextArgsOK, () => {});
  });

  it('SubscriptionV1FinalizeInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });

  function givenStubbedRepository() {
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    currentUserProfile = {
      id: 'citizenId',
      clientName: 'testName-client',
      emailVerified: true,
      [securityId]: 'citizenId',
    };
  }
});

const errorSubscriptionDoesnotExist: any = new ValidationError(
  'Subscription does not exist',
  '/subscription',
  StatusCode.NotFound,
  ResourceName.Subscription,
);

const errorStatus: any = new ValidationError(
  `Only subscriptions with Draft status are allowed`,
  '/status',
  StatusCode.PreconditionFailed,
  ResourceName.Subscription,
);

const errorStatusUser: any = new ValidationError('Access denied', '/authorization');

const invocationContextArgsOK = {
  target: {},
  methodName: 'finalizeSubscription',
  args: ['idSubscription'],
};

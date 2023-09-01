import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {Subscription} from '../../models';
import {SubscriptionRepository} from '../../repositories';
import {IUser, StatusCode, SUBSCRIPTION_STATUS} from '../../utils';
import {SubscriptionFinalizeInterceptor} from '../../interceptors';

describe('Subscription finalize Interceptor', () => {
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
    status: SUBSCRIPTION_STATUS.ERROR,
  });

  const inputSubscriptionFail = new Subscription({
    id: 'idSubscription',
    citizenId: 'citizenId2',
    status: SUBSCRIPTION_STATUS.DRAFT,
  });

  beforeEach(() => {
    givenStubbedRepository();
    interceptor = new SubscriptionFinalizeInterceptor(subscriptionRepository, currentUserProfile);
  });

  it('SubscriptionFinalizeInterceptor args: error Subscription does not exists', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(undefined);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err.message).to.equal('Subscription does not exist');
      expect(err.statusCode).to.equal(StatusCode.NotFound);
    }
  });

  it('SubscriptionFinalizeInterceptor args: error User id fail : error', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputSubscriptionFail);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('SubscriptionFinalizeInterceptor args: error Subscription not BROUILLON, VALIDEE, REJETEE', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputSubscriptionNotBrouillon);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err.message).to.equal('subscriptions.error.bad.status');
      expect(err.statusCode).to.equal(StatusCode.Conflict);
    }
  });

  it('SubscriptionFinalizeInterceptor args: success', async () => {
    subscriptionRepository.stubs.findById.resolves(inputSubscription);
    await interceptor.intercept(invocationContextArgsOK, () => {});
  });

  it('SubscriptionFinalizeInterceptor value', async () => {
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

const invocationContextArgsOK = {
  target: {},
  methodName: 'finalizeSubscription',
  args: ['idSubscription'],
};

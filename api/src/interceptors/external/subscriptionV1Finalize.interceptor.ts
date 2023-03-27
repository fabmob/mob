import {
  inject,
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {repository} from '@loopback/repository';
import {SecurityBindings} from '@loopback/security';

import {SubscriptionRepository} from '../../repositories';
import {ResourceName, canAccessHisSubscriptionData, SUBSCRIPTION_STATUS, IUser, Logger} from '../../utils';
import {ConflictError, ForbiddenError, NotFoundError} from '../../validationError';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 * TODO REMOVE BECAUSE endpoint v1/maas/subscriptions/{subscriptionId}/verify is deprecated
 */
@injectable({tags: {key: SubscriptionV1FinalizeInterceptor.BINDING_KEY}})
export class SubscriptionV1FinalizeInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${SubscriptionV1FinalizeInterceptor.name}`;

  constructor(
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @inject(SecurityBindings.USER)
    private currentUser: IUser,
  ) {}

  /**
   * This method is used by LoopBack context to produce an interceptor function
   * for the binding.
   *
   * @returns An interceptor function
   */
  value() {
    return this.intercept.bind(this);
  }

  /**
   * The logic to intercept an invocation
   * @param invocationCtx - Invocation context
   * @param next - A function to invoke next interceptor or the target method
   */
  async intercept(invocationCtx: InvocationContext, next: () => ValueOrPromise<InvocationResult>) {
    try {
      const subscription = await this.subscriptionRepository.findById(invocationCtx.args[0]);

      // Check if subscription exists
      if (!subscription) {
        throw new NotFoundError(
          SubscriptionV1FinalizeInterceptor.name,
          invocationCtx.methodName,
          'Subscription does not exist',
          '/subscription',
          ResourceName.Subscription,
          invocationCtx.args[0],
        );
      }

      // Check if user has access to his own data
      if (!canAccessHisSubscriptionData(this.currentUser.id, subscription?.citizenId)) {
        throw new ForbiddenError(
          SubscriptionV1FinalizeInterceptor.name,
          invocationCtx.methodName,
          this.currentUser.id,
          subscription?.citizenId,
        );
      }

      // Check subscription status
      if (subscription?.status !== SUBSCRIPTION_STATUS.DRAFT) {
        throw new ConflictError(
          SubscriptionV1FinalizeInterceptor.name,
          invocationCtx.methodName,
          'subscriptions.error.bad.status',
          '/subscription',
          ResourceName.Subscription,
          subscription?.status,
          SUBSCRIPTION_STATUS.DRAFT,
        );
      }
      const result = await next();
      return result;
    } catch (error) {
      Logger.error(SubscriptionV1FinalizeInterceptor.name, invocationCtx.name, 'Error', error);
      throw error;
    }
  }
}

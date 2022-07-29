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
import {IUser} from '../../services/authentication.service';
import {
  ResourceName,
  StatusCode,
  canAccessHisSubscriptionData,
  SUBSCRIPTION_STATUS,
} from '../../utils';
import {ValidationError} from '../../validationError';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
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
  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {
    const subscription = await this.subscriptionRepository.findById(
      invocationCtx.args[0],
    );

    // Check if subscription exists
    if (!subscription) {
      throw new ValidationError(
        'Subscription does not exist',
        '/subscription',
        StatusCode.NotFound,
        ResourceName.Subscription,
      );
    }

    // Check if user has access to his own data
    if (!canAccessHisSubscriptionData(this.currentUser.id, subscription?.citizenId)) {
      throw new ValidationError('Access denied', '/authorization', StatusCode.Forbidden);
    }

    // Check subscription status
    if (subscription?.status !== SUBSCRIPTION_STATUS.DRAFT) {
      throw new ValidationError(
        `Only subscriptions with Draft status are allowed`,
        '/status',
        StatusCode.PreconditionFailed,
        ResourceName.Subscription,
      );
    }
    const result = await next();
    return result;
  }
}

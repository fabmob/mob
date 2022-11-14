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

import {UserRepository, SubscriptionRepository} from '../repositories';
import {IUser, ResourceName, StatusCode, SUBSCRIPTION_STATUS} from '../utils';
import {ValidationError} from '../validationError';
import {Subscription} from '../models';
import {IDP_SUFFIX_BACKEND} from '../constants';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@injectable({tags: {key: SubscriptionInterceptor.BINDING_KEY}})
export class SubscriptionInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${SubscriptionInterceptor.name}`;

  constructor(
    @repository(UserRepository)
    private userRepository: UserRepository,
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
    const {methodName, args} = invocationCtx;
    const {id} = this.currentUser;

    let communityIds: '' | string[] | undefined = [];

    const subscriptionId = args[0];
    const subscription: Subscription = await this.subscriptionRepository.findById(
      subscriptionId,
    );

    if (!subscription) {
      throw new ValidationError(
        `Subscription not found`,
        '/subscriptionNotFound',
        StatusCode.NotFound,
        ResourceName.Subscription,
      );
    }

    if (methodName === 'findById') {
      if (subscription?.status === SUBSCRIPTION_STATUS.DRAFT) {
        throw new ValidationError(
          'Access denied',
          '/authorization',
          StatusCode.Forbidden,
        );
      }
    }

    if (methodName === 'getSubscriptionFileByName') {
      if (this.currentUser?.clientName) {
        const clientName = this.currentUser?.clientName;
        if (`${subscription.funderName}-${IDP_SUFFIX_BACKEND}` !== clientName) {
          throw new ValidationError(
            'Access denied',
            '/authorization',
            StatusCode.Forbidden,
          );
        }
      }
      if (subscription.status !== SUBSCRIPTION_STATUS.TO_PROCESS) {
        throw new ValidationError(
          'Access denied',
          '/authorization',
          StatusCode.Forbidden,
        );
      }
    }

    if (
      ['findById', 'validate', 'reject', 'getSubscriptionFileByName'].includes(methodName)
    ) {
      // get current user communities
      communityIds =
        id && (await this.userRepository.findOne({where: {id}}))?.communityIds;

      if (communityIds) {
        if (
          subscription &&
          subscription.communityId &&
          communityIds?.includes(subscription.communityId.toString())
        ) {
          return next();
        } else {
          throw new ValidationError(
            'Access denied',
            '/authorization',
            StatusCode.Forbidden,
          );
        }
      } else {
        return next();
      }
    }
  }
}

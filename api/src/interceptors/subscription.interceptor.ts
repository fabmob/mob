import {
  inject,
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {JsonSchema, repository} from '@loopback/repository';
import {SecurityBindings} from '@loopback/security';
import {Validator, ValidatorResult} from 'jsonschema';
import {format} from 'date-fns';

import {
  UserRepository,
  SubscriptionRepository,
  IncentiveRepository,
} from '../repositories';
import {
  canAccessHisSubscriptionData,
  IUser,
  logger,
  ResourceName,
  StatusCode,
  SUBSCRIPTION_STATUS,
} from '../utils';
import {ValidationError} from '../validationError';
import {Incentive, Subscription} from '../models';
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
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
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
        logger.error(`${SubscriptionInterceptor.name} - ${methodName}\
        - Bad Status : ${subscription?.status}`);
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
        logger.error(`${SubscriptionInterceptor.name} - ${methodName}\
        - Bad Status : ${subscription?.status}`);
        throw new ValidationError(
          'Access denied',
          '/authorization',
          StatusCode.Forbidden,
        );
      }
    }

    if (methodName === 'updateById') {
      const rawSubscriptionSpecificFields: {
        [key: string]: string | number | string[] | Date;
      } = args[1];

      // Check if user has access to his own data
      if (!canAccessHisSubscriptionData(this.currentUser.id, subscription?.citizenId)) {
        throw new ValidationError(
          'Access denied',
          '/authorization',
          StatusCode.Forbidden,
        );
      }

      // Check subscription status
      if (subscription?.status !== SUBSCRIPTION_STATUS.DRAFT) {
        logger.error(`${SubscriptionInterceptor.name} - ${methodName}\
        - Bad Status : ${subscription?.status}`);
        throw new ValidationError(
          'subscriptions.error.bad.status',
          '/subscriptionBadStatus',
          StatusCode.PreconditionFailed,
          ResourceName.Subscription,
        );
      }

      // Check if body has data
      if (
        !rawSubscriptionSpecificFields ||
        !Object.keys(rawSubscriptionSpecificFields).length
      ) {
        logger.error(`${SubscriptionInterceptor.name} - ${methodName}\
        - No data : ${rawSubscriptionSpecificFields}`);
        throw new ValidationError(
          `At least one specific field must be provided`,
          '/subscriptionWithoutData',
          StatusCode.PreconditionFailed,
          ResourceName.Subscription,
        );
      }

      const incentive: Incentive = await this.incentiveRepository.findById(
        subscription.incentiveId,
      );

      // Check if incentive exists
      if (!incentive) {
        logger.error(`${SubscriptionInterceptor.name} - ${methodName}\
        - Incentive doesn't exist : ${subscription.incentiveId}`);
        throw new ValidationError(
          `Incentive not found`,
          '/incentiveNotFound',
          StatusCode.NotFound,
          ResourceName.Subscription,
        );
      }

      // Check if incentive has jsonSchema (== incentive has specificFields)
      // No need to check isMCMStaff => isMCMStaff = false means no specFields
      if (!incentive.jsonSchema) {
        logger.error(`${SubscriptionInterceptor.name} - ${methodName}\
        - Only incentives with specific fields can be updated : ${incentive.jsonSchema}`);
        throw new ValidationError(
          `Incentive without specific fields`,
          '/incentiveWithoutSpecificFields',
          StatusCode.UnprocessableEntity,
          ResourceName.Subscription,
        );
      }

      // Set jsonSchema required property to an empty array
      (incentive.jsonSchema! as JsonSchema).required = [];

      const validator = new Validator();

      // Compare specific fields with json schema
      const resultCompare: ValidatorResult = validator.validate(
        rawSubscriptionSpecificFields,
        incentive.jsonSchema,
      );

      if (resultCompare.errors.length > 0) {
        throw new ValidationError(
          resultCompare.errors[0].message,
          resultCompare.errors[0].path.toString(),
          StatusCode.UnprocessableEntity,
          ResourceName.Subscription,
        );
      }

      // Format Date property
      Object.keys(resultCompare.schema.properties as Object).forEach(
        (propertyName: string) => {
          if (
            resultCompare.schema.properties![propertyName].format === 'date' ||
            (resultCompare.schema.properties![propertyName].oneOf?.[0].format ===
              'date' &&
              rawSubscriptionSpecificFields[propertyName])
          ) {
            rawSubscriptionSpecificFields[propertyName] = format(
              new Date(rawSubscriptionSpecificFields[propertyName] as Date),
              'dd/MM/yyyy',
            );
          }
        },
      );

      return next();
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

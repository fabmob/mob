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
import {getJsonSchema} from '@loopback/rest';

import {
  UserRepository,
  SubscriptionRepository,
  IncentiveRepository,
  CommunityRepository,
} from '../repositories';
import {canAccessHisSubscriptionData, IUser, Logger, ResourceName, SUBSCRIPTION_STATUS} from '../utils';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../validationError';
import {Community, CreateSubscription, Incentive, Subscription} from '../models';
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
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
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
      const {methodName, args} = invocationCtx;
      const {id} = this.currentUser;

      if (methodName === 'createSubscription') {
        let subscriptionIncentiveData: CreateSubscription | undefined = invocationCtx.args[0];
        subscriptionIncentiveData = subscriptionIncentiveData as CreateSubscription;
        const {jsonSchema, funderId, isMCMStaff} = await this.incentiveRepository.findById(
          subscriptionIncentiveData?.incentiveId,
        );
        if (!isMCMStaff) {
          throw new ForbiddenError(SubscriptionInterceptor.name, invocationCtx.methodName, isMCMStaff, true);
        }

        if (funderId) {
          const communities: Community[] = await this.communityRepository.findByFunderId(funderId);
          const communityId = subscriptionIncentiveData?.communityId;

          const conditionWithCommunity =
            communityId && !communities.map(({id}) => id).some(elt => elt === communityId);
          const conditionWOCommunity = !communityId && communities.length > 0;

          if (conditionWithCommunity || conditionWOCommunity) {
            throw new BadRequestError(
              SubscriptionInterceptor.name,
              invocationCtx.methodName,
              'subscription.error.communities.notValid',
              '/subscription',
              ResourceName.Subscription,
              {communityId},
            );
          }
        }
        const validator = new Validator();
        const {incentiveId, consent, communityId, ...specificFieldsToCompare} = subscriptionIncentiveData;
        // If no incentive.json schema, compare with createSubscription model and no additional properties
        const resultCompare = validator.validate(
          jsonSchema ? specificFieldsToCompare : subscriptionIncentiveData,
          jsonSchema ?? {...getJsonSchema(CreateSubscription), additionalProperties: false},
        );
        if (resultCompare.errors.length > 0) {
          throw new UnprocessableEntityError(
            SubscriptionInterceptor.name,
            invocationCtx.methodName,
            resultCompare.errors[0].message,
            resultCompare.errors[0].path.toString(),
            ResourceName.Subscription,
            resultCompare.errors,
          );
        }
        // Extract specific fields if incentive.jsonSchema (meaning specificFields)
        if (jsonSchema) {
          const specificFields: Object = {};
          Object.keys(resultCompare.schema.properties as Object).forEach(element => {
            let value = subscriptionIncentiveData?.[element];
            // Format date
            if (
              resultCompare.schema.properties?.[element].format === 'date' ||
              (resultCompare.schema.properties?.[element].oneOf?.[0].format === 'date' && value)
            ) {
              value = format(new Date(value), 'dd/MM/yyyy');
            }
            Object.assign(specificFields, {[element]: value});
            delete subscriptionIncentiveData?.[element];
          });
          subscriptionIncentiveData!.specificFields = specificFields;
        }
        invocationCtx.args[0] = {...subscriptionIncentiveData};
        const result = await next();
        return result;
      }

      let communityIds: '' | string[] | undefined = [];

      const subscriptionId = args[0];
      const subscription: Subscription = await this.subscriptionRepository.findById(subscriptionId);

      if (!subscription) {
        throw new NotFoundError(
          SubscriptionInterceptor.name,
          invocationCtx.methodName,
          `Subscription not found`,
          '/subscriptionNotFound',
          ResourceName.Subscription,
          subscriptionId,
        );
      }

      if (methodName === 'findById') {
        if (subscription?.status === SUBSCRIPTION_STATUS.DRAFT) {
          throw new ConflictError(
            SubscriptionInterceptor.name,
            invocationCtx.methodName,
            `subscriptions.error.bad.status`,
            '/subscriptionBadStatus',
            ResourceName.Subscription,
            subscription?.status,
            `not ${SUBSCRIPTION_STATUS.DRAFT}`,
          );
        }
      }

      if (methodName === 'getSubscriptionFileByName') {
        if (this.currentUser?.clientName) {
          const clientName = this.currentUser?.clientName;
          if (`${subscription.funderName}-${IDP_SUFFIX_BACKEND}` !== clientName) {
            throw new ForbiddenError(SubscriptionInterceptor.name, invocationCtx.methodName, {
              funderName: `${subscription.funderName}-${IDP_SUFFIX_BACKEND}`,
              clientName: clientName,
            });
          }
        }
        if (subscription.status !== SUBSCRIPTION_STATUS.TO_PROCESS) {
          throw new ConflictError(
            SubscriptionInterceptor.name,
            invocationCtx.methodName,
            `subscriptions.error.bad.status`,
            '/subscriptionBadStatus',
            ResourceName.Subscription,
            subscription?.status,
            SUBSCRIPTION_STATUS.TO_PROCESS,
          );
        }
      }

      if (methodName === 'updateById') {
        const rawSubscriptionSpecificFields: {
          [key: string]: string | number | string[] | Date;
        } = args[1];
        // Check if user has access to his own data
        if (!canAccessHisSubscriptionData(this.currentUser.id, subscription?.citizenId)) {
          throw new ForbiddenError(SubscriptionInterceptor.name, invocationCtx.methodName, {
            currentUserId: this.currentUser.id,
            citizenId: subscription?.citizenId,
          });
        }

        // Check subscription status
        if (subscription?.status !== SUBSCRIPTION_STATUS.DRAFT) {
          throw new ConflictError(
            SubscriptionInterceptor.name,
            invocationCtx.methodName,
            `subscriptions.error.bad.status`,
            '/subscriptionBadStatus',
            ResourceName.Subscription,
            subscription?.status,
            SUBSCRIPTION_STATUS.DRAFT,
          );
        }

        // Check if body has data
        if (!rawSubscriptionSpecificFields || !Object.keys(rawSubscriptionSpecificFields).length) {
          throw new BadRequestError(
            SubscriptionInterceptor.name,
            invocationCtx.methodName,
            `At least one specific field must be provided`,
            '/subscriptionWithoutData',
            ResourceName.Subscription,
            rawSubscriptionSpecificFields,
          );
        }

        const incentive: Incentive = await this.incentiveRepository.findById(subscription.incentiveId);

        // Check if incentive exists
        if (!incentive) {
          throw new BadRequestError(
            SubscriptionInterceptor.name,
            invocationCtx.methodName,
            `Incentive not found`,
            '/incentiveNotFound',
            ResourceName.Subscription,
            subscription.incentiveId,
          );
        }

        // Check if incentive has jsonSchema (== incentive has specificFields)
        // No need to check isMCMStaff => isMCMStaff = false means no specFields
        if (!incentive.jsonSchema) {
          throw new UnprocessableEntityError(
            SubscriptionInterceptor.name,
            invocationCtx.methodName,
            `Incentive without specific fields`,
            '/incentiveWithoutSpecificFields',
            ResourceName.Subscription,
            subscription.incentiveId,
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
          throw new UnprocessableEntityError(
            SubscriptionInterceptor.name,
            invocationCtx.methodName,
            resultCompare.errors[0].message,
            resultCompare.errors[0].path.toString(),
            ResourceName.Subscription,
            resultCompare.errors,
          );
        }

        // Format Date property
        Object.keys(resultCompare.schema.properties as Object).forEach((propertyName: string) => {
          if (
            resultCompare.schema.properties![propertyName].format === 'date' ||
            (resultCompare.schema.properties![propertyName].oneOf?.[0].format === 'date' &&
              rawSubscriptionSpecificFields[propertyName])
          ) {
            rawSubscriptionSpecificFields[propertyName] = format(
              new Date(rawSubscriptionSpecificFields[propertyName] as Date),
              'dd/MM/yyyy',
            );
          }
        });

        return next();
      }

      if (['findById', 'validate', 'reject', 'getSubscriptionFileByName'].includes(methodName)) {
        // get current user communities
        communityIds = id && (await this.userRepository.findOne({where: {id}}))?.communityIds;

        if (communityIds) {
          if (
            subscription &&
            subscription.communityId &&
            communityIds?.includes(subscription.communityId.toString())
          ) {
            return next();
          } else {
            throw new ForbiddenError(SubscriptionInterceptor.name, invocationCtx.methodName, {
              communityIds: communityIds,
              subscriptionCommunityId: subscription.communityId,
            });
          }
        } else {
          return next();
        }
      }
    } catch (error) {
      Logger.error(SubscriptionInterceptor.name, invocationCtx.methodName, 'Error', error);
      throw error;
    }
  }
}

import {
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {getJsonSchema} from '@loopback/rest';
import {repository} from '@loopback/repository';
import {Validator} from 'jsonschema';
import {format} from 'date-fns';

import {IncentiveRepository, CommunityRepository} from '../../repositories';
import {Logger, ResourceName} from '../../utils';
import {BadRequestError, ForbiddenError, UnprocessableEntityError} from '../../validationError';
import {Community, CreateSubscription} from '../../models';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 *  TODO REMOVE BECAUSE endpoint v1/maas/subscriptions/{subscriptionId} is deprecated
 */
@injectable({tags: {key: SubscriptionV1Interceptor.BINDING_KEY}})
export class SubscriptionV1Interceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${SubscriptionV1Interceptor.name}`;

  constructor(
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
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
      let subscriptionIncentiveData: CreateSubscription | undefined = invocationCtx.args[0];
      subscriptionIncentiveData = subscriptionIncentiveData as CreateSubscription;
      const {jsonSchema, funderId, isMCMStaff} = await this.incentiveRepository.findById(
        subscriptionIncentiveData?.incentiveId,
      );
      if (!isMCMStaff) {
        throw new ForbiddenError(SubscriptionV1Interceptor.name, invocationCtx.methodName, isMCMStaff, true);
      }

      if (funderId) {
        const communities: Community[] = await this.communityRepository.findByFunderId(funderId);
        const communityId = subscriptionIncentiveData?.communityId;

        const conditionWithCommunity =
          communityId && !communities.map(({id}) => id).some(elt => elt === communityId);
        const conditionWOCommunity = !communityId && communities.length > 0;

        if (conditionWithCommunity || conditionWOCommunity) {
          throw new BadRequestError(
            SubscriptionV1Interceptor.name,
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
          SubscriptionV1Interceptor.name,
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
    } catch (error) {
      Logger.error(SubscriptionV1Interceptor.name, invocationCtx.methodName, 'Error', error);
      throw error;
    }
  }
}

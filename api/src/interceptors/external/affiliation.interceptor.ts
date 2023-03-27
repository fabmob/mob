import {
  inject,
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  service,
  ValueOrPromise,
} from '@loopback/core';
import {repository} from '@loopback/repository';
import {SecurityBindings} from '@loopback/security';
import {Enterprise} from '../../models';

import {FunderRepository, IncentiveRepository, SubscriptionRepository} from '../../repositories';
import {CitizenService} from '../../services';
import {INCENTIVE_TYPE, isEnterpriseAffilitation, IUser, ResourceName, Roles, Logger} from '../../utils';
import {ForbiddenError, NotFoundError} from '../../validationError';

@injectable({tags: {key: AffiliationInterceptor.BINDING_KEY}})
export class AffiliationInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${AffiliationInterceptor.name}`;

  constructor(
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @service(FunderRepository)
    public funderRepository: FunderRepository,
    @service(CitizenService)
    public citizenService: CitizenService,
    @inject(SecurityBindings.USER)
    private currentUserProfile: IUser,
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
    const {methodName, args} = invocationCtx;
    try {
      const {id, roles} = this.currentUserProfile;
      let incentive, incentiveId;
      if (!roles?.includes(Roles.MAAS_BACKEND)) {
        let inputFunderId: string | undefined = undefined;
        if (methodName === 'findCommunitiesByFunderId') {
          inputFunderId = args[0];
        }

        if (
          methodName === 'createSubscription' ||
          methodName === 'createMetadata' ||
          methodName === 'getMetadata'
        ) {
          incentiveId = args[0].incentiveId;
          inputFunderId =
            incentiveId && (await this.incentiveRepository.findOne({where: {id: incentiveId}}))?.funderId;
        }

        /**
         * TODO: REMOVING DEPRECATED ENDPOINT v1/maas/subscriptions/{subscriptionId}/verify.
         * Remove method : finalizeSubscription
         */
        if (
          methodName === 'addAttachments' ||
          methodName === 'finalizeSubscription' ||
          methodName === 'finalizeSubscriptionMaas'
        ) {
          const subscriptionId = args[0];
          const subscription = await this.subscriptionRepository.findOne({
            where: {id: subscriptionId},
          });
          if (!subscription) {
            throw new NotFoundError(
              AffiliationInterceptor.name,
              methodName,
              `Subscription not found`,
              '/subscriptionNotFound',
              ResourceName.Subscription,
              subscriptionId,
            );
          }

          const incentiveId = subscription.incentiveId;
          inputFunderId =
            incentiveId && (await this.incentiveRepository.findOne({where: {id: incentiveId}}))?.funderId;
        }

        // Find IncentiveMaasById
        if (methodName === 'findIncentiveById') {
          incentiveId = args[0];
          incentive = await this.incentiveRepository.findOne({
            where: {id: incentiveId},
          });
          if (!incentive) {
            throw new NotFoundError(
              AffiliationInterceptor.name,
              methodName,
              `Incentive not found`,
              '/incentiveNotFound',
              ResourceName.Incentive,
              incentiveId,
            );
          }
          if (
            incentive?.incentiveType === INCENTIVE_TYPE.EMPLOYER_INCENTIVE &&
            !roles?.includes(Roles.CONTENT_EDITOR)
          ) {
            inputFunderId = incentiveId && incentive?.funderId;
          } else {
            return next();
          }
        }

        if (inputFunderId) {
          const enterprise: Enterprise | null = await this.funderRepository.getEnterpriseById(inputFunderId);
          const citizen = await this.citizenService.getCitizenWithAffiliationById(id);
          if (!incentive && incentiveId) {
            incentive = await this.incentiveRepository.findOne({
              where: {id: incentiveId},
            });
          }
          /**
           * Users from Platform or Maas can subscribe to all public incentives
           * and needs to be affiliated to a company to subscribe on its aid
           */
          if (
            (roles?.includes(Roles.PLATFORM) || roles?.includes(Roles.MAAS)) &&
            !(
              incentive?.incentiveType === INCENTIVE_TYPE.EMPLOYER_INCENTIVE &&
              !isEnterpriseAffilitation({citizen, enterprise})
            )
          ) {
            const result = await next();
            return result;
          }
          throw new ForbiddenError(AffiliationInterceptor.name, methodName, {
            roles: roles,
            incentiveType: incentive?.incentiveType,
            citizenId: citizen.id,
            funder: enterprise,
          });
        }
      }
      const result = await next();
      return result;
    } catch (error) {
      Logger.error(AffiliationInterceptor.name, methodName, 'Error', error);
      throw error;
    }
  }
}

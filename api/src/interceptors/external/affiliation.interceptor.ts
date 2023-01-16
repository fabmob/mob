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

import {IncentiveRepository, SubscriptionRepository} from '../../repositories';
import {CitizenService, FunderService} from '../../services';
import {
  INCENTIVE_TYPE,
  isEnterpriseAffilitation,
  IUser,
  ResourceName,
  Roles,
  StatusCode,
  logger,
} from '../../utils';
import {ValidationError} from '../../validationError';

@injectable({tags: {key: AffiliationInterceptor.BINDING_KEY}})
export class AffiliationInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${AffiliationInterceptor.name}`;

  constructor(
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @service(FunderService)
    public funderService: FunderService,
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
  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {
    const {methodName, args} = invocationCtx;
    const {id, clientName, roles} = this.currentUserProfile;
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
          incentiveId &&
          (await this.incentiveRepository.findOne({where: {id: incentiveId}}))?.funderId;
      }

      if (methodName === 'addAttachments' || methodName === 'finalizeSubscription') {
        const subscriptionId = args[0];
        const subscription = await this.subscriptionRepository.findOne({
          where: {id: subscriptionId},
        });
        if (!subscription) {
          logger.error(
            `${AffiliationInterceptor.name} - ${methodName} -\
             Subscription not found with this subscriptionId ${subscriptionId} `,
          );
          throw new ValidationError(
            `Subscription not found`,
            '/subscriptionNotFound',
            StatusCode.NotFound,
            ResourceName.Subscription,
          );
        }

        const incentiveId = subscription.incentiveId;
        inputFunderId =
          incentiveId &&
          (await this.incentiveRepository.findOne({where: {id: incentiveId}}))?.funderId;
      }

      // Find IncentiveMaasById
      if (methodName === 'findIncentiveById') {
        incentiveId = args[0];
        incentive = await this.incentiveRepository.findOne({
          where: {id: incentiveId},
        });
        if (!incentive) {
          logger.error(
            `${AffiliationInterceptor.name} - ${methodName} -\
             Incentive not found with this incentiveId ${incentiveId} `,
          );
          throw new ValidationError(
            `Incentive not found`,
            '/incentiveNotFound',
            StatusCode.NotFound,
            ResourceName.Incentive,
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

      const funders: any = inputFunderId && (await this.funderService.getFunders());
      const funderMatch = funders && funders.find(({id}: any) => inputFunderId === id);
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
          !isEnterpriseAffilitation({citizen, funderMatch, inputFunderId})
        )
      ) {
        const result = await next();
        return result;
      }
      logger.error(`${AffiliationInterceptor.name} - ${methodName} -\
       Access denied of incentive ${incentive}, for citizen ${citizen}, with funder match ${funderMatch}.`);
      throw new ValidationError('Access denied', '/authorization', StatusCode.Forbidden);
    }
    const result = await next();
    return result;
  }
}

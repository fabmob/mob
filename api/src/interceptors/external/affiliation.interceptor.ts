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

import {
  IncentiveRepository,
  CitizenRepository,
  SubscriptionRepository,
} from '../../repositories';
import {FunderService} from '../../services';
import {
  FUNDER_TYPE,
  INCENTIVE_TYPE,
  isEnterpriseAffilitation,
  IUser,
  ResourceName,
  Roles,
  StatusCode,
} from '../../utils';
import {ValidationError} from '../../validationError';

@injectable({tags: {key: AffiliationInterceptor.BINDING_KEY}})
export class AffiliationInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${AffiliationInterceptor.name}`;

  constructor(
    @repository(CitizenRepository)
    public citizenRepository: CitizenRepository,
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @service(FunderService)
    public funderService: FunderService,
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
        const {incentiveId} = args[0];
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
        const incentiveId = args[0];

        const incentive = await this.incentiveRepository.findOne({
          where: {id: incentiveId},
        });
        if (!incentive) {
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
      const citizen = await this.citizenRepository.findOne({where: {id}});

      // Users from platform can subscribe to all collectivity aid
      // Users from MaaS can subscribe to all collectivity aid
      // Users from platform needs to be affiliated to a company to subscribe
      if (
        (roles?.includes(Roles.PLATFORM) || roles?.includes(Roles.MAAS)) &&
        (funderMatch?.funderType === FUNDER_TYPE.collectivity ||
          isEnterpriseAffilitation({citizen, funderMatch, inputFunderId}))
      ) {
        const result = await next();
        return result;
      }

      throw new ValidationError('Access denied', '/authorization', StatusCode.Forbidden);
    }
    const result = await next();
    return result;
  }
}

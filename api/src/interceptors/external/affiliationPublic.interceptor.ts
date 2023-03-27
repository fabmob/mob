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

import {IncentiveRepository} from '../../repositories';
import {INCENTIVE_TYPE, StatusCode, ResourceName, IUser, Logger} from '../../utils';
import {ForbiddenError, NotFoundError} from '../../validationError';

@injectable({tags: {key: AffiliationPublicInterceptor.BINDING_KEY}})
export class AffiliationPublicInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${AffiliationPublicInterceptor.name}`;

  constructor(
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
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
    const {roles} = this.currentUserProfile;
    try {
      if (roles && roles.includes('service_maas')) {
        // Find IncentiveById
        if (methodName === 'findIncentiveById') {
          const incentiveId = args[0];
          const incentive = await this.incentiveRepository.findOne({
            where: {id: incentiveId},
          });
          if (!incentive) {
            throw new NotFoundError(
              AffiliationPublicInterceptor.name,
              invocationCtx.methodName,
              `Incentive not found`,
              '/incentiveNotFound',
              ResourceName.Incentive,
              incentiveId,
            );
          }
          if (incentive?.incentiveType === INCENTIVE_TYPE.EMPLOYER_INCENTIVE) {
            throw new ForbiddenError(
              AffiliationPublicInterceptor.name,
              invocationCtx.methodName,
              incentive?.incentiveType,
              INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
            );
          }
        }
      }
      return next();
    } catch (error) {
      Logger.error(AffiliationPublicInterceptor.name, methodName, 'Error', error);
      throw error;
    }
  }
}

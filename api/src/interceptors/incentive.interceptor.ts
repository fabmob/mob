import {
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Collectivity, Enterprise} from '../models';

import {Incentive} from '../models/incentive/incentive.model';
import {
  IncentiveRepository,
  IncentiveEligibilityChecksRepository,
  CollectivityRepository,
  EnterpriseRepository,
} from '../repositories';
import {
  INCENTIVE_TYPE,
  ResourceName,
  StatusCode,
  SUBSCRIPTION_CHECK_MODE,
} from '../utils';
import {ValidationError} from '../validationError';
import {isValidityDateValid} from './utils';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@injectable({tags: {key: IncentiveInterceptor.BINDING_KEY}})
export class IncentiveInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${IncentiveInterceptor.name}`;

  constructor(
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @repository(IncentiveEligibilityChecksRepository)
    public incentiveEligibilityChecksRepository: IncentiveEligibilityChecksRepository,
    @repository(CollectivityRepository)
    public collectivityRepository: CollectivityRepository,
    @repository(EnterpriseRepository)
    public enterpriseRepository: EnterpriseRepository,
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
    let incentives: Incentive | undefined;
    if (invocationCtx.methodName === 'create') {
      incentives = invocationCtx.args[0];
      if (incentives && incentives.title && incentives.funderName) {
        const incentive = await this.incentiveRepository.findOne({
          where: {title: incentives.title, funderName: incentives.funderName},
        });
        if (incentive) {
          throw new ValidationError(
            `incentives.error.title.alreadyUsedForFunder`,
            '/incentiveTitleAlreadyUsed',
            StatusCode.Conflict,
            ResourceName.Incentive,
          );
        }
      }
    }

    if (invocationCtx.methodName === 'replaceById') incentives = invocationCtx.args[1];

    if (invocationCtx.methodName === 'updateById') {
      const incentiveId = invocationCtx.args[0];
      incentives = invocationCtx.args[1];
      const incentiveToUpdate = await this.incentiveRepository.findOne({
        where: {id: incentiveId},
      });
      if (!incentiveToUpdate) {
        throw new ValidationError(
          `Incentive not found`,
          '/incentiveNotFound',
          StatusCode.NotFound,
          ResourceName.Incentive,
        );
      }
      if (incentives && incentives.title && incentives.funderName) {
        const incentive = await this.incentiveRepository.findOne({
          where: {
            id: {nin: [incentiveId]},
            title: incentives.title,
            funderName: incentives.funderName,
          },
        });
        if (incentive) {
          throw new ValidationError(
            `incentives.error.title.alreadyUsedForFunder`,
            '/incentiveTitleAlreadyUsed',
            StatusCode.Conflict,
            ResourceName.Incentive,
          );
        }
      }
    }

    if (invocationCtx.methodName === 'deleteById') {
      const incentiveId = invocationCtx.args[0];
      const incentiveToDelete = await this.incentiveRepository.findOne({
        where: {id: incentiveId},
      });
      if (!incentiveToDelete) {
        throw new ValidationError(
          `Incentive not found`,
          '/incentiveNotFound',
          StatusCode.NotFound,
          ResourceName.Incentive,
        );
      }
    }

    if (
      incentives &&
      incentives.validityDate &&
      !isValidityDateValid(incentives.validityDate)
    ) {
      throw new ValidationError(
        `incentives.error.validityDate.minDate`,
        '/validityDate',
        StatusCode.PreconditionFailed,
        ResourceName.Incentive,
      );
    }

    // If isMCMStaff === false , should not have a specific fields but subscription is required
    if (
      incentives &&
      !incentives.isMCMStaff &&
      (incentives.specificFields?.length || !incentives.subscriptionLink)
    ) {
      throw new ValidationError(
        `incentives.error.isMCMStaff.specificFieldOrSubscriptionLink`,
        '/isMCMStaff',
        StatusCode.PreconditionFailed,
        ResourceName.Incentive,
      );
    }

    if (incentives && incentives.isMCMStaff) {
      let collectivity: Collectivity | null = null;
      let enterprise: Enterprise | null = null;
      collectivity = await this.collectivityRepository.findOne({
        where: {name: incentives.funderName},
      });
      enterprise = await this.enterpriseRepository.findOne({
        where: {name: incentives.funderName},
      });
      if (!collectivity && !enterprise) {
        throw new ValidationError(
          `incentives.error.isMCMStaff.funderIdMissing`,
          '/isMCMStaff',
          StatusCode.NotFound,
          ResourceName.Funder,
        );
      }
    }

    if (
      incentives &&
      incentives.eligibilityChecks &&
      incentives.eligibilityChecks.length > 0
    ) {
      const incentiveEligibilityChecks =
        await this.incentiveEligibilityChecksRepository.find();

      incentives.eligibilityChecks.forEach(check => {
        const checkControl = incentiveEligibilityChecks.find(control => {
          return control.id === check.id;
        });
        if (!checkControl) {
          throw new ValidationError(
            `EligibilityCheck ${check.id} not found`,
            '/eligibilityChecks',
            StatusCode.NotFound,
            ResourceName.Incentive,
          );
        }
        if (checkControl.type === 'array' && check.value.length === 0) {
          throw new ValidationError(
            `incentives.error.eligibilityChecks.array.empty`,
            '/eligibilityChecks',
            StatusCode.PreconditionFailed,
            ResourceName.Incentive,
          );
        }
      });
    }

    const result = await next();
    return result;
  }
}

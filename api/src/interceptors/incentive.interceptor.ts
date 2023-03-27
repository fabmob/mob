import {
  inject,
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {Filter, repository} from '@loopback/repository';

import {Funder} from '../models';
import {Incentive} from '../models/incentive/incentive.model';
import {IncentiveRepository, IncentiveEligibilityChecksRepository, FunderRepository} from '../repositories';
import {BadRequestError, UnprocessableEntityError} from '../validationError';
import {
  canUseLimit,
  IUser,
  MAAS_PURGED_FIELDS,
  Roles,
  FUNDER_TYPE,
  INCENTIVE_TYPE,
  Logger,
  ResourceName,
} from '../utils';
import {ConflictError, NotFoundError} from '../validationError';
import {isValidityDateValid} from './utils';
import {SecurityBindings} from '@loopback/security';
import {LIMIT_DEFAULT, LIMIT_MAX} from '../constants';

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
    @repository(FunderRepository)
    public funderRepository: FunderRepository,
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
      let incentives: Incentive | undefined;
      if (invocationCtx.methodName === 'create') {
        incentives = invocationCtx.args[0];
        if (incentives && incentives.title) {
          const incentive = await this.incentiveRepository.findOne({
            where: {title: incentives.title, funderId: incentives.funderId},
          });
          if (incentive) {
            throw new ConflictError(
              IncentiveInterceptor.name,
              invocationCtx.methodName,
              `incentives.error.title.alreadyUsedForFunder`,
              '/incentiveTitleAlreadyUsed',
              ResourceName.Incentive,
              incentives.title,
            );
          }
        }

        if (incentives && incentives.territoryIds && incentives.territoryIds.length !== 1) {
          throw new BadRequestError(
            IncentiveInterceptor.name,
            invocationCtx.methodName,
            `incentives.error.territoryIds.minMaxItems`,
            '/incentiveTerritoryIdsMinMaxItems',
            ResourceName.Incentive,
            incentives.territoryIds,
          );
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
          throw new NotFoundError(
            IncentiveInterceptor.name,
            invocationCtx.methodName,
            `Incentive not found`,
            '/incentiveNotFound',
            ResourceName.Incentive,
            incentiveId,
          );
        }
        if (incentives && incentives.title) {
          const incentive = await this.incentiveRepository.findOne({
            where: {
              id: {nin: [incentiveId]},
              title: incentives.title,
              funderId: incentives.funderId,
            },
          });
          if (incentive) {
            throw new ConflictError(
              IncentiveInterceptor.name,
              invocationCtx.methodName,
              `incentives.error.title.alreadyUsedForFunder`,
              '/incentiveTitleAlreadyUsed',
              ResourceName.Incentive,
              incentives.title,
            );
          }
        }

        if (incentives && incentives.territoryIds && incentives.territoryIds.length !== 1) {
          throw new BadRequestError(
            IncentiveInterceptor.name,
            invocationCtx.methodName,
            `incentives.error.territoryIds.minMaxItems`,
            '/incentiveTerritoryIdsMinMaxItems',
            ResourceName.Incentive,
            incentives.territoryIds,
          );
        }

        if (incentives && incentiveToUpdate.funderId !== incentives.funderId) {
          throw new UnprocessableEntityError(
            IncentiveInterceptor.name,
            invocationCtx.methodName,
            `incentives.error.cantUpdate.funderId`,
            '/incentiveTerritoryCantUpdateFunderId',
            ResourceName.Incentive,
            incentives.funderId,
          );
        }
      }

      if (invocationCtx.methodName === 'replaceById') incentives = invocationCtx.args[1];

      if (invocationCtx.methodName === 'deleteById') {
        const incentiveId = invocationCtx.args[0];
        const incentiveToDelete = await this.incentiveRepository.findOne({
          where: {id: incentiveId},
        });
        if (!incentiveToDelete) {
          throw new NotFoundError(
            IncentiveInterceptor.name,
            invocationCtx.methodName,
            `Incentive not found`,
            '/incentiveNotFound',
            ResourceName.Incentive,
            incentiveId,
          );
        }
      }

      if (invocationCtx.methodName === 'find' || invocationCtx.methodName === 'search') {
        const filter: Filter<Incentive> =
          invocationCtx.methodName === 'find' ? invocationCtx.args[0] : invocationCtx.args[1];
        // Check if where filter contains limit
        const limit: number = filter?.limit ?? LIMIT_DEFAULT;
        Logger.debug(IncentiveInterceptor.name, invocationCtx.methodName, 'Applied limit', limit);

        const {roles} = this.currentUser;
        const isContentEditor: boolean | undefined = roles?.includes(Roles.CONTENT_EDITOR);
        // Check if provided limit is more than limitMax
        if (
          !canUseLimit(limit) &&
          ((!isContentEditor && invocationCtx.methodName === 'find') || invocationCtx.methodName === 'search')
        ) {
          throw new BadRequestError(
            IncentiveInterceptor.name,
            invocationCtx.methodName,
            'limit.error.max',
            '/incentive',
            ResourceName.Incentive,
            limit,
            LIMIT_MAX,
          );
        }

        if (invocationCtx.methodName === 'find') {
          const isMaasRole: boolean | undefined = roles?.includes(Roles.MAAS);
          const isMaasBackendRole: boolean | undefined = roles?.includes(Roles.MAAS_BACKEND);

          if (isMaasRole || isMaasBackendRole) {
            // Get list of keys from fields
            const requestedFields: string[] | undefined = filter?.fields && Object.keys(filter?.fields);

            // Check if the requested fields are all inaccessible.
            if (requestedFields?.every((field: string) => Object.keys(MAAS_PURGED_FIELDS).includes(field))) {
              // return error if only purged fields are requested
              throw new BadRequestError(
                IncentiveInterceptor.name,
                invocationCtx.methodName,
                'find.error.requested.fields',
                '/incentive',
                ResourceName.Incentive,
                requestedFields,
                MAAS_PURGED_FIELDS,
              );
            }
          }
        }
      }

      if (incentives && incentives.validityDate && !isValidityDateValid(incentives.validityDate)) {
        throw new BadRequestError(
          IncentiveInterceptor.name,
          invocationCtx.methodName,
          `incentives.error.validityDate.minDate`,
          '/validityDate',
          ResourceName.Incentive,
          incentives.validityDate,
        );
      }

      // If isMCMStaff === false , should not have a specific fields but subscription is required
      if (
        incentives &&
        !incentives.isMCMStaff &&
        (incentives.specificFields?.length || !incentives.subscriptionLink)
      ) {
        throw new UnprocessableEntityError(
          IncentiveInterceptor.name,
          invocationCtx.methodName,
          `incentives.error.isMCMStaff.specificFieldOrSubscriptionLink`,
          '/isMCMStaff',
          ResourceName.Incentive,
          {
            isMCMStaff: incentives.isMCMStaff,
            specificField: incentives.specificFields,
            subscriptionLink: incentives.subscriptionLink,
          },
        );
      }

      if (incentives) {
        const funder: Funder = await this.funderRepository.findById(incentives.funderId);
        if (!funder) {
          throw new BadRequestError(
            IncentiveInterceptor.name,
            invocationCtx.methodName,
            'incentives.error.funderId.notExist',
            '/incentive',
            ResourceName.Funder,
            incentives.funderId,
          );
        }

        if (
          (incentives.incentiveType === INCENTIVE_TYPE.EMPLOYER_INCENTIVE &&
            funder.type !== FUNDER_TYPE.ENTERPRISE) ||
          (incentives.incentiveType === INCENTIVE_TYPE.TERRITORY_INCENTIVE &&
            funder.type !== FUNDER_TYPE.COLLECTIVITY)
        ) {
          throw new UnprocessableEntityError(
            IncentiveInterceptor.name,
            invocationCtx.methodName,
            'incentives.error.funder.wrongType',
            '/incentive',
            ResourceName.Funder,
            funder.type,
          );
        }
      }

      if (incentives && incentives.eligibilityChecks && incentives.eligibilityChecks.length > 0) {
        const incentiveEligibilityChecks = await this.incentiveEligibilityChecksRepository.find();

        incentives.eligibilityChecks.forEach(check => {
          const checkControl = incentiveEligibilityChecks.find(control => {
            return control.id === check.id;
          });
          if (!checkControl) {
            throw new BadRequestError(
              IncentiveInterceptor.name,
              invocationCtx.methodName,
              `EligibilityCheck not found`,
              '/eligibilityChecks',
              ResourceName.Incentive,
              check.id,
            );
          }
          if (checkControl.type === 'array' && check.value.length === 0) {
            throw new UnprocessableEntityError(
              IncentiveInterceptor.name,
              invocationCtx.methodName,
              `incentives.error.eligibilityChecks.array.empty`,
              '/eligibilityChecks',
              ResourceName.Incentive,
              {type: checkControl.type, length: check.value.length},
            );
          }
        });
      }

      const result = await next();
      return result;
    } catch (error) {
      Logger.error(IncentiveInterceptor.name, invocationCtx.methodName, 'Error', error);
      throw error;
    }
  }
}

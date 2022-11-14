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

import {CitizenService} from '../services';
import {Citizen} from '../models/citizen/citizen.model';
import {CitizenRepository, UserRepository} from '../repositories';
import {isAgeValid} from './utils';
import {ValidationError} from '../validationError';
import {
  ResourceName,
  StatusCode,
  logger,
  AFFILIATION_STATUS,
  IUser,
  Roles,
} from '../utils';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */

@injectable({tags: {key: CitizenInterceptor.BINDING_KEY}})
export class CitizenInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${CitizenInterceptor.name}`;

  /*
   * constructor
   */
  constructor(
    @inject('services.CitizenService')
    public citizenService: CitizenService,
    @repository(CitizenRepository)
    public citizenRepository: CitizenRepository,
    @repository(UserRepository)
    private userRepository: UserRepository,
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
    let citizen: Citizen | undefined;
    if (invocationCtx.methodName === 'create') {
      citizen = invocationCtx.args[0];
      if (!citizen?.tos1 || !citizen?.tos2) {
        throw new ValidationError(
          `Citizen must agree to terms of services`,
          '/tos',
          StatusCode.UnprocessableEntity,
          ResourceName.Account,
        );
      }

      if (!citizen?.password) {
        throw new ValidationError(
          `Password cannot be empty`,
          '/password',
          StatusCode.PreconditionFailed,
          ResourceName.Account,
        );
      }
    }

    if (invocationCtx.methodName === 'replaceById') citizen = invocationCtx.args[1];

    if (invocationCtx.methodName === 'findCitizenId') {
      const citizenId = invocationCtx.args[0];
      const citizen = await this.citizenRepository.findOne({
        where: {id: citizenId},
      });
      if (!citizen) {
        throw new ValidationError(
          `Citizen not found`,
          '/citizenNotFound',
          StatusCode.NotFound,
          ResourceName.Citizen,
        );
      }
    }

    if (citizen && !isAgeValid(citizen.identity.birthDate.value)) {
      throw new ValidationError(
        `citizens.error.birthdate.age`,
        '/birthdate',
        StatusCode.PreconditionFailed,
        ResourceName.Account,
      );
    }
    if (invocationCtx.methodName === 'validateAffiliation') {
      const user = this.currentUser;
      if (user.id && !user.roles?.includes(Roles.CITIZENS)) {
        const userData = await this.userRepository.findById(this.currentUser?.id);
        const citizenId = invocationCtx.args[0];
        const citizen = await this.citizenRepository.findOne({
          where: {id: citizenId},
        });
        if (
          userData?.funderId !== citizen?.affiliation.enterpriseId ||
          citizen!.affiliation!.affiliationStatus !== AFFILIATION_STATUS.TO_AFFILIATE
        ) {
          throw new ValidationError(
            'citizen.affiliation.impossible',
            '/citizenAffiliationImpossible',
            StatusCode.PreconditionFailed,
            ResourceName.Affiliation,
          );
        }
      } else if (user.id && user.roles?.includes(Roles.CITIZENS)) {
        if (user?.id !== invocationCtx.args[0]) {
          throw new ValidationError(
            'citizen.affiliation.impossible',
            '/citizenAffiliationImpossible',
            StatusCode.PreconditionFailed,
            ResourceName.Affiliation,
          );
        }
      } else if (!invocationCtx.args[1].token) {
        throw new ValidationError(
          'citizens.affiliation.not.found',
          '/citizensAffiliationNotFound',
          StatusCode.NotFound,
          ResourceName.Affiliation,
        );
      }
    }

    if (invocationCtx.methodName === 'disaffiliation') {
      const citizenId = invocationCtx.args[0];
      let newAffiliatedEmployees: Citizen | undefined,
        newManuelAffiliatedEmployees: Citizen | undefined;

      const citizenToDisaffiliate = await this.citizenRepository.findOne({
        where: {id: citizenId},
      });
      if (!citizenToDisaffiliate) {
        throw new ValidationError(
          `Citizen not found`,
          '/citizenNotFound',
          StatusCode.NotFound,
          ResourceName.Citizen,
        );
      }
      if (
        citizenToDisaffiliate.affiliation.affiliationStatus ===
        AFFILIATION_STATUS.AFFILIATED
      ) {
        const affiliatedEmployees = await this.citizenService.findEmployees({
          status: AFFILIATION_STATUS.AFFILIATED,
          lastName: undefined,
          skip: 0,
        });
        newAffiliatedEmployees = affiliatedEmployees?.employees?.find(
          (elt: Citizen) => elt.id === citizenId,
        );
      }

      if (
        citizenToDisaffiliate.affiliation.affiliationStatus ===
        AFFILIATION_STATUS.TO_AFFILIATE
      ) {
        const manuelAffiliatedEmployees = await this.citizenService.findEmployees({
          status: AFFILIATION_STATUS.TO_AFFILIATE,
          lastName: undefined,
          skip: 0,
          limit: 0,
        });

        newManuelAffiliatedEmployees = manuelAffiliatedEmployees?.employees?.find(
          (elt: Citizen) => elt.id === citizenId,
        );
      }

      if (!newAffiliatedEmployees && !newManuelAffiliatedEmployees) {
        throw new ValidationError(
          'Access denied',
          '/authorization',
          StatusCode.Forbidden,
        );
      } else {
        const checkDisaffiliation = await this.citizenService.checkDisaffiliation(
          citizenId,
        );

        if (!checkDisaffiliation) {
          throw new ValidationError(
            'citizen.disaffiliation.impossible',
            '/citizenDisaffiliationImpossible',
            StatusCode.PreconditionFailed,
            ResourceName.Disaffiliation,
          );
        }
      }
    }

    const result = await next();
    return result;
  }
  catch(err: string) {
    logger.error(err);
    throw err;
  }
}

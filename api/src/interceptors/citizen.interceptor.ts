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

import {AffiliationService, CitizenService} from '../services';
import {Citizen} from '../models/citizen/citizen.model';
import {EnterpriseRepository, UserRepository} from '../repositories';
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
import {Enterprise} from '../models';

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
    @repository(UserRepository)
    private userRepository: UserRepository,
    @repository(EnterpriseRepository)
    private enterpriseRepository: EnterpriseRepository,
    @service(AffiliationService)
    private affiliationService: AffiliationService,
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

      // Enterprise Verification
      if (citizen.affiliation?.enterpriseId) {
        const enterprise: Enterprise | null = await this.enterpriseRepository.findOne({
          where: {id: citizen.affiliation.enterpriseId},
        });

        if (!enterprise) {
          throw new ValidationError(
            `Enterprise does not exist`,
            '/affiliation',
            StatusCode.NotFound,
            ResourceName.Affiliation,
          );
        }

        if (citizen.affiliation?.enterpriseId && citizen.affiliation?.enterpriseEmail) {
          // Check if the professional email is unique
          if (
            await this.affiliationService.isEmailProExisting(
              citizen?.affiliation?.enterpriseEmail,
            )
          ) {
            throw new ValidationError(
              'citizen.email.error.unique',
              '/affiliation.enterpriseEmail',
              StatusCode.UnprocessableEntity,
              ResourceName.UniqueProfessionalEmail,
            );
          }
          // Verification the employee's professional email format
          if (
            !this.affiliationService.isValidEmailProPattern(
              citizen?.affiliation?.enterpriseEmail,
              enterprise?.emailFormat,
            )
          ) {
            throw new ValidationError(
              'citizen.email.professional.error.format',
              '/professionnalEmailBadFormat',
              StatusCode.PreconditionFailed,
              ResourceName.ProfessionalEmail,
            );
          }
        }
      }

      if (!citizen?.password) {
        throw new ValidationError(
          `Password cannot be empty`,
          '/password',
          StatusCode.PreconditionFailed,
          ResourceName.Account,
        );
      }
      if (citizen && !isAgeValid(citizen.identity.birthDate.value)) {
        throw new ValidationError(
          `citizens.error.birthdate.age`,
          '/birthdate',
          StatusCode.PreconditionFailed,
          ResourceName.Account,
        );
      }
    }

    if (invocationCtx.methodName === 'updateById') {
      citizen = invocationCtx.args[1];
      const currentCitizen = await this.citizenService.getCitizenWithAffiliationById(
        invocationCtx.args[0],
      );
      if (!currentCitizen) {
        throw new ValidationError(
          `Citizen not found`,
          '/citizenNotFound',
          StatusCode.NotFound,
          ResourceName.Citizen,
        );
      }
      // Enterprise Verification
      if (citizen?.affiliation?.enterpriseId) {
        const enterprise: Enterprise | null = await this.enterpriseRepository.findOne({
          where: {id: citizen.affiliation?.enterpriseId},
        });

        if (!enterprise) {
          throw new ValidationError(
            `Enterprise does not exist`,
            '/affiliation',
            StatusCode.NotFound,
            ResourceName.Affiliation,
          );
        }

        if (
          citizen.affiliation?.enterpriseId &&
          citizen.affiliation?.enterpriseEmail &&
          (citizen.affiliation.enterpriseEmail !==
            currentCitizen.affiliation?.enterpriseEmail ||
            citizen.affiliation.enterpriseId !== currentCitizen.affiliation?.enterpriseId)
        ) {
          // Verification the employee's professional email format
          if (
            !this.affiliationService.isValidEmailProPattern(
              citizen?.affiliation?.enterpriseEmail,
              enterprise?.emailFormat,
            )
          ) {
            throw new ValidationError(
              'citizen.email.professional.error.format',
              '/professionnalEmailBadFormat',
              StatusCode.PreconditionFailed,
              ResourceName.ProfessionalEmail,
            );
          }
        }
        // Check if the professional email is unique
        if (
          citizen.affiliation?.enterpriseEmail &&
          citizen.affiliation?.enterpriseEmail !==
            currentCitizen.affiliation?.enterpriseEmail &&
          (await this.affiliationService.isEmailProExisting(
            citizen?.affiliation?.enterpriseEmail,
          ))
        ) {
          throw new ValidationError(
            'citizen.email.error.unique',
            '/affiliation.enterpriseEmail',
            StatusCode.UnprocessableEntity,
            ResourceName.UniqueProfessionalEmail,
          );
        }
      }
    }

    if (invocationCtx.methodName === 'findCitizenId') {
      const citizenId = invocationCtx.args[0];
      const citizen = await this.citizenService.getCitizenWithAffiliationById(citizenId);
      if (!citizen) {
        throw new ValidationError(
          `Citizen not found`,
          '/citizenNotFound',
          StatusCode.NotFound,
          ResourceName.Citizen,
        );
      }
    }

    if (invocationCtx.methodName === 'validateAffiliation') {
      const user = this.currentUser;
      if (user.id && !user.roles?.includes(Roles.CITIZENS)) {
        const userData = await this.userRepository.findById(this.currentUser?.id);
        const citizenId = invocationCtx.args[0];
        const citizen = await this.citizenService.getCitizenWithAffiliationById(
          citizenId,
        );
        if (
          userData?.funderId !== citizen?.affiliation.enterpriseId ||
          citizen!.affiliation!.status !== AFFILIATION_STATUS.TO_AFFILIATE
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

      const citizenToDisaffiliate =
        await this.citizenService.getCitizenWithAffiliationById(citizenId);
      if (!citizenToDisaffiliate) {
        throw new ValidationError(
          `Citizen not found`,
          '/citizenNotFound',
          StatusCode.NotFound,
          ResourceName.Citizen,
        );
      }
      if (citizenToDisaffiliate.affiliation.status === AFFILIATION_STATUS.AFFILIATED) {
        const affiliatedEmployees = await this.citizenService.findEmployees({
          status: AFFILIATION_STATUS.AFFILIATED,
          lastName: undefined,
          skip: 0,
        });
        newAffiliatedEmployees = affiliatedEmployees?.employees?.find(
          (elt: Citizen) => elt.id === citizenId,
        );
      }

      if (citizenToDisaffiliate.affiliation.status === AFFILIATION_STATUS.TO_AFFILIATE) {
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
        const checkDisaffiliation = await this.affiliationService.checkDisaffiliation(
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

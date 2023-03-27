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
import {FunderRepository, UserRepository} from '../repositories';
import {isAgeValid} from './utils';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../validationError';
import {ResourceName, AFFILIATION_STATUS, IUser, Roles, Logger, PartialCitizen} from '../utils';
import {Enterprise, Funder} from '../models';

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
    @repository(FunderRepository)
    private funderRepository: FunderRepository,
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
  async intercept(invocationCtx: InvocationContext, next: () => ValueOrPromise<InvocationResult>) {
    try {
      let citizen: Citizen | undefined;
      if (invocationCtx.methodName === 'create') {
        citizen = invocationCtx.args[0];
        if (!citizen?.tos1 || !citizen?.tos2) {
          throw new UnprocessableEntityError(
            CitizenInterceptor.name,
            invocationCtx.methodName,
            `Citizen must agree to terms of services`,
            '/tos',
            ResourceName.Account,
            {tos1: citizen?.tos1, tos2: citizen?.tos2},
            {tos1: true, tos2: true},
          );
        }

        // Enterprise Verification
        if (citizen.affiliation?.enterpriseId) {
          const enterprise: Enterprise | null = await this.funderRepository.getEnterpriseById(
            citizen.affiliation.enterpriseId,
          );

          if (!enterprise) {
            throw new BadRequestError(
              CitizenInterceptor.name,
              invocationCtx.methodName,
              `Enterprise does not exist`,
              '/affiliation',
              ResourceName.Affiliation,
              {enterpriseId: citizen.affiliation?.enterpriseId},
            );
          }

          // Verification the employee's professional email format
          if (
            citizen.affiliation?.enterpriseEmail &&
            !this.affiliationService.isValidEmailProPattern(
              citizen?.affiliation?.enterpriseEmail,
              enterprise?.enterpriseDetails.emailDomainNames,
            )
          ) {
            throw new UnprocessableEntityError(
              CitizenInterceptor.name,
              invocationCtx.methodName,
              'citizen.email.professional.error.format',
              '/affiliation.enterpriseEmail',
              ResourceName.ProfessionalEmail,
              {
                enterpriseEmail: citizen.affiliation?.enterpriseEmail,
                emailFormat: enterprise?.enterpriseDetails.emailDomainNames,
              },
            );
          }
        }

        // Check if the professional email is unique
        if (
          citizen.affiliation?.enterpriseEmail &&
          (await this.affiliationService.isEmailProExisting(citizen?.affiliation?.enterpriseEmail))
        ) {
          throw new ConflictError(
            CitizenInterceptor.name,
            invocationCtx.methodName,
            'citizen.email.error.unique',
            '/affiliation.enterpriseEmail',
            ResourceName.UniqueProfessionalEmail,
            citizen.affiliation?.enterpriseEmail,
          );
        }

        if (!citizen?.password) {
          throw new BadRequestError(
            CitizenInterceptor.name,
            invocationCtx.methodName,
            `Password cannot be empty`,
            '/password',
            ResourceName.Account,
            citizen?.password,
          );
        }
        if (citizen && !isAgeValid(citizen.identity.birthDate.value)) {
          throw new UnprocessableEntityError(
            CitizenInterceptor.name,
            invocationCtx.methodName,
            `citizens.error.birthdate.age`,
            '/birthdate',
            ResourceName.Account,
            citizen.identity.birthDate.value,
            '16 years old',
          );
        }
      }

      if (invocationCtx.methodName === 'updateById') {
        citizen = invocationCtx.args[1];
        const currentCitizen = await this.citizenService.getCitizenWithAffiliationById(invocationCtx.args[0]);
        if (!currentCitizen) {
          throw new NotFoundError(
            CitizenInterceptor.name,
            invocationCtx.methodName,
            `Citizen not found`,
            '/citizenNotFound',
            ResourceName.Citizen,
            invocationCtx.args[0],
          );
        }
        // Enterprise Verification
        if (citizen?.affiliation?.enterpriseId) {
          const enterprise: Enterprise | null = await this.funderRepository.getEnterpriseById(
            citizen.affiliation.enterpriseId,
          );

          if (!enterprise) {
            throw new BadRequestError(
              CitizenInterceptor.name,
              invocationCtx.methodName,
              `Enterprise does not exist`,
              '/affiliation',
              ResourceName.Affiliation,
              {enterpriseId: citizen?.affiliation?.enterpriseId},
            );
          }

          if (
            citizen.affiliation?.enterpriseId &&
            citizen.affiliation?.enterpriseEmail &&
            (citizen.affiliation.enterpriseEmail !== currentCitizen.affiliation?.enterpriseEmail ||
              citizen.affiliation.enterpriseId !== currentCitizen.affiliation?.enterpriseId)
          ) {
            // Verification the employee's professional email format
            if (
              !this.affiliationService.isValidEmailProPattern(
                citizen?.affiliation?.enterpriseEmail,
                enterprise?.enterpriseDetails.emailDomainNames,
              )
            ) {
              throw new UnprocessableEntityError(
                CitizenInterceptor.name,
                invocationCtx.methodName,
                'citizen.email.professional.error.format',
                '/affiliation.enterpriseEmail',
                ResourceName.ProfessionalEmail,
                {
                  enterpriseEmail: citizen.affiliation?.enterpriseEmail,
                  emailFormat: enterprise?.enterpriseDetails.emailDomainNames,
                },
              );
            }
          }
        }

        // Check if the professional email is unique
        if (
          citizen?.affiliation?.enterpriseEmail &&
          citizen.affiliation?.enterpriseEmail !== currentCitizen.affiliation?.enterpriseEmail &&
          (await this.affiliationService.isEmailProExisting(citizen?.affiliation?.enterpriseEmail))
        ) {
          throw new ConflictError(
            CitizenInterceptor.name,
            invocationCtx.methodName,
            'citizen.email.error.unique',
            '/affiliation.enterpriseEmail',
            ResourceName.UniqueProfessionalEmail,
            citizen.affiliation?.enterpriseEmail,
          );
        }
      }

      if (invocationCtx.methodName === 'validateAffiliation') {
        const user = this.currentUser;
        if (user.id && !user.roles?.includes(Roles.CITIZENS)) {
          const userData = await this.userRepository.findById(this.currentUser?.id);
          const citizenId = invocationCtx.args[0];
          const citizen = await this.citizenService.getCitizenWithAffiliationById(citizenId);
          if (userData?.funderId !== citizen?.affiliation.enterpriseId) {
            throw new ForbiddenError(CitizenInterceptor.name, invocationCtx.methodName, {
              funderId: userData?.funderId,
            });
          }
          if (citizen!.affiliation!.status !== AFFILIATION_STATUS.TO_AFFILIATE) {
            throw new ConflictError(
              CitizenInterceptor.name,
              invocationCtx.methodName,
              'citizen.affiliation.impossible',
              '/citizenAffiliationImpossible',
              ResourceName.Affiliation,
              citizen!.affiliation!.status,
              AFFILIATION_STATUS.TO_AFFILIATE,
            );
          }
        } else if (user.id && user.roles?.includes(Roles.CITIZENS)) {
          if (user?.id !== invocationCtx.args[0]) {
            throw new ForbiddenError(CitizenInterceptor.name, invocationCtx.methodName, {userId: user?.id});
          }
        } else if (!invocationCtx.args[1]?.token) {
          throw new BadRequestError(
            CitizenInterceptor.name,
            invocationCtx.methodName,
            'citizens.affiliation.not.found',
            '/citizensAffiliationNotFound',
            ResourceName.Affiliation,
            invocationCtx.args[1],
          );
        }
      }

      if (invocationCtx.methodName === 'disaffiliation') {
        const citizenId = invocationCtx.args[0];
        let newAffiliatedEmployees: PartialCitizen | undefined,
          newManuelAffiliatedEmployees: PartialCitizen | undefined;
        const funder: Funder | null = await this.funderRepository.getFunderByNameAndType(
          this.currentUser.funderName!,
          this.currentUser.funderType!,
        );

        if (!funder) {
          throw new BadRequestError(
            CitizenInterceptor.name,
            invocationCtx.methodName,
            `Funder not found`,
            '/funderNotFound',
            ResourceName.Funder,
            this.currentUser.funderName,
          );
        }

        const citizenToDisaffiliate = await this.citizenService.getCitizenWithAffiliationById(citizenId);

        if (!citizenToDisaffiliate) {
          throw new NotFoundError(
            CitizenInterceptor.name,
            invocationCtx.methodName,
            `Citizen not found`,
            '/citizenNotFound',
            ResourceName.Citizen,
            citizenId,
          );
        }
        if (citizenToDisaffiliate.affiliation.status === AFFILIATION_STATUS.AFFILIATED) {
          const affiliatedEmployees: PartialCitizen[] | [] = await this.citizenService.getEnterpriseEmployees(
            {
              funderId: funder.id,
              status: AFFILIATION_STATUS.AFFILIATED,
              lastName: undefined,
              skip: 0,
              limit: 0,
            },
          );
          newAffiliatedEmployees = affiliatedEmployees?.find((elt: PartialCitizen) => elt.id === citizenId);
        }

        if (citizenToDisaffiliate.affiliation.status === AFFILIATION_STATUS.TO_AFFILIATE) {
          const manuelAffiliatedEmployees = await this.citizenService.getEnterpriseEmployees({
            funderId: funder.id,
            status: AFFILIATION_STATUS.TO_AFFILIATE,
            lastName: undefined,
            skip: 0,
            limit: 0,
          });
          newManuelAffiliatedEmployees = manuelAffiliatedEmployees?.find(
            (elt: PartialCitizen) => elt.id === citizenId,
          );
        }
        if (!newAffiliatedEmployees && !newManuelAffiliatedEmployees) {
          throw new ForbiddenError(CitizenInterceptor.name, invocationCtx.methodName, {
            newAffiliatedEmployees,
            newManuelAffiliatedEmployees,
          });
        } else {
          const checkDisaffiliation = await this.affiliationService.checkDisaffiliation(citizenId);

          if (!checkDisaffiliation) {
            throw new UnprocessableEntityError(
              CitizenInterceptor.name,
              invocationCtx.methodName,
              'citizen.disaffiliation.impossible',
              '/citizenDisaffiliationImpossible',
              ResourceName.Disaffiliation,
              checkDisaffiliation,
            );
          }
        }
      }

      const result = await next();
      return result;
    } catch (error) {
      Logger.error(CitizenInterceptor.name, invocationCtx.methodName, 'Error', error);
      throw error;
    }
  }
}

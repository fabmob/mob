import {
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Community, Funder, User} from '../models';
import {
  CommunityRepository,
  FunderRepository,
  KeycloakGroupRepository,
  UserRepository,
} from '../repositories';
import {FUNDER_TYPE, Logger, ResourceName, Roles} from '../utils';
import {BadRequestError, NotFoundError, UnprocessableEntityError} from '../validationError';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */

@injectable({tags: {key: UserInterceptor.BINDING_KEY}})
export class UserInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${UserInterceptor.name}`;

  /*
   * constructor
   */
  constructor(
    @repository(FunderRepository)
    public funderRepository: FunderRepository,
    @repository(KeycloakGroupRepository)
    public keycloakGroupRepository: KeycloakGroupRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
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
    const {methodName, args} = invocationCtx;
    if (methodName === 'create') {
      const user: User = new User(args[0]);

      const funder: Funder = await this.funderRepository.findById(user.funderId);

      Logger.debug(UserInterceptor.name, invocationCtx.methodName, 'Funder data', funder);

      if (!funder) {
        throw new BadRequestError(
          UserInterceptor.name,
          invocationCtx.methodName,
          `users.error.funders.missed`,
          `/users`,
          ResourceName.User,
          {funderId: user.funderId},
        );
      }

      if (
        funder.type === FUNDER_TYPE.ENTERPRISE &&
        !funder.enterpriseDetails.emailDomainNames.some((format: string) => user.email.endsWith(format))
      ) {
        throw new UnprocessableEntityError(
          UserInterceptor.name,
          invocationCtx.methodName,
          `email.error.emailFormat`,
          `/users`,
          ResourceName.User,
          user.email,
          funder.enterpriseDetails.emailDomainNames,
        );
      }

      if (!funder.enterpriseDetails?.hasManualAffiliation && user.canReceiveAffiliationMail) {
        throw new UnprocessableEntityError(
          UserInterceptor.name,
          invocationCtx.methodName,
          `users.funder.manualAffiliation.refuse`,
          `/users`,
          ResourceName.User,
          user.canReceiveAffiliationMail,
          funder?.enterpriseDetails?.hasManualAffiliation,
        );
      }

      const availableRoles: string[] = await this.keycloakGroupRepository.getSubGroupFunderRoles();
      Logger.debug(UserInterceptor.name, invocationCtx.methodName, 'Available roles', availableRoles);

      if (!availableRoles.filter(roles => user.roles.includes(roles)).length) {
        throw new BadRequestError(
          UserInterceptor.name,
          invocationCtx.methodName,
          `users.error.roles.mismatch`,
          `/users`,
          ResourceName.User,
          user.roles,
          availableRoles,
        );
      }

      const availableCommunities: Community[] = await this.communityRepository.findByFunderId(user.funderId);
      Logger.debug(
        UserInterceptor.name,
        invocationCtx.methodName,
        'Available community',
        availableCommunities,
      );

      if (
        user.roles.includes(Roles.MANAGERS) &&
        availableCommunities.length &&
        !availableCommunities.filter(community => user.communityIds?.includes(community.id)).length
      ) {
        throw new BadRequestError(
          UserInterceptor.name,
          invocationCtx.methodName,
          `users.error.communities.mismatch`,
          `/users`,
          ResourceName.User,
          user.communityIds,
          availableCommunities,
        );
      }
    }

    if (methodName === 'updateById') {
      const userId: string = args[0];
      const user: User = new User(args[1]);
      if (user.canReceiveAffiliationMail) {
        const funder: Funder = await this.funderRepository.findById(user.funderId);
        Logger.debug(UserInterceptor.name, invocationCtx.methodName, 'Funder data', funder);

        if (!funder?.enterpriseDetails.hasManualAffiliation) {
          throw new UnprocessableEntityError(
            UserInterceptor.name,
            invocationCtx.methodName,
            `users.funder.manualAffiliation.refuse`,
            `/users`,
            ResourceName.User,
            {filteredFunder: funder, hasManualAffiliation: funder?.enterpriseDetails.hasManualAffiliation},
          );
        }
      }

      if (!(await this.userRepository.exists(userId))) {
        throw new NotFoundError(
          UserInterceptor.name,
          invocationCtx.methodName,
          `users.error.funders.missed`,
          `/users`,
          ResourceName.User,
          userId,
        );
      }
    }

    const result = await next();
    return result;
  }
}

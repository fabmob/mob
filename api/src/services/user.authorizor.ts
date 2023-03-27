import {AuthorizationContext, AuthorizationDecision, AuthorizationMetadata} from '@loopback/authorization';
import {Affiliation} from '../models';
import {AffiliationRepository, UserRepository} from '../repositories';
import {IUser, Roles} from '../utils';

/**
 * Compare user id and request id to determine if user can access his own data
 * @param authorizationCtx AuthorizationContext
 * @param metadata AuthorizationMetadata
 * @returns AuthorizationDecision
 */
export async function canAccessHisOwnData(
  authorizationCtx: AuthorizationContext,
  metadata: AuthorizationMetadata,
): Promise<AuthorizationDecision> {
  if ((authorizationCtx.principals[0] as IUser).id === authorizationCtx.invocationContext.args[0]) {
    return AuthorizationDecision.ALLOW;
  }
  return AuthorizationDecision.DENY;
}

export async function canAccessCitizenData(
  authorizationCtx: AuthorizationContext,
): Promise<AuthorizationDecision> {
  const currentUser = authorizationCtx.principals[0] as IUser;

  if (
    currentUser.roles?.includes(Roles.CITIZENS) &&
    currentUser.id === authorizationCtx.invocationContext.args[0]
  ) {
    return AuthorizationDecision.ALLOW;
  } else if (currentUser.roles?.includes(Roles.MANAGERS)) {
    const userRepository: UserRepository = await authorizationCtx.invocationContext.get<UserRepository>(
      'repositories.UserRepository',
    );
    const affiliationRepository: AffiliationRepository =
      await authorizationCtx.invocationContext.get<AffiliationRepository>(
        'repositories.AffiliationRepository',
      );
    const {funderId} = await userRepository.findById(currentUser.id);

    const affiliation: Affiliation | null = await affiliationRepository.findOne({
      where: {citizenId: authorizationCtx.invocationContext.args[0]},
    });

    if (funderId === affiliation?.enterpriseId) {
      return AuthorizationDecision.ALLOW;
    }
  }
  return AuthorizationDecision.DENY;
}

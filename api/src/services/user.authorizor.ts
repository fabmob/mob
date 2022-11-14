import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
} from '@loopback/authorization';
import {IUser} from '../utils';

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
  if (
    (authorizationCtx.principals[0] as IUser).id ===
    authorizationCtx.invocationContext.args[0]
  ) {
    return AuthorizationDecision.ALLOW;
  }
  return AuthorizationDecision.DENY;
}

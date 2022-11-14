import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
} from '@loopback/authorization';

import {IUser, Roles} from '../utils';
/**
 * Check if user from maas is needed to access data
 * @param authorizationCtx AuthorizationContext
 * @param metadata AuthorizationMetadata
 * @returns AuthorizationDecision
 */
export async function checkMaas(
  authorizationCtx: AuthorizationContext,
  metadata: AuthorizationMetadata,
): Promise<AuthorizationDecision> {
  if (
    !(authorizationCtx.principals[0] as IUser).clientName &&
    [Roles.MAAS, Roles.MAAS_BACKEND].some(maasRoles => {
      return (authorizationCtx.principals[0] as IUser).roles?.includes(maasRoles);
    })
  ) {
    return AuthorizationDecision.DENY;
  } else {
    return AuthorizationDecision.ALLOW;
  }
}

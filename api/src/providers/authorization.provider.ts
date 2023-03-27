import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
  Authorizer,
} from '@loopback/authorization';
import {Provider} from '@loopback/core';
import {IUser} from '../utils';

export class AuthorizationProvider implements Provider<Authorizer> {
  constructor() {}

  /**
   * @returns authenticateFn
   */
  value(): Authorizer {
    return this.authorize.bind(this);
  }

  async authorize(authorizationCtx: AuthorizationContext, metadata: AuthorizationMetadata) {
    const user = authorizationCtx.principals[0] as IUser;
    const userRoles = user.roles;
    const allowedRoles = metadata.allowedRoles;
    if (!allowedRoles || allowedRoles.some(roles => userRoles?.includes(roles))) {
      return AuthorizationDecision.ALLOW;
    }
    return AuthorizationDecision.DENY;
  }
}

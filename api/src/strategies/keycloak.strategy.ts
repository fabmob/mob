import {AuthenticationStrategy} from '@loopback/authentication';
import {Request} from 'express';
import {service} from '@loopback/core';
import {JwtPayload} from 'jsonwebtoken';

import {AuthenticationService} from '../services/authentication.service';
import {UnauthorizedError} from '../validationError';
import {AUTH_STRATEGY, IUser} from '../utils';

export class KeycloakAuthenticationStrategy implements AuthenticationStrategy {
  name = AUTH_STRATEGY.KEYCLOAK;

  constructor(
    @service(AuthenticationService)
    private authenticationService: AuthenticationService,
  ) {}

  async authenticate(request: Request): Promise<IUser> {
    // Extract token from Bearer
    const token: string = this.authenticationService.extractCredentials(request);

    // Verify & decode Token
    const decodedToken: JwtPayload = await this.authenticationService.verifyToken(token);

    // Convert to UserProfile type
    const user: IUser = this.authenticationService.convertToUser(decodedToken);

    // Check emailVerified
    if (!user.clientName && !user.emailVerified) {
      throw new UnauthorizedError(
        KeycloakAuthenticationStrategy.name,
        this.authenticate.name,
        'Email not verified',
        user.emailVerified,
      );
    }
    return user;
  }
}

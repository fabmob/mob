import {AuthenticationStrategy} from '@loopback/authentication';
import {Request} from 'express';
import {service} from '@loopback/core';
import {JwtPayload} from 'jsonwebtoken';

import {AuthenticationService} from '../services/authentication.service';
import {ValidationError} from '../validationError';
import {AUTH_STRATEGY, IUser, StatusCode} from '../utils';

export class KeycloakAuthenticationStrategy implements AuthenticationStrategy {
  name = AUTH_STRATEGY.KEYCLOAK;

  constructor(
    @service(AuthenticationService)
    private authenticationService: AuthenticationService,
  ) {}

  async authenticate(request: Request): Promise<IUser | undefined> {
    // Extract token from Bearer
    const token: string = this.authenticationService.extractCredentials(request);

    // Verify & decode Token
    const decodedToken: JwtPayload = await this.authenticationService.verifyToken(token);

    // Convert to UserProfile type
    const user: IUser = this.authenticationService.convertToUser(decodedToken);
    // Check emailVerified

    if (!user.clientName && !user.emailVerified) {
      throw new ValidationError(
        `Email not verified`,
        '/authorization',
        StatusCode.Unauthorized,
      );
    }
    return user;
  }
}

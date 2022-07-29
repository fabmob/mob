import {AuthenticationStrategy} from '@loopback/authentication';
import {Request} from 'express';
import {AuthenticationService, IUser} from '../services/authentication.service';
import {service} from '@loopback/core';
import {AUTH_STRATEGY} from '../utils';

export class ApiKeyAuthenticationStrategy implements AuthenticationStrategy {
  name = AUTH_STRATEGY.API_KEY;

  constructor(
    @service(AuthenticationService)
    private authenticationService: AuthenticationService,
  ) {}

  async authenticate(request: Request): Promise<IUser | undefined> {
    // Extract token from Bearer
    const apiKey: string = this.authenticationService.extractApiKey(request);

    // Convert to UserProfile type
    const user: IUser = this.authenticationService.convertToApiKeyUser(apiKey);

    return user;
  }
}

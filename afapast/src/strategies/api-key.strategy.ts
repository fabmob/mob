import {AuthenticationStrategy} from '@loopback/authentication';
import {Request} from 'express';
import {AuthenticationService} from '../services/authentication.service';
import {service} from '@loopback/core';
import { UserProfile, securityId } from '@loopback/security';

export class ApiKeyAuthenticationStrategy implements AuthenticationStrategy {
  name : string = 'api-key';

  constructor(
    @service(AuthenticationService)
    private authenticationService: AuthenticationService,
  ) {}

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const apiKey: string = this.authenticationService.extractApiKey(request);
    const apiUser : UserProfile = {[securityId]: '', key: apiKey}

    return apiUser;
  }
}

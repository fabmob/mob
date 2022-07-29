import {injectable, BindingScope} from '@loopback/core';
import {Request} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';

import {IDP_FQDN, realmName} from '../constants';
import {StatusCode, logger, INCENTIVE_TYPE, Roles} from '../utils';
import {ValidationError} from '../validationError';

const Keycloak = require('keycloak-verify').default;

const keycloakConfig = {realm: realmName, authServerUrl: IDP_FQDN, useCache: true};

const API_KEY = process.env.API_KEY ?? 'apikey';

export interface IUser extends UserProfile {
  [securityId]: string;
  id: string;
  emailVerified: boolean;
  funderName?: string;
  funderType?: string;
  incentiveType?: string;
  clientName?: string;
  roles?: string[];
  key?: string;
}

@injectable({scope: BindingScope.TRANSIENT})
export class AuthenticationService {
  user: any;
  keycloak: any;

  constructor() {
    this.keycloak = new Keycloak(keycloakConfig);
  }

  /**
   * Extract token from Bearer Token
   * @param request Request
   * @returns string
   */
  extractCredentials(request: Request): string {
    if (!request.headers.authorization) {
      throw new ValidationError(
        `Authorization header not found`,
        '/authorization',
        StatusCode.Unauthorized,
      );
    }

    // for example : Bearer xxx.yyy.zzz
    const authHeaderValue = request.headers.authorization;

    if (!authHeaderValue.startsWith('Bearer')) {
      throw new ValidationError(
        `Authorization header is not of type 'Bearer'.`,
        '/authorization',
        StatusCode.Unauthorized,
      );
    }

    // split the string into 2 parts : 'Bearer ' and the `xxx.yyy.zzz`
    const parts = authHeaderValue.split(' ');
    if (parts.length !== 2) {
      throw new ValidationError(
        `Authorization header not valid`,
        '/authorization',
        StatusCode.Unauthorized,
      );
    }
    const token = parts[1];

    return token;
  }

  /**
   * Extract apiKey from Bearer Token
   * @param request Request
   * @returns string
   */
  extractApiKey(request: Request): string {
    const apiKeyHeaderValue = String(request.headers?.['x-api-key']);

    if (!apiKeyHeaderValue) {
      throw new ValidationError(
        `Header is not of type 'X-API-Key'.`,
        '/authorization',
        StatusCode.Unauthorized,
      );
    }

    if (apiKeyHeaderValue !== API_KEY) {
      throw new ValidationError(
        `Wrong API-KEY.`,
        '/authorization',
        StatusCode.Unauthorized,
      );
    }

    return apiKeyHeaderValue;
  }

  /**
   * Verify token with KC-verify
   * Throw an error if not valid
   * Return decoded user if it is
   * @param token string
   * @returns any
   */
  async verifyToken(token: string): Promise<any> {
    if (!token) {
      throw new ValidationError(
        `Error verifying token'.`,
        '/authorization',
        StatusCode.Unauthorized,
      );
    }
    try {
      const user = await this.keycloak.verifyOffline(token);
      return user;
    } catch (error) {
      logger.error(`Error verifying token: ${error.message}`);
      throw new ValidationError(
        `Error verifying token`,
        '/authorization',
        StatusCode.Unauthorized,
      );
    }
  }

  /**
   * Convert to user
   * @param user any
   * @returns User (implements UserProfile)
   */
  convertToUser(user: any): IUser {
    const funderType: string | undefined = user.membership
      ? this.getFunderType(user.membership)
      : undefined;
    const funderName: string | undefined = user.membership
      ? this.getFunderName(user.membership)
      : undefined;
    const incentiveType: string | undefined = funderType
      ? this.getIncentiveType(funderType)
      : undefined;
    return {
      [securityId]: user.id,
      id: user.id,
      emailVerified: user.emailVerified,
      clientName: user.maas_name || user.sirh_name,
      funderType: funderType,
      funderName: funderName,
      incentiveType: incentiveType,
      roles: [
        ...user.realm_access.roles,
        ...(user.resourceAccess?.[user.azp]?.roles ?? []),
      ],
    };
  }

  /**
   * Convert to anonymous user
   * @param apiKey string
   * @returns User (implements UserProfile)
   */
  convertToApiKeyUser(apiKey: string): IUser {
    return {
      [securityId]: '',
      id: '',
      emailVerified: false,
      roles: [Roles.API_KEY],
      key: apiKey,
    };
  }

  /**
   * Get funderType from token membership
   * @param membershipList string[]
   * @returns string
   */
  private getFunderType(membershipList: string[]): string | undefined {
    return membershipList
      .find(
        (membership: string) =>
          membership.includes('entreprises') || membership.includes('collectivités'),
      )
      ?.split('/')
      .filter((splittedMembership: string) => splittedMembership)
      .shift();
  }

  /**
   * Get funderName from token membership
   * @param membershipList string[]
   * @returns string
   */
  private getFunderName(membershipList: string[]): string | undefined {
    return membershipList
      .find(
        (membership: string) =>
          membership.includes('entreprises') || membership.includes('collectivités'),
      )
      ?.split('/')
      .filter((splittedMembership: string) => splittedMembership)
      .pop();
  }

  /**
   * Get incentiveType from token membership
   * @param membershipList string[]
   * @returns string
   */
  private getIncentiveType(funderType: string): string | undefined {
    return funderType === 'entreprises'
      ? INCENTIVE_TYPE.EMPLOYER_INCENTIVE
      : INCENTIVE_TYPE.TERRITORY_INCENTIVE;
  }
}

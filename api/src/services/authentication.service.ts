import {injectable, BindingScope} from '@loopback/core';
import {Request} from '@loopback/rest';
import {securityId} from '@loopback/security';
import axios from 'axios';
import jwkToPem from 'jwk-to-pem';
import jwt, {JwtPayload} from 'jsonwebtoken';

import {IDP_FQDN, realmName} from '../constants';
import {Roles, IUser, FUNDER_TYPE, GROUPS} from '../utils';
import {UnauthorizedError} from '../validationError';

const API_KEY = process.env.API_KEY ?? 'apikey';
const cache: {key: jwkToPem.JWK[]} = {key: []};

@injectable({scope: BindingScope.TRANSIENT})
export class AuthenticationService {
  constructor() {}
  /**
   * Extract token from Bearer Token
   * @param request Request
   * @returns string
   */
  extractCredentials(request: Request): string {
    if (!request.headers.authorization) {
      throw new UnauthorizedError(
        AuthenticationService.name,
        this.extractCredentials.name,
        'Authorization header not found',
        request.headers.authorization,
      );
    }

    // for example : Bearer xxx.yyy.zzz
    const authHeaderValue = request.headers.authorization;

    if (!authHeaderValue.startsWith('Bearer')) {
      throw new UnauthorizedError(
        AuthenticationService.name,
        this.extractCredentials.name,
        `Authorization header is not of type 'Bearer'`,
        authHeaderValue,
      );
    }

    // split the string into 2 parts : 'Bearer ' and the `xxx.yyy.zzz`
    const parts = authHeaderValue.split(' ');
    if (parts.length !== 2) {
      throw new UnauthorizedError(
        AuthenticationService.name,
        this.extractCredentials.name,
        'Authorization header not valid',
        parts.toString(),
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

    if (!apiKeyHeaderValue || apiKeyHeaderValue === 'undefined') {
      throw new UnauthorizedError(
        AuthenticationService.name,
        this.extractApiKey.name,
        `Header is not of type 'X-API-Key'`,
        apiKeyHeaderValue,
      );
    }

    if (apiKeyHeaderValue !== API_KEY) {
      throw new UnauthorizedError(
        AuthenticationService.name,
        this.extractApiKey.name,
        'Wrong API-KEY',
        apiKeyHeaderValue,
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
  async verifyToken(token: string): Promise<JwtPayload> {
    if (!token) {
      throw new UnauthorizedError(
        AuthenticationService.name,
        this.verifyToken.name,
        'Error verifying token',
        token,
      );
    }
    try {
      if (!cache['key'] || cache['key'].length === 0) {
        cache['key'] = (
          await axios.get(`${IDP_FQDN}/auth/realms/${realmName}/protocol/openid-connect/certs`)
        ).data.keys;
      }
      const decodedToken = jwt.decode(token, {complete: true});
      const publicKey = cache['key'].find((key: any) => key.kid === decodedToken?.header.kid);
      const publicKeyPEM = jwkToPem(publicKey!);
      const user: string | JwtPayload = jwt.verify(token, publicKeyPEM);
      return user as JwtPayload;
    } catch (error) {
      throw new UnauthorizedError(
        AuthenticationService.name,
        this.verifyToken.name,
        'Error verifying token',
        error,
      );
    }
  }

  /**
   * Convert to user
   * @param user any
   * @returns User (implements UserProfile)
   */
  convertToUser(user: JwtPayload): IUser {
    const funderType: FUNDER_TYPE | undefined =
      user.membership && !user.client_id ? this.getFunderType(user.membership) : undefined;
    const funderName: string | undefined =
      user.membership && !user.client_id ? this.getFunderName(user.membership) : undefined;
    const groups: string[] | undefined = user.membership ? this.getFundersGroup(user.membership) : undefined;
    return {
      [securityId]: user.sub!,
      id: user.sub!,
      emailVerified: user.email_verified,
      clientName: user.maas_name || user.sirh_name || user.vault_name,
      funderType: funderType,
      funderName: funderName,
      groups: groups,
      roles: [...user.realm_access.roles, ...(user.resource_access?.[user.azp]?.roles ?? [])],
      scopes: user?.scope?.split(' '),
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
  private getFunderType(membershipList: string[]): FUNDER_TYPE | undefined {
    const GROUPS_TO_FUNDER: {[key: string]: FUNDER_TYPE} = {
      [GROUPS.enterprises]: FUNDER_TYPE.ENTERPRISE,
      [GROUPS.collectivities]: FUNDER_TYPE.COLLECTIVITY,
      [GROUPS.administrations_nationales]: FUNDER_TYPE.NATIONAL,
    };
    const group: string | undefined = membershipList
      .find(
        (membership: string) =>
          membership.includes(GROUPS.enterprises) ||
          membership.includes(GROUPS.collectivities) ||
          membership.includes(GROUPS.administrations_nationales),
      )
      ?.split('/')
      .filter((splittedMembership: string) => splittedMembership)
      .shift();
    return group ? GROUPS_TO_FUNDER[group] : undefined;
  }

  /**
   * Get funderType from token membership
   * @param membershipList string[]
   * @returns string[]
   */
  private getFundersGroup(membershipList: string[]): string[] | undefined {
    const groups: string[] = [];
    membershipList.forEach(membership => {
      membership.includes(GROUPS.enterprises) ||
        membership.includes(GROUPS.collectivities) ||
        membership.includes(GROUPS.administrations_nationales),
        groups.push(
          membership
            .split('/')
            .filter((splittedMembership: string) => splittedMembership)
            .pop()!,
        );
    });
    return groups;
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
          membership.includes(GROUPS.enterprises) ||
          membership.includes(GROUPS.collectivities) ||
          membership.includes(GROUPS.administrations_nationales),
      )
      ?.split('/')
      .filter((splittedMembership: string) => splittedMembership)
      .pop();
  }
}

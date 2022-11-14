import {injectable, BindingScope} from '@loopback/core';
import {Request} from '@loopback/rest';
import {securityId} from '@loopback/security';
import axios from 'axios';
import jwkToPem from 'jwk-to-pem';
import jwt, {JwtPayload} from 'jsonwebtoken';

import {IDP_FQDN, realmName} from '../constants';
import {StatusCode, logger, INCENTIVE_TYPE, Roles, IUser} from '../utils';
import {ValidationError} from '../validationError';

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
  async verifyToken(token: string): Promise<JwtPayload> {
    if (!token) {
      throw new ValidationError(
        `Error verifying token'.`,
        '/authorization',
        StatusCode.Unauthorized,
      );
    }
    try {
      if (!cache['key'] || cache['key'].length === 0) {
        cache['key'] = (
          await axios.get(
            `${IDP_FQDN}/auth/realms/${realmName}/protocol/openid-connect/certs`,
          )
        ).data.keys;
      }
      const decodedToken = jwt.decode(token, {complete: true});
      const publicKey = cache['key'].find(
        (key: any) => key.kid === decodedToken?.header.kid,
      );
      const publicKeyPEM = jwkToPem(publicKey!);
      const user: string | JwtPayload = jwt.verify(token, publicKeyPEM);
      return user as JwtPayload;
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
  convertToUser(user: JwtPayload): IUser {
    const funderType: string | undefined =
      user.membership && !user.client_id
        ? this.getFunderType(user.membership)
        : undefined;
    const funderName: string | undefined =
      user.membership && !user.client_id
        ? this.getFunderName(user.membership)
        : undefined;
    const groups: string[] | undefined = user.membership
      ? this.getFundersGroup(user.membership)
      : undefined;
    const incentiveType: string | undefined = funderType
      ? this.getIncentiveType(funderType)
      : undefined;
    return {
      [securityId]: user.sub!,
      id: user.sub!,
      emailVerified: user.email_verified,
      clientName: user.maas_name || user.sirh_name,
      funderType: funderType,
      funderName: funderName,
      incentiveType: incentiveType,
      groups: groups,
      roles: [
        ...user.realm_access.roles,
        ...(user.resource_access?.[user.azp]?.roles ?? []),
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
   * Get funderType from token membership
   * @param membershipList string[]
   * @returns string[]
   */
  private getFundersGroup(membershipList: string[]): string[] | undefined {
    const groups: string[] = [];
    membershipList.forEach(membership => {
      membership.includes('entreprises') || membership.includes('collectivités'),
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

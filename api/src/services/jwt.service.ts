import {injectable, BindingScope} from '@loopback/core';
import jwt from 'jsonwebtoken';

import {Citizen} from '../models';
import {Logger, ResourceName} from '../utils';
import {InternalServerError, UnprocessableEntityError} from '../validationError';

export interface AffiliationAccessTokenPayload {
  id: string;
  enterpriseId: string;
}

const ALGORITHM = 'HS512';

const TOKEN_KEY = process.env.AFFILIATION_JWS_KEY || 'tokenKey';
@injectable({scope: BindingScope.TRANSIENT})
export class JwtService {
  constructor() {}
  /**
   * Generate Affiliation accessToken
   * @param citizen Citizen
   * @returns string
   */
  generateAffiliationAccessToken = (citizen: Citizen): string => {
    if (!citizen?.affiliation) {
      throw new UnprocessableEntityError(
        JwtService.name,
        this.generateAffiliationAccessToken.name,
        'jwt.error.no.affiliation',
        '/jwtNoAffiliation',
        ResourceName.Affiliation,
        citizen.id,
      );
    }
    const citizenAccessTokenPayloads: AffiliationAccessTokenPayload = {
      id: citizen.id,
      enterpriseId: citizen.affiliation.enterpriseId!,
    };
    return jwt.sign(citizenAccessTokenPayloads, TOKEN_KEY, {algorithm: ALGORITHM});
  };

  /**
   * Verify affiliation access token based on secret and payload information
   * @param token string
   * @returns boolean
   */
  verifyAffiliationAccessToken = (token: string): boolean => {
    try {
      const decodedToken: any = jwt.verify(token, TOKEN_KEY, {algorithms: [ALGORITHM]});
      Logger.debug(JwtService.name, this.verifyAffiliationAccessToken.name, 'Decoded token ', decodedToken);
      return Boolean(decodedToken.id && decodedToken.enterpriseId);
    } catch (err) {
      Logger.error(JwtService.name, this.verifyAffiliationAccessToken.name, 'Error', err);
      return false;
    }
  };

  /**
   * Decode token to retrieve informations
   * /!\ Does not verify the payload token, use verifyAffiliationAccessToken before this method.
   * @param token string
   * @returns AffiliationAccessTokenPayload
   */
  decodeAffiliationAccessToken = (token: string): AffiliationAccessTokenPayload => {
    try {
      const decodedToken: any = jwt.verify(token, TOKEN_KEY, {algorithms: [ALGORITHM]});
      return Object.assign({}, {id: decodedToken.id, enterpriseId: decodedToken.enterpriseId});
    } catch (err) {
      throw new InternalServerError(JwtService.name, this.decodeAffiliationAccessToken.name, err);
    }
  };
}

import {expect, sinon} from '@loopback/testlab';
import {Request} from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';

import {AuthenticationService} from '../../services';
import 'regenerator-runtime/runtime';
import {securityId} from '@loopback/security';
import {ValidationError} from '../../validationError';
import {StatusCode} from '../../utils';

describe('authentication service', () => {
  let authenticationService: AuthenticationService;

  beforeEach(() => {
    authenticationService = new AuthenticationService();
  });

  it('should extractCredentials: OK', () => {
    const request = {
      headers: {
        authorization: 'Bearer xxx.yyy.zzz',
      },
    };
    const result = authenticationService.extractCredentials(request as Request);
    expect(result).to.equal(request.headers.authorization.split(' ')[1]);
  });

  it('should extractCredentials: KO no header', () => {
    const expectedError = new ValidationError(
      `Authorization header not found`,
      '/authorization',
      StatusCode.Unauthorized,
    );
    const errorRequest = {
      headers: {},
    };
    try {
      authenticationService.extractCredentials(errorRequest as Request);
    } catch (err) {
      expect(err).to.deepEqual(expectedError);
    }
  });

  it('should extractCredentials: KO not bearer', () => {
    const expectedError = new ValidationError(
      `Authorization header is not of type 'Bearer'.`,
      '/authorization',
      StatusCode.Unauthorized,
    );
    const errorRequest = {
      headers: {
        authorization: 'Test',
      },
    };
    try {
      authenticationService.extractCredentials(errorRequest as Request);
    } catch (err) {
      expect(err).to.deepEqual(expectedError);
    }
  });

  it('should extractCredentials: KO bearer too many parts', () => {
    const expectedError = new ValidationError(
      `Authorization header not valid`,
      '/authorization',
      StatusCode.Unauthorized,
    );
    const errorRequest = {
      headers: {
        authorization: 'Bearer xxx.yyy.zzz test',
      },
    };
    try {
      authenticationService.extractCredentials(errorRequest as Request);
    } catch (err) {
      expect(err).to.deepEqual(expectedError);
    }
  });

  it('should verifyToken: KO no token', async () => {
    const expectedError = new ValidationError(
      `Error verifying token'.`,
      '/authorization',
      StatusCode.Unauthorized,
    );
    const token: any = undefined;
    try {
      await authenticationService.verifyToken(token);
    } catch (err) {
      expect(err).to.deepEqual(expectedError);
    }
  });

  it('should verifyToken: KO jwt expired', async () => {
    const expectedError = new ValidationError(
      `Error verifying token`,
      '/authorization',
      StatusCode.Unauthorized,
    );
    const verifyStub = sinon.stub(jwt, 'verify').returns(expectedError as any);
    try {
      await authenticationService.verifyToken('token');
    } catch (err) {
      expect(err).to.deepEqual(expectedError);
    }
    verifyStub.restore();
  });

  it('should convertToUser: OK collectivity', () => {
    const user = {
      sub: 'id',
      email_verified: true,
      membership: ['/collectivités/Mulhouse'],
      realm_access: {
        roles: ['roles'],
      },
    };
    const userResult = {
      [securityId]: user.sub,
      id: user.sub,
      clientName: undefined,
      emailVerified: user.email_verified,
      funderType: 'collectivités',
      groups: ['Mulhouse'],
      funderName: 'Mulhouse',
      incentiveType: 'AideTerritoire',
      roles: user.realm_access.roles,
    };
    const result = authenticationService.convertToUser(user);
    expect(result).to.deepEqual(userResult);
  });

  it('should convertToUser: OK enterprise', () => {
    const user = {
      sub: 'id',
      email_verified: true,
      membership: ['/entreprises/Capgemini'],
      realm_access: {
        roles: ['roles'],
      },
    };
    const userResult = {
      [securityId]: user.sub,
      id: user.sub,
      clientName: undefined,
      emailVerified: user.email_verified,
      funderType: 'entreprises',
      funderName: 'Capgemini',
      groups: ['Capgemini'],
      incentiveType: 'AideEmployeur',
      roles: user.realm_access.roles,
    };
    const result = authenticationService.convertToUser(user);
    expect(result).to.deepEqual(userResult);
  });

  it('should convertToUser: OK undefined funderType && funderName && incentiveType', () => {
    const user = {
      sub: 'id',
      email_verified: true,
      clientName: undefined,
      membership: ['undefined'],
      realm_access: {
        roles: ['roles'],
      },
    };
    const userResult = {
      [securityId]: user.sub,
      id: user.sub,
      emailVerified: user.email_verified,
      clientName: user.clientName,
      funderType: undefined,
      funderName: undefined,
      groups: ['undefined'],
      incentiveType: undefined,
      roles: user.realm_access.roles,
    };
    const result = authenticationService.convertToUser(user);
    expect(result).to.deepEqual(userResult);
  });

  it('should convertToUser: OK no membership', () => {
    const user = {
      sub: 'id',
      email_verified: true,
      realm_access: {
        roles: ['roles'],
      },
    };
    const userResult = {
      [securityId]: user.sub,
      id: user.sub,
      emailVerified: user.email_verified,
      clientName: undefined,
      funderType: undefined,
      funderName: undefined,
      groups: undefined,
      incentiveType: undefined,
      roles: user.realm_access.roles,
    };
    const result = authenticationService.convertToUser(user);
    expect(result).to.deepEqual(userResult);
  });

  it('should convertToUser: OK more roles', () => {
    const user = {
      sub: 'id',
      email_verified: true,
      azp: 'test',
      realm_access: {
        roles: ['roles'],
      },
      resource_access: {
        test: {
          roles: ['moreRoles'],
        },
      },
    };
    const userResult = {
      [securityId]: user.sub,
      id: user.sub,
      emailVerified: user.email_verified,
      clientName: undefined,
      funderType: undefined,
      funderName: undefined,
      groups: undefined,
      incentiveType: undefined,
      roles: ['roles', 'moreRoles'],
    };
    const result = authenticationService.convertToUser(user);
    expect(result).to.deepEqual(userResult);
  });
});

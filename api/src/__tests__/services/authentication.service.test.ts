import {expect, sinon} from '@loopback/testlab';
import {Request} from 'express';
import jwt from 'jsonwebtoken';

import {AuthenticationService} from '../../services';
import 'regenerator-runtime/runtime';
import {securityId} from '@loopback/security';
import {FUNDER_TYPE, StatusCode} from '../../utils';

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
    const errorRequest = {
      headers: {},
    };
    try {
      authenticationService.extractCredentials(errorRequest as Request);
    } catch (err) {
      expect(err.message).to.equal('Authorization header not found');
      expect(err.statusCode).to.equal(StatusCode.Unauthorized);
    }
  });

  it('should extractCredentials: KO not bearer', () => {
    const errorRequest = {
      headers: {
        authorization: 'Test',
      },
    };
    try {
      authenticationService.extractCredentials(errorRequest as Request);
    } catch (err) {
      expect(err.message).to.equal("Authorization header is not of type 'Bearer'");
      expect(err.statusCode).to.equal(StatusCode.Unauthorized);
    }
  });

  it('should extractCredentials: KO bearer too many parts', () => {
    const errorRequest = {
      headers: {
        authorization: 'Bearer xxx.yyy.zzz test',
      },
    };
    try {
      authenticationService.extractCredentials(errorRequest as Request);
    } catch (err) {
      expect(err.message).to.equal('Authorization header not valid');
      expect(err.statusCode).to.equal(StatusCode.Unauthorized);
    }
  });

  it('should verifyToken: KO no token', async () => {
    const token: any = undefined;
    try {
      await authenticationService.verifyToken(token);
    } catch (err) {
      expect(err.message).to.equal('Error verifying token');
      expect(err.statusCode).to.equal(StatusCode.Unauthorized);
    }
  });

  it('should verifyToken: KO jwt expired', async () => {
    const verifyStub = sinon.stub(jwt, 'verify').rejects('error');
    try {
      await authenticationService.verifyToken('token');
    } catch (err) {
      expect(err.message).to.equal('Error verifying token');
      expect(err.statusCode).to.equal(StatusCode.Unauthorized);
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
      scope: 'openid',
    };
    const userResult = {
      [securityId]: user.sub,
      id: user.sub,
      clientName: undefined,
      emailVerified: user.email_verified,
      funderType: FUNDER_TYPE.COLLECTIVITY,
      groups: ['Mulhouse'],
      funderName: 'Mulhouse',
      roles: user.realm_access.roles,
      scopes: ['openid'],
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
      funderType: FUNDER_TYPE.ENTERPRISE,
      funderName: 'Capgemini',
      groups: ['Capgemini'],
      roles: user.realm_access.roles,
      scopes: undefined,
    };
    const result = authenticationService.convertToUser(user);
    expect(result).to.deepEqual(userResult);
  });

  it('should convertToUser: OK undefined funderType && funderName', () => {
    const user = {
      sub: 'id',
      email_verified: true,
      clientName: undefined,
      membership: ['undefined'],
      realm_access: {
        roles: ['roles'],
      },
      scope: 'profile openid email',
    };
    const userResult = {
      [securityId]: user.sub,
      id: user.sub,
      emailVerified: user.email_verified,
      clientName: user.clientName,
      funderType: undefined,
      funderName: undefined,
      groups: ['undefined'],
      roles: user.realm_access.roles,
      scopes: ['profile', 'openid', 'email'],
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
      scope: 'profile openid email',
    };
    const userResult = {
      [securityId]: user.sub,
      id: user.sub,
      emailVerified: user.email_verified,
      clientName: undefined,
      funderType: undefined,
      funderName: undefined,
      groups: undefined,
      roles: user.realm_access.roles,
      scopes: ['profile', 'openid', 'email'],
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
      scope: 'profile openid email',
    };
    const userResult = {
      [securityId]: user.sub,
      id: user.sub,
      emailVerified: user.email_verified,
      clientName: undefined,
      funderType: undefined,
      funderName: undefined,
      groups: undefined,
      roles: ['roles', 'moreRoles'],
      scopes: ['profile', 'openid', 'email'],
    };
    const result = authenticationService.convertToUser(user);
    expect(result).to.deepEqual(userResult);
  });

  it('should extractApiKey: KO no header', () => {
    try {
      const request = {
        headers: undefined,
      };
      authenticationService.extractApiKey(request as unknown as Request);
    } catch (err) {
      expect(err.message).to.equal(`Header is not of type 'X-API-Key'`);
      expect(err.statusCode).to.equal(StatusCode.Unauthorized);
    }
  });

  it('should extractApiKey: KO api key', () => {
    try {
      const request = {
        headers: {
          ['x-api-key']: 'error',
        },
      };
      authenticationService.extractApiKey(request as unknown as Request);
    } catch (err) {
      expect(err.message).to.equal(`Wrong API-KEY`);
      expect(err.statusCode).to.equal(StatusCode.Unauthorized);
    }
  });
});

import {expect, sinon} from '@loopback/testlab';
import {Request} from 'express';
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      expect(err).to.deepEqual(expectedError);
    }
  });

  it('should verifyToken: OK', async () => {
    sinon.stub(authenticationService.keycloak, 'verifyOffline').resolves({user: 'user'});
    const result = await authenticationService.verifyToken('token');
    expect(result).to.deepEqual({user: 'user'});
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
    } catch (err: any) {
      expect(err).to.deepEqual(expectedError);
    }
  });

  it('should verifyToken: KO jwt expired', async () => {
    const expectedError = new ValidationError(
      `Error verifying token`,
      '/authorization',
      StatusCode.Unauthorized,
    );
    try {
      sinon
        .stub(authenticationService.keycloak, 'verifyOffline')
        .rejects({message: 'error'});
      await authenticationService.verifyToken('token');
    } catch (err: any) {
      expect(err).to.deepEqual(expectedError);
    }
  });

  it('should convertToUser: OK collectivity', () => {
    const user = {
      id: 'id',
      emailVerified: true,
      membership: ['/collectivités/Mulhouse'],
      realm_access: {
        roles: ['roles'],
      },
    };
    const userResult = {
      [securityId]: user.id,
      id: user.id,
      clientName: undefined,
      emailVerified: user.emailVerified,
      funderType: 'collectivités',
      funderName: 'Mulhouse',
      incentiveType: 'AideTerritoire',
      roles: user.realm_access.roles,
    };
    const result = authenticationService.convertToUser(user);
    expect(result).to.deepEqual(userResult);
  });

  it('should convertToUser: OK enterprise', () => {
    const user = {
      id: 'id',
      emailVerified: true,
      membership: ['/entreprises/Capgemini'],
      realm_access: {
        roles: ['roles'],
      },
    };
    const userResult = {
      [securityId]: user.id,
      id: user.id,
      clientName: undefined,
      emailVerified: user.emailVerified,
      funderType: 'entreprises',
      funderName: 'Capgemini',
      incentiveType: 'AideEmployeur',
      roles: user.realm_access.roles,
    };
    const result = authenticationService.convertToUser(user);
    expect(result).to.deepEqual(userResult);
  });

  it('should convertToUser: OK undefined funderType && funderName && incentiveType', () => {
    const user = {
      id: 'id',
      emailVerified: true,
      clientName: undefined,
      membership: ['undefined'],
      realm_access: {
        roles: ['roles'],
      },
    };
    const userResult = {
      [securityId]: user.id,
      id: user.id,
      emailVerified: user.emailVerified,
      clientName: user.clientName,
      funderType: undefined,
      funderName: undefined,
      incentiveType: undefined,
      roles: user.realm_access.roles,
    };
    const result = authenticationService.convertToUser(user);
    expect(result).to.deepEqual(userResult);
  });

  it('should convertToUser: OK no membership', () => {
    const user = {
      id: 'id',
      emailVerified: true,
      realm_access: {
        roles: ['roles'],
      },
    };
    const userResult = {
      [securityId]: user.id,
      id: user.id,
      emailVerified: user.emailVerified,
      clientName: undefined,
      funderType: undefined,
      funderName: undefined,
      incentiveType: undefined,
      roles: user.realm_access.roles,
    };
    const result = authenticationService.convertToUser(user);
    expect(result).to.deepEqual(userResult);
  });

  it('should convertToUser: OK more roles', () => {
    const user = {
      id: 'id',
      emailVerified: true,
      azp: 'test',
      realm_access: {
        roles: ['roles'],
      },
      resourceAccess: {
        test: {
          roles: ['moreRoles'],
        },
      },
    };
    const userResult = {
      [securityId]: user.id,
      id: user.id,
      emailVerified: user.emailVerified,
      clientName: undefined,
      funderType: undefined,
      funderName: undefined,
      incentiveType: undefined,
      roles: ['roles', 'moreRoles'],
    };
    const result = authenticationService.convertToUser(user);
    expect(result).to.deepEqual(userResult);
  });
});

import {expect, sinon} from '@loopback/testlab';
import {Request} from 'express';
import 'regenerator-runtime/runtime';
import {securityId} from '@loopback/security';
import {KeycloakAuthenticationStrategy} from '../../strategies';
import {AuthenticationService} from '../../services';
import {ValidationError} from '../../validationError';
import {StatusCode} from '../../utils';

describe('Keycloak strategy', () => {
  let keycloakStrategy: KeycloakAuthenticationStrategy,
    authenticationService: AuthenticationService;

  beforeEach(() => {
    authenticationService = new AuthenticationService();
    keycloakStrategy = new KeycloakAuthenticationStrategy(authenticationService);
  });

  it('should authenticate: OK', async () => {
    const user = {
      sub: 'id',
      email_verified: true,
      clientName: undefined,
      membership: ['/collectivités/Mulhouse'],
      realm_access: {
        roles: ['roles'],
      },
    };
    const userResult = {
      [securityId]: user.sub,
      id: user.sub,
      emailVerified: user.email_verified,
      clientName: user.clientName,
      funderType: 'collectivités',
      funderName: 'Mulhouse',
      groups: ['Mulhouse'],
      incentiveType: 'AideTerritoire',
      roles: user.realm_access.roles,
    };
    sinon.stub(authenticationService, 'verifyToken').resolves(user);
    const request = {
      headers: {
        authorization: 'Bearer xxx.yyy.zzz',
      },
    };
    const result = await keycloakStrategy.authenticate(request as Request);
    expect(result).to.deepEqual(userResult);
  });

  it('should authenticate: KO emailverified false', async () => {
    const user = {
      sub: 'id',
      email_verified: false,
      membership: ['membership'],
      realm_access: {
        roles: ['roles'],
      },
    };
    sinon.stub(authenticationService, 'verifyToken').resolves(user);
    const request = {
      headers: {
        authorization: 'Bearer xxx.yyy.zzz',
      },
    };
    const expectedError = new ValidationError(
      `Email not verified`,
      '/authorization',
      StatusCode.Unauthorized,
    );
    try {
      await keycloakStrategy.authenticate(request as Request);
    } catch (err) {
      expect(err).to.deepEqual(expectedError);
    }
  });
});

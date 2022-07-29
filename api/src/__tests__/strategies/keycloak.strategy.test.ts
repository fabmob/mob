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
      id: 'id',
      emailVerified: true,
      clientName: undefined,
      membership: ['/collectivités/Mulhouse'],
      realm_access: {
        roles: ['roles'],
      },
    };
    const userResult = {
      [securityId]: user.id,
      id: user.id,
      emailVerified: user.emailVerified,
      clientName: user.clientName,
      funderType: 'collectivités',
      funderName: 'Mulhouse',
      incentiveType: 'AideTerritoire',
      roles: user.realm_access.roles,
    };
    sinon.stub(authenticationService.keycloak, 'verifyOffline').resolves(user);
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
      id: 'id',
      emailVerified: false,
      membership: ['membership'],
      realm_access: {
        roles: ['roles'],
      },
    };
    sinon.stub(authenticationService.keycloak, 'verifyOffline').resolves(user);
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
    } catch (err: any) {
      expect(err).to.deepEqual(expectedError);
    }
  });
});

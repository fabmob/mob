import {expect, sinon} from '@loopback/testlab';
import {Request} from 'express';
import {securityId} from '@loopback/security';
import {KeycloakAuthenticationStrategy} from '../../strategies';
import {AuthenticationService} from '../../services';
import {FUNDER_TYPE, StatusCode} from '../../utils';

describe('Keycloak strategy', () => {
  let keycloakStrategy: KeycloakAuthenticationStrategy, authenticationService: AuthenticationService;

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
      scope: 'profile email openid',
    };
    const userResult = {
      [securityId]: user.sub,
      id: user.sub,
      emailVerified: user.email_verified,
      clientName: user.clientName,
      funderType: FUNDER_TYPE.COLLECTIVITY,
      funderName: 'Mulhouse',
      groups: ['Mulhouse'],
      roles: user.realm_access.roles,
      scopes: ['profile', 'email', 'openid'],
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
    try {
      await keycloakStrategy.authenticate(request as Request);
    } catch (err) {
      expect(err.message).to.deepEqual('Email not verified');
      expect(err.statusCode).to.deepEqual(StatusCode.Unauthorized);
    }
  });
});

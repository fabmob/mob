import {expect, sinon} from '@loopback/testlab';
import {Request} from 'express';
import {securityId} from '@loopback/security';
import {ApiKeyAuthenticationStrategy} from '../../strategies';
import {AuthenticationService} from '../../services';
import {Roles} from '../../utils';

describe('ApiKey strategy', () => {
  let apiKeyAuthenticationStrategy: ApiKeyAuthenticationStrategy,
    authenticationService: AuthenticationService;

  beforeEach(() => {
    authenticationService = new AuthenticationService();
    apiKeyAuthenticationStrategy = new ApiKeyAuthenticationStrategy(
      authenticationService,
    );
  });

  it('should authenticate: OK', async () => {
    const apiKey = 'cx554xx';
    const userResult = {
      [securityId]: '',
      id: '',
      emailVerified: false,
      roles: [Roles.API_KEY],
      key: apiKey,
    };
    sinon.stub(authenticationService, 'extractApiKey').returns(apiKey);
    const request = {
      headers: {
        authorization: 'Bearer xxx.yyy.zzz',
      },
    };
    const result = await apiKeyAuthenticationStrategy.authenticate(request as Request);
    expect(result).to.deepEqual(userResult);
  });
});

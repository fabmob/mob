import {expect} from '@loopback/testlab';
import {securityId} from '@loopback/security';
import {AuthorizationContext, AuthorizationDecision, AuthorizationMetadata} from '@loopback/authorization';
import {AuthorizationProvider} from '../../providers';

describe('Authorization provider', () => {
  let authorizationProvider: AuthorizationProvider;

  beforeEach(() => {
    authorizationProvider = new AuthorizationProvider();
  });

  it('should value: OK', async () => {
    const result = authorizationProvider.value();
    expect(result).to.deepEqual(authorizationProvider.authorize.bind(authorizationProvider));
  });

  it('should authorize: OK ALLOW', async () => {
    const authContext: AuthorizationContext = {
      principals: [
        {
          [securityId]: 'id',
          id: 'id',
          emailVerified: true,
          maas: 'maas',
          membership: ['membership'],
          roles: ['financeurs'],
        },
      ],
      roles: [],
      scopes: [],
      resource: '',
      invocationContext: null as any,
    };
    const metadata: AuthorizationMetadata = {
      allowedRoles: ['financeurs'],
    };
    const result = await authorizationProvider.authorize(authContext, metadata);
    expect(result).to.deepEqual(AuthorizationDecision.ALLOW);
  });

  it('should authorize: OK ALLOW no allowed Roles', async () => {
    const authContext: AuthorizationContext = {
      principals: [
        {
          [securityId]: 'id',
          id: 'id',
          emailVerified: true,
          maas: 'maas',
          membership: ['membership'],
          roles: ['financeurs'],
        },
      ],
      roles: [],
      scopes: [],
      resource: '',
      invocationContext: null as any,
    };
    const metadata: AuthorizationMetadata = {};
    const result = await authorizationProvider.authorize(authContext, metadata);
    expect(result).to.deepEqual(AuthorizationDecision.ALLOW);
  });

  it('should authorize: OK DENY allowed Roles && no user roles', async () => {
    const authContext: AuthorizationContext = {
      principals: [
        {
          [securityId]: 'id',
          id: 'id',
          emailVerified: true,
          maas: 'maas',
          membership: ['membership'],
        },
      ],
      roles: [],
      scopes: [],
      resource: '',
      invocationContext: null as any,
    };
    const metadata: AuthorizationMetadata = {
      allowedRoles: ['financeurs'],
    };
    const result = await authorizationProvider.authorize(authContext, metadata);
    expect(result).to.deepEqual(AuthorizationDecision.DENY);
  });
});

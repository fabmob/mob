import {expect} from '@loopback/testlab';
import {AuthorizationContext, AuthorizationDecision} from '@loopback/authorization';
import {securityId} from '@loopback/security';

import {checkMaas} from '../../services';
import {Roles} from '../../utils';

describe('maas authorizor', () => {
  it('should checkMaas: OK ALLOW', async () => {
    const authContext: AuthorizationContext = {
      principals: [
        {
          [securityId]: 'id',
          id: 'id',
          emailVerified: true,
          clientName: 'maas',
          membership: ['membership'],
          roles: ['roles'],
        },
      ],
      roles: [],
      scopes: [],
      resource: '',
      invocationContext: null as any,
    };
    const result = await checkMaas(authContext, null as any);
    expect(result).to.deepEqual(AuthorizationDecision.ALLOW);
  });

  it('should checkMaas: OK DENY maas backend', async () => {
    const authContext: AuthorizationContext = {
      principals: [
        {
          [securityId]: 'id',
          id: 'id',
          emailVerified: true,
          clientName: undefined,
          membership: ['membership'],
          roles: [Roles.MAAS_BACKEND],
        },
      ],
      roles: [],
      scopes: [],
      resource: '',
      invocationContext: null as any,
    };
    const result = await checkMaas(authContext, null as any);
    expect(result).to.deepEqual(AuthorizationDecision.DENY);
  });

  it('should checkMaas: OK DENY maas', async () => {
    const authContext: AuthorizationContext = {
      principals: [
        {
          [securityId]: 'id',
          id: 'id',
          emailVerified: true,
          clientName: undefined,
          membership: ['membership'],
          roles: [Roles.MAAS],
        },
      ],
      roles: [],
      scopes: [],
      resource: '',
      invocationContext: null as any,
    };
    const result = await checkMaas(authContext, null as any);
    expect(result).to.deepEqual(AuthorizationDecision.DENY);
  });
});

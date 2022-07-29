import {expect} from '@loopback/testlab';
import {canAccessHisOwnData} from '../../services';
import {securityId} from '@loopback/security';
import {AuthorizationContext, AuthorizationDecision} from '@loopback/authorization';
import {InvocationContext} from '@loopback/core';

describe('user authorizor', () => {
  it('should canAccessHisOwnData: OK ALLOW', async () => {
    const authContext: AuthorizationContext = {
      principals: [
        {
          [securityId]: 'id',
          id: 'id',
          emailVerified: true,
          membership: ['membership'],
          roles: ['roles'],
        },
      ],
      roles: [],
      scopes: [],
      resource: '',
      invocationContext: {
        args: ['id'],
      } as InvocationContext,
    };
    const result = await canAccessHisOwnData(authContext, null as any);
    expect(result).to.deepEqual(AuthorizationDecision.ALLOW);
  });

  it('should checkMaas: OK DENY', async () => {
    const authContext: AuthorizationContext = {
      principals: [
        {
          [securityId]: 'id',
          id: 'id',
          emailVerified: true,
          maas: undefined,
          membership: ['membership'],
          roles: ['roles'],
        },
      ],
      roles: [],
      scopes: [],
      resource: '',
      invocationContext: {
        args: ['wrongId'],
      } as InvocationContext,
    };
    const result = await canAccessHisOwnData(authContext, null as any);
    expect(result).to.deepEqual(AuthorizationDecision.DENY);
  });
});

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

  it('should verifyToken: OK', async () => {
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
    const getResult = {
      data: {
        keys: [
          {
            kid: 'kid',
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            n: `t1xAo85zcjxtsR-bSLe47pAJwj8yW7DX5G6LC0DgUc649J8E_f7QLnFwFkqbntD_jLWngnWceo_HoNR1o-8BS2d8n
          dG__RKAu9nZof4qX8BV0WRbGQS85kSFfMlj9rW85kD_QZ-4FsP83Fzl4yCT868zRvarJyD3QSFRxVhueRwE5CtZWe
          7ycCPOzRPs_9XPUIkUIQd8Sk9JP7GB_3n27TEHl66ovSsC92f-7mJSwpX3EqD8jjlvyirTcxDOctGXA-ZoTMbGpZA
          gsGo-U6BZHrFop-6HyDoaMjDUV-lhIBTUkLz2Cge_8I4jUWix_5twPATZ4sitYfmS8eUzh4hggw`,
            e: 'AQAB',
            x5c: [
              `MIIClTCCAX0CBgGC9AA0ojANBgkqhkiG9w0BAQsFADAOMQwwCgYDVQQDDANtY20wHhcNMjIwODMxMTMwMjEwWhcNMz
        IwODMxMTMwMzUwWjAOMQwwCgYDVQQDDANtY20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC3XECjznNyP
        G2xH5tIt7jukAnCPzJbsNfkbosLQOBRzrj0nwT9/tAucXAWSpue0P+MtaeCdZx6j8eg1HWj7wFLZ3yd0b/9EoC72dmh
        /ipfwFXRZFsZBLzmRIV8yWP2tbzmQP9Bn7gWw/zcXOXjIJPzrzNG9qsnIPdBIVHFWG55HATkK1lZ7vJwI87NE+z/1c9
        QiRQhB3xKT0k/sYH/efbtMQeXrqi9KwL3Z/7uYlLClfcSoPyOOW/KKtNzEM5y0ZcD5mhMxsalkCCwaj5ToFkesWin7o
        fIOhoyMNRX6WEgFNSQvPYKB7/wjiNRaLH/m3A8BNniyK1h+ZLx5TOHiGCDAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAG
        7z4qy6KZYJwYvs8LveH5o9pah06T9Jd1fFTHVKCT0g6Ag8xaunccoFj6RLIFmOk5XsuXKp3lUMDOZR0utsLtoFU4mMdK
        19NdHl2a500DkW4ujk2pDYJlYqnAiVR4DJ4svyMCoLf1ubriZn6Ip6m1K9AZZw4d5jW/VitqVkwBY5DUYLJ0HNHZ242i
        /VClj80u4zun7d7gIRvkcHF4k3lK7DB0LvJEXj8ZL7ExuNeyUGbblvjFLSKx0nJCL2AjFloqBO971NCm06bVLok/pOy4
        df9KfboIyL7C8EEWhdxUQnEoQIX1zyS1yJb1PWhF2Ay6XPCzYVZMLhSFaHlCULhMk=`,
            ],
            x5t: 'dAgpup7prlDbyAnTLYuAdZYTGUg',
            'x5t#S256': 'DVtIRKD8VQPG0GFIfL0mvDbmO9k8PC2z32HdhaZBaa0',
          },
        ],
      },
    };
    const axiosGet = sinon.stub(axios, 'get').returns(getResult as any);
    const decodeStub = sinon.stub(jwt, 'decode').returns({header: {kid: 'kid'}} as any);

    const verifyStub = sinon.stub(jwt, 'verify').returns(userResult as any);
    const result = await authenticationService.verifyToken('token');
    expect(result).to.deepEqual(userResult);
    axiosGet.restore();
    verifyStub.restore();
    decodeStub.restore();
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

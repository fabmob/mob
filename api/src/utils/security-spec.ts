import {SecuritySchemeObject, ReferenceObject} from '@loopback/openapi-v3';
import {baseUrl, realmName} from '../constants';

export const SECURITY_SPEC_API_KEY = [{ApiKey: []}];
export const SECURITY_SPEC_API_KEY_KC_PASSWORD = [{ApiKey: [], KCPassword: []}];
export const SECURITY_SPEC_KC_PASSWORD = [{KCPassword: []}];
export const SECURITY_SPEC_KC_CREDENTIALS = [{KCCredentials: []}];
export const SECURITY_SPEC_JWT = [{JwtCredentials: []}];
export const SECURITY_SPEC_JWT_KC_CREDENTIALS = [{JwtCredentials: [], KCCredentials: []}];
export const SECURITY_SPEC_JWT_KC_PASSWORD = [{JwtCredentials: [], KCPassword: []}];
export const SECURITY_SPEC_KC_CREDENTIALS_KC_PASSWORD = [{KCCredentials: [], KCPassword: []}];
export const SECURITY_SPEC_JWT_KC_PASSWORD_KC_CREDENTIALS = [
  {JwtCredentials: [], KCPassword: [], KCCredentials: []},
];
export const SECURITY_SPEC_ALL = [{ApiKey: [], KCPassword: [], JwtCredentials: [], KCCredentials: []}];

export type SecuritySchemeObjects = {
  [securityScheme: string]: SecuritySchemeObject | ReferenceObject;
};

export const SECURITY_SCHEME_SPEC: SecuritySchemeObjects = {
  ApiKey: {
    type: 'apiKey',
    name: 'X-API-Key',
    in: 'header',
  },
  KCPassword: {
    type: 'oauth2',
    flows: {
      password: {
        tokenUrl: `${baseUrl}/realms/${realmName}/protocol/openid-connect/token`,
        scopes: {
          profile: 'OpenID Connect built-in scope: profile',
          'urn:cms:identity:read': 'OpenID Connect built-in scope: identity',
          email: 'OpenID Connect built-in scope: email',
          address: 'OpenID Connect built-in scope: address',
          'urn:cms:personal-information:read': 'OpenID Connect built-in scope: personal-information',
          phone: 'OpenID Connect built-in scope: phone',
          'urn:cms:fr-dgfip-information:read': 'OpenID Connect built-in scope: dgfip-information',
        },
      },
    },
  },
  KCCredentials: {
    type: 'oauth2',
    flows: {
      clientCredentials: {
        tokenUrl: `${baseUrl}/realms/${realmName}/protocol/openid-connect/token`,
        scopes: {},
      },
    },
  },
  JwtCredentials: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  },
};

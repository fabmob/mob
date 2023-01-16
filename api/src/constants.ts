import {Credentials} from 'keycloak-admin/lib/utils/auth';
import {InfoObject} from '@loopback/openapi-v3';

export const OPENAPI_CONFIG: InfoObject = {
  title: 'moB - Mon Compte Mobilité',
  version: `${process.env.PACKAGE_VERSION || '1.0.0'}`,
  contact: {
    email: 'mcm_admin@moncomptemobilite.org',
    name: 'Support technique',
  },
};

export const emailRegexp = '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$';

export const IDP_FQDN = process.env.IDP_FQDN
  ? `https://${process.env.IDP_FQDN}`
  : process.env.IDP_URL
  ? `${process.env.IDP_URL}`
  : `http://localhost:9000`;

export const WEBSITE_FQDN = process.env.WEBSITE_FQDN
  ? `https://${process.env.WEBSITE_FQDN}`
  : process.env.WEBSITE_URL
  ? `${process.env.WEBSITE_URL}`
  : 'http://localhost:8000';

export const API_FQDN = process.env.API_FQDN
  ? `https://${process.env.API_FQDN}`
  : process.env.API_URL
  ? `${process.env.API_URL}`
  : 'http://localhost:3000';

export const baseUrl = `${IDP_FQDN}/auth`;

export const realmName = 'mcm';

export const IDP_SUFFIX_CLIENT = 'client';

export const IDP_SUFFIX_BACKEND = 'backend';

export const IDP_SUFFIX = [IDP_SUFFIX_CLIENT, IDP_SUFFIX_BACKEND];

export const TAG_MAAS = 'MaaS';

export const credentials: Credentials = {
  grantType: 'client_credentials',
  clientId: 'api',
  clientSecret: process.env.CLIENT_SECRET_KEY_KEYCLOAK_API
    ? `${process.env.CLIENT_SECRET_KEY_KEYCLOAK_API}`
    : '${IDP_API_CLIENT_SECRET}',
};

export const datePattern = /^(0?[1-9]|[12][0-9]|3[01])[-/](0?[1-9]|1[012])[-/]\d{4}$/;

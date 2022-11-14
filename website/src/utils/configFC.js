import { environment } from '../environment';

const isBrowser = () => typeof window !== 'undefined';
const config = {
  ORIGIN_PATH: isBrowser() && window.location.origin,
  IDP_URL: `https://${environment.IDP_FQDN}`,
  IDP_PATH: '/auth/realms/mcm/protocol/openid-connect/auth',
  REDIRECT_PATH: '/redirection/',
};

export default config;

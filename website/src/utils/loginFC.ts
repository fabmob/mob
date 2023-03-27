import config from '@utils/configFC';
import querystring from 'query-string';

  const query = {
    client_id: `platform`,
    response_type: 'code',
    response_mode: 'fragment',
    login: 'true',
    redirect_uri: `${config.ORIGIN_PATH}${config.REDIRECT_PATH}`,
    kc_idp_hint: `franceconnect-particulier`,
  };
  const redirectionURL = `${config.IDP_URL}${
    config.IDP_PATH
  }?${querystring.stringify(query)}`;


export {
    query,
    redirectionURL,
}
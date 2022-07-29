import React, { useEffect, useState } from 'react';
import Keycloak, { KeycloakConfig, KeycloakInstance } from 'keycloak-js';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import { Loader } from '@components/Loader/Loader';

const onTokens = (tokens: any): void => {
  window.localStorage.setItem('token', tokens.token);
};

/**
 * Keycloak wrapping component
 * @param props
 * @constructor
 */
const KeycloakProviderInit: React.FC = ({ children }) => {
  const [keycloakInstance, setkeycloakInstance] = useState<KeycloakInstance>();

  // Fetching of keycloak config (keycloak.json) generated during CI/CD pipeline
  const fetchKeycloakConfig = async () => {
    const response = await fetch('/keycloak.json');
    const data: KeycloakConfig = await response.json();
    if (Object.keys(data).length !== 0) {
      const keycloak = Keycloak(data);
      setkeycloakInstance(keycloak);
    }
  };

  useEffect(() => {
    fetchKeycloakConfig();
  }, []);

  const initOptions = {
    pkceMethod: 'S256',
    onLoad: 'check-sso',
    promiseType: 'native',
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
  };

  if (keycloakInstance) {
    return (
      <ReactKeycloakProvider
        authClient={keycloakInstance as KeycloakInstance}
        initOptions={initOptions}
        onTokens={onTokens}
        LoadingComponent={<Loader />}
      >
        {children}
      </ReactKeycloakProvider>
    );
  }

  return <></>;
};

export default KeycloakProviderInit;

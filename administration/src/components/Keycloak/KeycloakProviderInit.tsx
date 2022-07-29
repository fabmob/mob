/* eslint-disable */
import React, { useEffect, useState } from 'react';
import Keycloak, { KeycloakConfig, KeycloakInstance } from 'keycloak-js';
import { ReactKeycloakProvider } from '@react-keycloak/web';

/**
 * Keycloak wrapping component
 * @param props
 * @constructor
 */
const KeycloakProviderInit: React.FC = ({ children }) => {
  // Keycloak configgenerated during CI/CD pipeline
  const [keycloakInstance, setkeycloakInstance] = useState<KeycloakInstance>();

  // Fetching of keycloak config (keycloak.json) generated during CI/CD pipeline
  const fetchKeycloakConfig = async () => {
    const response = await fetch('/keycloak.json');
    const KeycloakConfig = await response.json();
    const data: KeycloakConfig = await KeycloakConfig.keycloakConfig;
    if (Object.keys(data).length !== 0) {
      const keycloak = Keycloak(data);
      setkeycloakInstance(keycloak);
    }
  };

  useEffect(() => {
    fetchKeycloakConfig();
  }, []);

  const onTokens = (tokens: any): void => {
    window.localStorage.setItem('token', tokens.token);
  };
  if (keycloakInstance) {
    return (
      <ReactKeycloakProvider
        authClient={keycloakInstance as KeycloakInstance}
        initOptions={{ onLoad: 'login-required' }}
        onTokens={onTokens}
        LoadingComponent={<div>Chargement...</div>}
      >
        {children}
      </ReactKeycloakProvider>
    );
  }
  return <></>;
};

export default KeycloakProviderInit;

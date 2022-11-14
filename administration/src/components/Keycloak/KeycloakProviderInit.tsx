/* eslint-disable */
import React, { useEffect, useState } from 'react';
import Keycloak, { KeycloakConfig, KeycloakInstance } from 'keycloak-js';

import Loading from '../Loading/Loading';

interface IKeycloakContext {
  keycloak?: KeycloakInstance;
}

/**
 * Create Context
 */
export const KeycloakContext = React.createContext<
  IKeycloakContext | undefined
>(undefined);

/**
 * Keycloak wrapping component
 * @param props
 * @constructor
 */
const KeycloakProviderInit: React.FC = ({ children }) => {
  // Keycloak config generated during CI/CD pipeline
  const [keycloakInstance, setKeycloakInstance] = useState<KeycloakInstance>();
  const [isKCInit, setIsKCInit] = useState<boolean>(false);

  /**
   *  Fetching of keycloak config (keycloak.json) generated during CI/CD pipeline
   */
  const fetchKeycloakConfig = async () => {
    const response = await fetch('/keycloak.json');
    const KeycloakConfig = await response.json();
    const data: KeycloakConfig = await KeycloakConfig.keycloakConfig;
    if (Object.keys(data).length !== 0) {
      const keycloak = Keycloak(data);
      setKeycloakInstance(keycloak);
    }
  };

  /**
   * Initializes Keycloak instance and set the variable state if successfully initialized.
   */
  const initKeycloak = async () => {
    keycloakInstance
      ?.init({
        onLoad: 'login-required',
      })
      .then(() => {
        window.localStorage.setItem('token', keycloakInstance?.token!);
        setIsKCInit(true);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchKeycloakConfig();
  }, []);

  useEffect(() => {
    initKeycloak();
  }, [keycloakInstance]);

  useEffect(() => {
    /**
     * Call onTokenExpired when the access token is expired.
     * If a refresh token is available, the token can be refreshed via the OAuth RefreshToken
     * In order to transmit it on each call to the API.
     * Otherwise logout the user.
     */
    if (keycloakInstance) {
      keycloakInstance!.onTokenExpired = () => {
        keycloakInstance
          ?.updateToken(5)
          .then(() => {
            window.localStorage.setItem('token', keycloakInstance?.token!);
          })
          .catch(() => {
            console.error('Failed to refresh token | the session is expired');
            keycloakInstance.logout();
          });
      };
    }
  }, [keycloakInstance]);

  return (
    <KeycloakContext.Provider
      value={{
        keycloak: keycloakInstance,
      }}
    >
      {isKCInit ? children : <Loading />}
    </KeycloakContext.Provider>
  );
};

/**
 * useSession custom hook to get the provided values from KeycloakContext
 */
const useSession = () => {
  const keycloakContext = React.useContext(KeycloakContext);
  if (keycloakContext === undefined) {
    throw new Error('useSession must be used within a KeycloakProvider');
  }

  return keycloakContext;
};

export { KeycloakProviderInit, useSession };

import React, { useEffect, useState } from 'react';
import { KeycloakConfig, KeycloakInstance } from 'keycloak-js';
import { Loader } from '@components/Loader/Loader';

export const Keycloak =
  typeof window !== 'undefined' ? require('keycloak-js') : null;

interface IKeycloakContext {
  keycloak?: KeycloakInstance;
  isKCInit: boolean;
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
 */
export const KeycloakProvider: React.FC = ({ children }) => {
  const [keycloakInstance, setKeycloakInstance] = useState<KeycloakInstance>();
  const [isKCInit, setIsKCInit] = useState<boolean>(false);

  /**
   * Fetching of keycloak config (keycloak.json)
   */
  const fetchKeycloakConfig = async () => {
    const response = await fetch('/keycloak.json');
    const data: KeycloakConfig = await response.json();

    if (Object.keys(data).length !== 0) {
      const keycloak = Keycloak(data);
      setKeycloakInstance(keycloak);
    }
  };

  /**
   * Initializes Keycloak instance and set the variable state if successfully initialized.
   */
  const initKeycloak = () => {
    keycloakInstance
      ?.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256',
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
        isKCInit,
      }}
    >
      {isKCInit ? children : <Loader />}
    </KeycloakContext.Provider>
  );
};

/**
 * useSession custom hook to get the provided values from KeycloakContext
 */
export const useSession = () => {
  const keycloakContext = React.useContext(KeycloakContext);
  if (keycloakContext === undefined) {
    throw new Error('useSession must be used within a KeycloakProvider');
  }

  return keycloakContext;
};

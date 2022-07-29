import React, { useEffect, useState } from 'react';
import { navigate } from 'gatsby';
import { AuthorizationRoute } from '@modules/routes';
import queryString from 'query-string';
import ProcessSubscription from '@modules/subscription/ProcessSubscription';
import { useKeycloak } from '@react-keycloak/web';

const Subscriptions = ({ location }) => {
  const [queryParams] = useState(queryString.parse(location?.search)),
    [isConnected, setIsConnect] = useState(false),
    { keycloak, initialized } = useKeycloak();
  const [isCitizen, setIsCitizen] = useState(false);

  useEffect(() => {
    if (
      keycloak &&
      keycloak?.tokenParsed &&
      keycloak?.tokenParsed?.membership &&
      keycloak?.tokenParsed?.membership?.includes('/citoyens')
    ) {
      setIsCitizen(true);
    }
  }, [keycloak]);

  useEffect(() => {
    if (keycloak && initialized) {
      if (!keycloak.authenticated) {
        keycloak.login({
          redirectUri: `${window.location.href}`,
        });
      } else {
        setIsConnect(true);
      }
    }
  }, []);

  /**
   * redirect to home page if citizen doesn't have permission
   * to access the incentive's detail
   */
  useEffect(() => {
    if (isConnected && !isCitizen) {
      navigate('/');
    }
  }, [isConnected, isCitizen]);

  return (
    <div>
      {!isConnected || (isConnected && !isCitizen) ? (
        <div>Loading ....</div>
      ) : (
        <AuthorizationRoute
          component={
            <ProcessSubscription query={queryParams} location={location} />
          }
          authenticatedOnly
        />
      )}
    </div>
  );
};

export default Subscriptions;

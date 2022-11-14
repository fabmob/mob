import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { getUserProfileById } from '@api/UserFunderService';
import { UserFunder } from '@api/UserFunderService';
import { getCitizenById } from '@api/CitizenService';

import { Loader } from '@components/Loader/Loader';

import {
  isFunder,
  getIsCitizen,
  isContentEditor,
  useFromFranceConnect,
} from '@utils/keycloakUtils';
import { Citizen } from '@utils/citoyens';

import { useSession } from './KeycloakProvider';

interface IUserContext {
  citizen?: Citizen;
  userFunder?: UserFunder;
  authenticated: boolean;
  refetchCitizen: () => void;
  refetchUserFunder: () => void;
}
export const UserContext = React.createContext<IUserContext | undefined>(
  undefined
);

export const UserProvider: React.FC = ({ children }) => {
  const { keycloak } = useSession();
  const [loading, setLoading] = useState<boolean | undefined>(
    !isContentEditor() && keycloak?.authenticated
  );
  const isCitizen = getIsCitizen();
  const isFromFranceConnect = useFromFranceConnect();

  const {
    data: userFunder,
    error: userFunderError,
    refetch: refetchUserFunder,
  } = useQuery<UserFunder>(
    'getUserFunder',
    () => getUserProfileById(keycloak?.tokenParsed?.sub),
    {
      enabled:
        keycloak?.authenticated && isFunder() && !!keycloak.tokenParsed?.sub,
    }
  );

  const {
    data: citizen,
    error: citizenError,
    refetch: refetchCitizen,
  } = useQuery<Citizen>(
    'getCitizen',
    () => getCitizenById(keycloak?.tokenParsed?.sub),
    {
      enabled:
        keycloak?.authenticated && isCitizen && !!keycloak?.tokenParsed?.sub,
    }
  );

  useEffect(() => {
    if (
      !keycloak?.authenticated ||
      (keycloak?.authenticated && isFromFranceConnect && !isCitizen)
    ) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading && (userFunder || citizen)) {
      setLoading(false);
    }
  }, [userFunder, citizen]);

  useEffect(() => {
    if (loading && (userFunderError || citizenError)) {
      setLoading(false);
    }
  }, [userFunderError, citizenError]);

  return (
    <UserContext.Provider
      value={{
        citizen,
        userFunder,
        authenticated: keycloak?.authenticated!,
        refetchCitizen,
        refetchUserFunder,
      }}
    >
      {loading ? <Loader /> : children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const userContext = React.useContext(UserContext);
  if (userContext === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return userContext;
};

import { useKeycloak } from '@react-keycloak/web';
import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { isFunder, isCitizen, isContentEditor } from '@utils/keycloakUtils';
import { getUserProfileById } from '@api/UserFunderService';
import { UserFunder } from '@api/UserFunderService';
import { Citizen } from '@utils/citoyens';
import { getCitizenById } from '@api/CitizenService';
import { Loader } from '@components/Loader/Loader';

interface IUserContext {
  citizen?: Citizen;
  userFunder?: UserFunder;
  authenticated: boolean;
  refetchCitizen: () => void;
  refetchUserFunder: () => void;
}
export const UserContext =
  React.createContext<IUserContext | undefined>(undefined);

export const UserProvider: React.FC = ({ children }) => {
  const { keycloak } = useKeycloak();
  const [loading, setLoading] = useState<boolean>(!isContentEditor());

  const {
    data: userFunder,
    error: userFunderError,
    refetch: refetchUserFunder,
  } = useQuery<UserFunder>(
    'getUserFunder',
    () => getUserProfileById(keycloak.tokenParsed?.sub),
    {
      enabled:
        keycloak.authenticated && isFunder() && !!keycloak.tokenParsed?.sub,
    }
  );
  const {
    data: citizen,
    error: citizenError,
    refetch: refetchCitizen,
  } = useQuery<Citizen>(
    'getCitizen',
    () => getCitizenById(keycloak.tokenParsed?.sub),
    {
      enabled:
        keycloak.authenticated && isCitizen() && !!keycloak.tokenParsed?.sub,
    }
  );

  useEffect(() => {
    if (!keycloak.authenticated) {
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

  if (loading) return <Loader />;

  return (
    <UserContext.Provider
      value={{
        citizen,
        userFunder,
        authenticated: keycloak.authenticated!,
        refetchCitizen,
        refetchUserFunder,
      }}
    >
      {children}
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

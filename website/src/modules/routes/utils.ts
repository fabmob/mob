import { useSession } from '../../context';

function isAuthorized(roles?: string[]) {
  const { keycloak } = useSession();
  if (keycloak && roles) {
    return roles.some((r) => {
      const realm = keycloak.hasRealmRole(r);
      const resource = keycloak.hasResourceRole(r);
      return realm || resource;
    });
  }
  return isAuthenticated();
}

function isAuthenticated() {
  const { isKCInit, keycloak } = useSession();
  return isKCInit && keycloak?.authenticated;
}

function checkRoles(roles?: string[]): boolean {
  const { keycloak } = useSession();
  if (!keycloak || !roles?.length) {
    return false;
  }
  return roles.some((r) => {
    const realm = keycloak.hasRealmRole(r);
    const resource = keycloak.hasResourceRole(r);
    return realm || resource;
  });
}

function checkIfCitizen(): boolean {
  const { keycloak } = useSession();
  return !!keycloak?.tokenParsed?.membership?.includes('/citoyens');
}

export { isAuthorized, checkRoles, isAuthenticated, checkIfCitizen };

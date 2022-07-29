import { useKeycloak } from '@react-keycloak/web';

function isAuthorized(roles?: string[]) {
  const { keycloak } = useKeycloak();
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
  const { initialized, keycloak } = useKeycloak();
  return initialized && keycloak.authenticated;
}

function checkRoles(roles?: string[]): boolean {
  const { keycloak } = useKeycloak();
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
  const { keycloak } = useKeycloak();
  return !!keycloak?.tokenParsed?.membership?.includes('/citoyens');
}

export { isAuthorized, isAuthenticated, checkRoles, checkIfCitizen };

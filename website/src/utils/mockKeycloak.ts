const mockUserKeycloakNotAuthenticated = {
  initialized: false,
  keycloak: { authenticated: false },
};

const userProfile = {
  username: 'test',
  email: 'test@testdomain.com',
  firstName: 'Test',
  lastName: 'User',
};

const token = 'A random string that is non zero length';
const realmAccess = {
  roles: ['admin', 'auditor', 'user', 'financeurs', 'citoyens'],
};

const authClient = {
  authenticated: true,
  subject: 'user_id',
  idTokenParsed: { sub: 'idUser' },
  hasRealmRole(role) {
    return realmAccess.roles.includes(role);
  },
  hasResourceRole(role) {
    return realmAccess.roles.includes(role);
  },
  idToken: token,
  tokenParsed: { membership: ['/collectivités/randomfunder'], sub: 'azea' },
  initialized: true,
  loadUserProfile: () => true,
  login: () => true,
  logout: () => false,
  clearToken: () => false,
  profile: userProfile,
  realm: 'DemoRealm',
  realmAccess,
  refreshToken: token,
  token,
};

const mockUseKeycloak = { initialized: true, keycloak: authClient };

export { mockUserKeycloakNotAuthenticated, mockUseKeycloak };

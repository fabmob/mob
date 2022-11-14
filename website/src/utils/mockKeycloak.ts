const mockUserKeycloakNotAuthenticated = {
  isKCInit: false,
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
  tokenParsed: {
    membership: ['/collectivités/randomfunder'],
    sub: 'azea',
    family_name: 'lastName',
    given_name: 'firstName',
    email: 'a@b.com',
    gender: 'male',
    birthdate: '2022-08-18',
  },
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

const authYoungClient = {
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
  tokenParsed: {
    membership: ['/collectivités/randomfunder'],
    sub: 'azea',
    family_name: 'lastName',
    given_name: 'firstName',
    email: 'a@b.com',
    gender: 'male',
    birthdate: '1992-08-18',
  },
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

const mockUseKeycloak = { isKCInit: true, keycloak: authClient };

const mockUseKeycloakYoungUser = { isKCInit: true, keycloak: authYoungClient };

export {
  mockUserKeycloakNotAuthenticated,
  mockUseKeycloak,
  mockUseKeycloakYoungUser,
};

import { navigate } from 'gatsby';
import { KeycloakLoginOptions, KeycloakLogoutOptions } from 'keycloak-js';

function mockUseKeycloak() {
  const token = 'A random string that is non zero length';
  const userProfile = {
    username: 'test',
    email: 'test@testdomain.com',
    firstName: 'Test',
    lastName: 'User',
  };
  const realmAccess = { roles: ['admin', 'auditor', 'user', 'financeurs'] };

  const authClient = {
    authenticated: true,
    subject: 'user_id',
    hasRealmRole(role) {
      return realmAccess.roles.includes(role);
    },
    hasResourceRole(role) {
      return realmAccess.roles.includes(role);
    },
    idToken: token,
    initialized: true,
    loadUserProfile() {
      return Promise.resolve({ userProfile });
    },
    login(options: KeycloakLoginOptions) {
      if (options.redirectUri) {
        navigate(options.redirectUri);
      } else {
        navigate('/');
      }
    },
    logout(options: KeycloakLogoutOptions) {
      if (options?.redirectUri) {
        navigate(options.redirectUri);
      } else {
        navigate('/');
      }
    },
    profile: userProfile,
    realm: 'DemoRealm',
    realmAccess,
    refreshToken: token,
    token,
  };
  return { initialized: true, keycloak: authClient };
}

function mockUserKeycloakNotAuthenticated() {
  const mock = mockUseKeycloak();
  mock.keycloak.authenticated = false;
  return mock;
}

export { mockUserKeycloakNotAuthenticated, mockUseKeycloak };

type Props = {
  authenticated?: boolean;
  realmRoles?: string[];
  ressourceRoles?: string[];
};

export function mockUseKeycloak(props?: Props) {
  const token = 'A random string that is non zero length';
  const userProfile = {
    username: 'test',
    email: 'test@testdomain.com',
    firstName: 'Test',
    lastName: 'User',
  };

  let realmAccess = { roles: ['admin', 'auditor', 'user'] };
  if (props && props.realmRoles && props.realmRoles.length > 0) {
    realmAccess = { roles: realmAccess.roles.concat(props.realmRoles) };
  }

  let ressourceAccess = { roles: ['user'] };
  if (props && props.ressourceRoles && props.ressourceRoles.length > 0) {
    ressourceAccess = {
      roles: ressourceAccess.roles.concat(props.ressourceRoles),
    };
  }

  let authenticated = (props && props.authenticated) || false;

  const authClient = {
    authenticated: authenticated,
    subject: 'user_id',
    hasRealmRole(role: string) {
      return !!realmAccess && realmAccess.roles.indexOf(role) >= 0;
    },
    hasResourceRole(role: string) {
      return !!ressourceAccess && ressourceAccess.roles.indexOf(role) >= 0;
    },
    idToken: token,
    initialized: true,
    loadUserProfile() {
      return Promise.resolve({ userProfile });
    },
    login() {
      authenticated = true;
    },
    logout() {
      authenticated = false;
    },
    profile: userProfile,
    realm: 'DemoRealm',
    realmAccess,
    refreshToken: token,
    token,
  };
  return { isKCInit: true, keycloak: authClient };
}

import { navigate } from 'gatsby';

import {
  checkRoles,
  isAuthenticated,
  isAuthorized,
  checkIfCitizen,
} from './utils';
import { browser } from '@utils/helpers';

interface AuthorizationRouteProps {
  /** The component to render if user have the rights. */
  component: JSX.Element;
  /** Path use by reach/router. Doesn't used in this function by needed for reach/router. */
  path?: string;
  /** The path to redirect user if he doesn't have right to access the path. */
  redirectNoAccess?: string;
  /** List of allowed roles */
  allowedRoles?: string[];
  /** List of forbidden roles */
  forbiddenRoles?: string[];
  /** only allow authenticated users */
  authenticatedOnly: boolean;
  /** only allow authenticated Citizen */
  authenticatedCitizenOnly?: boolean;
  /** only allow unauthenticated users */
  publicOnly?: boolean;
}

/**
 * @name AuthorizationRoute
 * @description Function that handles whether or not the user is allowed to access a path by checking roles.
 * @example
 * <AuthorizationRoute
 *   path="/my-path"
 *   allowedRoles=['role1', 'role2']
 *   forbiddenRoles=['role3']
 *   authenticatedOnly={true}
 *   component={<MyPrivateComponent />}
 *   redirectNoAccess='my-redirect-path'
 * />
 */
const AuthorizationRoute = ({
  component,
  redirectNoAccess,
  allowedRoles,
  forbiddenRoles,
  authenticatedOnly = false,
  publicOnly = false,
  authenticatedCitizenOnly = false,
}: AuthorizationRouteProps) => {
  if (
    browser &&
    authenticatedCitizenOnly &&
    (!isAuthenticated() || !checkIfCitizen())
  ) {
    navigate(redirectNoAccess || '/');
    return null;
  }

  if (browser && forbiddenRoles?.length && checkRoles(forbiddenRoles)) {
    navigate(redirectNoAccess || '/');
    return null;
  }

  if (browser && allowedRoles?.length && !checkRoles(allowedRoles)) {
    navigate(redirectNoAccess || '/');
    return null;
  }

  if (publicOnly && isAuthenticated()) {
    navigate(redirectNoAccess || '/');
    return null;
  }

  if (browser && authenticatedOnly && !isAuthorized(allowedRoles)) {
    navigate(redirectNoAccess || '/');
    return null;
  }

  return component;
};

export default AuthorizationRoute;

import React from 'react';
import './AccessRole.css';
import { useKeycloak } from '@react-keycloak/web';

/**
 * Controle access role component
 * @param props
 * @constructor
 */
const AccessRole: React.FC = ({ children }) => {
  const { keycloak } = useKeycloak();

  if (
    keycloak &&
    keycloak.realmAccess &&
    keycloak.realmAccess.roles.includes(
      `${process.env.REACT_APP_ADMIN_ACCES_ROLE_EXT || 'content_editor'}`
    )
  ) {
    return <>{children}</>;
  }
  keycloak.logout();
  return (
    <p className="no-admin">Vous n êtes pas habilité.e à accéder à ce site</p>
  );
};

export default AccessRole;

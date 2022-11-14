/* eslint-disable */
import * as React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import ExitIcon from '@material-ui/icons/PowerSettingsNew';

import { useSession } from '../Keycloak/KeycloakProviderInit';

const LogoutButton: React.FC = () => {
  const { keycloak } = useSession();

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const handleClick = () => {
    keycloak.logout();
  };

  return (
    <MenuItem onClick={handleClick}>
      <ExitIcon /> Logout
    </MenuItem>
  );
};

export default LogoutButton;

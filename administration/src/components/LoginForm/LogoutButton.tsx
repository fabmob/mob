/* eslint-disable */
import * as React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import ExitIcon from '@material-ui/icons/PowerSettingsNew';

import { useKeycloak } from '@react-keycloak/web';

const LogoutButton: React.FC = () => {
  const { keycloak } = useKeycloak();

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

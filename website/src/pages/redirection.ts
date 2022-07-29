import { navigate } from 'gatsby';

import { useRoleAccepted } from '@utils/keycloakUtils';
import { browser } from '@utils/helpers';

import { Roles } from '../constants';

const IndexPage = () => {
  if (browser) {
    const isSupervisor = useRoleAccepted(Roles.SUPERVISORS);
    const isManager = useRoleAccepted(Roles.MANAGERS);
    isSupervisor || isManager
      ? navigate('/mon-dashboard')
      : navigate('/mon-profil');
  }
  return null;
};

export default IndexPage;

import { navigate } from 'gatsby';

import { useRoleAccepted, useFromFranceConnect } from '@utils/keycloakUtils';
import { browser } from '@utils/helpers';

import { Roles } from '../constants';
import { COMPLETION_ROUTE } from '../modules/inscription/constants';

const IndexPage = () => {
  if (browser) {
    const isSupervisor = useRoleAccepted(Roles.SUPERVISORS);
    const isManager = useRoleAccepted(Roles.MANAGERS);
    const isCitizen = useRoleAccepted(Roles.CITIZENS);
    const isFromFranceConnect = useFromFranceConnect();

    isSupervisor || isManager
      ? navigate('/mon-dashboard')
      : isFromFranceConnect && !isCitizen
      ? navigate(COMPLETION_ROUTE)
      : navigate('/recherche');
  }
  return null;
};

export default IndexPage;

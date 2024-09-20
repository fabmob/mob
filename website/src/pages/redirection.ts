import { navigate } from 'gatsby';

import { useRoleAccepted } from '@utils/keycloakUtils';
import { browser } from '@utils/helpers';
import { useSession, useUser } from '../context';
import { requestCitizenAutoAffiliation } from '@api/CitizenService';
import { useQueryParam, StringParam } from 'use-query-params';

import { Roles } from '../constants';

const IndexPage = () => {
  // TODO: adding useUser and useQueryParams might have an effect on performances
  // This might be important for a page that is only supposed to redirect users
  // Maybe there is a way to be smarter and only check userContext if autoaffiliate param is present ?
  const { citizen, userFunder, refetchCitizen } = useUser();
  const [entrepriseId] = useQueryParam('autoaffiliate', StringParam);

  if (browser) {
    if (entrepriseId && citizen) {
      requestCitizenAutoAffiliation(citizen.id, entrepriseId).then(() => {
        refetchCitizen()
        navigate('/recherche/?tab=AideEmployeur')
      })
    } else {
      const isSupervisor = useRoleAccepted(Roles.SUPERVISORS);
      const isManager = useRoleAccepted(Roles.MANAGERS);
  
      isSupervisor || isManager
        ? navigate('/mon-dashboard')
        : navigate('/recherche');
    }
  }
  return null;
};

export default IndexPage;

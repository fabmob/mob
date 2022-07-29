import React from 'react';
import { Router as MyRouter } from '@reach/router';

import { AuthorizationRoute } from '@modules/routes';
import {
  InscriptionPageForm,
  InscriptionPageIndisponible,
  InscriptionPageAffiliation,
} from '../../modules/inscription';
import {
  INSCRIPTION_ROUTE,
  INSCRIPTION_INDISPONIBLE_ROUTE,
  INSCRIPTION_ERROR_ROUTE,
  INSCRIPTION_AFFILIATION_ROUTE,
} from '../../modules/inscription/constants';
import NotFoundPage from '../404';

const InscriptionIndex = () => {
  return (
    <MyRouter>
      <NotFoundPage default />
      <AuthorizationRoute
        path={INSCRIPTION_INDISPONIBLE_ROUTE}
        component={<InscriptionPageIndisponible />}
        publicOnly
      />
      <InscriptionPageAffiliation path={INSCRIPTION_AFFILIATION_ROUTE} />
      <AuthorizationRoute
        path={INSCRIPTION_ROUTE}
        component={<InscriptionPageForm />}
        redirectNoAccess={INSCRIPTION_ERROR_ROUTE}
        publicOnly
      />
    </MyRouter>
  );
};

export default InscriptionIndex;

import React, { FC } from 'react';
import { PageProps } from 'gatsby';
import { Router } from '@reach/router';

import { AuthorizationRoute } from '@modules/routes';
import AdministrerDemandes from '@modules/mon-dashboard/pages/administrer-demandes';
import ProcessRequest from '@modules/request';

import { Roles } from '../../constants';

interface Props extends PageProps {
  pageContext: { breadcrumb: { crumbs: string } };
}

const AdministrerDemandesPrivate: FC<Props> = ({ pageContext, location }) => {
  return (
    <Router basepath="/administrer-demandes">
      <AuthorizationRoute
        component={<AdministrerDemandes pageContext={pageContext} />}
        allowedRoles={[Roles.MANAGERS]}
        path="/"
        authenticatedOnly
      />
      <AuthorizationRoute
        component={
          <Router>
            <ProcessRequest
              location={location}
              pageContext={pageContext}
              path="/:subscriptionId"
            />
          </Router>
        }
        allowedRoles={[Roles.MANAGERS]}
        default
        authenticatedOnly
      />
    </Router>
  );
};

export default AdministrerDemandesPrivate;

import React, { FC } from 'react';
import { PageProps } from 'gatsby';
import { Router } from '@reach/router';

import { AuthorizationRoute } from '@modules/routes';
import ManageCitizens from '@modules/mon-dashboard/pages/ManageCitizens/ManageCitizens';
import CitizenSubscriptions from '@modules/citizenSubscriptions/CitizenSubscriptions';

import { Roles } from '../../constants';

interface Props extends PageProps {
  pageContext: { breadcrumb: { crumbs: string } };
}

const ManageCitizensPrivate: FC<Props> = ({ pageContext, location }) => {
  return (
    <Router basepath="/gerer-citoyens">
      <AuthorizationRoute
        component={<ManageCitizens pageContext={pageContext} />}
        allowedRoles={[Roles.SUPERVISORS, Roles.MANAGERS]}
        path="/"
        authenticatedOnly
      />
      <AuthorizationRoute
        component={
          <Router>
            <CitizenSubscriptions
              path="/:citizenId"
              pageContext={pageContext}
              location={location}
            />
          </Router>
        }
        allowedRoles={[Roles.MANAGERS]}
        default
        authenticatedonly
      />
    </Router>
  );
};

export default ManageCitizensPrivate;

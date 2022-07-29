import React, { FC } from 'react';
import { PageProps } from 'gatsby';
import { Router } from '@reach/router';
import { AuthorizationRoute } from '@modules/routes';

import GererSalaries from '@modules/mon-dashboard/pages/GererSalaries/gererSalaries';
import CitizenSubscriptions from '@modules/citizenSubscriptions/CitizenSubscriptions';

import { Roles } from '../../constants';

interface Props extends PageProps {
  pageContext: { breadcrumb: { crumbs: string } };
}

const GererSalariesPrivate: FC<Props> = ({ pageContext, location }) => {
  return (
    <Router basepath="/gerer-salaries">
      <AuthorizationRoute
        location={location}
        component={<GererSalaries pageContext={pageContext} />}
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
        authenticatedOnly
      />
    </Router>
  );
};

export default GererSalariesPrivate;

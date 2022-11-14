import React, { FC } from 'react';
import { PageProps } from 'gatsby';
import MonDashboardPage from '@modules/mon-dashboard/pages/mon-dashboard';
import CitizenDashboardPage from '@modules/mon-dashboard/pages/citizen-dashboard';
import { checkIfCitizen } from '@modules/routes/utils';
import { AuthorizationRoute } from '@modules/routes';

import { Roles } from '../constants';

const MonDashboardPagePrivate: FC<PageProps> = ({ pageContext }) => {
  return (
    <>
      {checkIfCitizen() ? (
        <AuthorizationRoute
          component={<CitizenDashboardPage pageContext={pageContext} />}
          allowedRoles={[Roles.CITIZENS]}
          authenticatedOnly
        />
      ) : (
        <AuthorizationRoute
          component={<MonDashboardPage pageContext={pageContext} />}
          allowedRoles={[Roles.SUPERVISORS, Roles.MANAGERS]}
          authenticatedOnly
        />
      )}
    </>
  );
};

export default MonDashboardPagePrivate;

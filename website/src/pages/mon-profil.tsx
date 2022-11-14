import React, { FC } from 'react';

import Profile from '@components/Profile/Profile';
import { AuthorizationRoute } from '@modules/routes';
import { Roles } from '../constants';

interface PersonalDataInfosProps {
  pageContext: { breadcrumb: { crumbs: string } };
}

const MonProfil: FC<PersonalDataInfosProps> = ({ pageContext }) => (
  <AuthorizationRoute
    path="/mon-profil"
    component={<Profile crumbs={pageContext.breadcrumb.crumbs} />}
    allowedRoles={[Roles.SUPERVISORS, Roles.MANAGERS, Roles.CITIZENS]}
    authenticatedOnly
  />
);

export default MonProfil;

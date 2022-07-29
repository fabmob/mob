import { Link } from 'gatsby';
import React, { ReactElement } from 'react';
import { isAuthenticated } from '@modules/routes/utils';
import Strings from './locale/fr.json';

export const renderProfileLink = (): ReactElement => {
  if (isAuthenticated()) {
    return (
      <Link
        id="affiliation-mon-profil"
        className="link-in-text"
        to="/mon-profil"
        title="Voir mon profil"
      >
        {Strings['affiliation.profile']}
      </Link>
    );
  }
  return <>{`'${Strings['affiliation.profile']}'`}</>;
};

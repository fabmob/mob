import React, { FC } from 'react';

import Button from '@components/Button/Button';

import { useSession } from '../../../../context';

import Strings from '../../locale/fr.json';
import { navigate } from 'gatsby';
import { INCENTIVE_TYPE } from '../../../../utils/demandes';

const AffiliateSuccessMessage: FC = () => {
  const { isKCInit, keycloak } = useSession();

  return (
    <>
      <p className="headline mb-xs">
        <span className="special">{Strings['affiliation.success']}</span>
      </p>
      <p className="mb-s">{Strings['affiliation.success.action']}</p>
      {isKCInit && !keycloak?.authenticated && (
        <Button
          onClick={() =>
            keycloak?.login({
              redirectUri: `${window.location.origin}/redirection/`,
            })
          }
        >
          {Strings['affiliation.success.button']}
        </Button>
      )}
      {isKCInit && keycloak?.authenticated && (
        // User is logged in, invite them to go to incentives page
        <Button onClick={() => navigate("/recherche?tab=" + INCENTIVE_TYPE.EMPLOYER_INCENTIVE)}>
          {Strings['affiliation.success.button.incentives']}
        </Button>
      )}
    </>
  );
};

export default AffiliateSuccessMessage;

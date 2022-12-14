import React, { FC } from 'react';

import Button from '@components/Button/Button';

import { useSession } from '../../../../context';

import Strings from '../../locale/fr.json';

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
    </>
  );
};

export default AffiliateSuccessMessage;

import React, { FC } from 'react';
import { useKeycloak } from '@react-keycloak/web';

import ArrowLink from '@components/ArrowLink/ArrowLink';
import Card from '@components/Card/Card';

import Strings from './locale/fr.json';

const AideSearchGreenCard: FC = () => {
  const { keycloak } = useKeycloak();
  return (
    <Card
      id="redirect-login-aide-page"
      buttonMode
      onClick={() =>
        keycloak.login({
          redirectUri: `${window.location.origin}/redirection/`,
        })
      }
      title={Strings['card.title']}
      footerElement={<ArrowLink label={Strings['icon.label']} />}
      classNames="mcm-card--green mcm-card--pointer"
    />
  );
};

export default AideSearchGreenCard;

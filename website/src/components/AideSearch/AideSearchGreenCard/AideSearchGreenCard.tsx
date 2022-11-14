import React, { FC } from 'react';

import ArrowLink from '@components/ArrowLink/ArrowLink';
import Card from '@components/Card/Card';

import { AffiliationStatus } from '../../../../src/constants';
import { useSession, useUser } from '../../../context';
import { navigate } from '@reach/router';

import Strings from './locale/fr.json';

const AideSearchGreenCard: FC = () => {
  /**
   * APP CONTEXT
   *
   */
  const { citizen, authenticated } = useUser();
  const { keycloak } = useSession();

  /**
   *
   * isAffiliated condition
   */
  const isAffiliated: boolean =
    authenticated &&
    citizen?.affiliation?.affiliationStatus !== AffiliationStatus.AFFILIATED;

  return (
    <Card
      id="redirect-login-aide-page"
      buttonMode
      onClick={() =>
        isAffiliated
          ? navigate('/mon-profil/', { replace: true })
          : keycloak.login({
              redirectUri: `${window.location.origin}/redirection/`,
            })
      }
      title={
        isAffiliated ? Strings['card.employee.title'] : Strings['card.title']
      }
      footerElement={
        <ArrowLink
          label={
            isAffiliated
              ? Strings['icon.employee.label']
              : Strings['icon.label']
          }
        />
      }
      classNames="mcm-card--green mcm-card--pointer"
    />
  );
};

export default AideSearchGreenCard;

import React, { FC } from 'react';

import Card from '@components/Card/Card';

import { AffiliationStatus } from '../../../../src/constants';
import { useSession, useUser } from '../../../context';
import { navigate } from '@reach/router';

import Strings from './locale/fr.json';

const AideSearchGreenCard: FC = () => {

  const { citizen, authenticated } = useUser();
  const { keycloak } = useSession();

  const isAffiliated: boolean =
    citizen?.affiliation?.status === AffiliationStatus.AFFILIATED;

  const hasPostalCodeAndCity: boolean =
    citizen?.postcode && citizen?.city;

  const renderValueElement: FC<any> = (values: string[]) => {
    return (
      <ul>
        {values.map((value: string, index: number) => {
          return <li key={index}>{value}</li>
        })}
      </ul>
    )
  }

  const handleText: Function = (): { title: string, values?: string[] } => {
    if (authenticated) {
      if (!isAffiliated && !hasPostalCodeAndCity) {
        return {
          title: Strings['card.connected.notAffiliated.noProfileInfo.title'],
          values: [Strings['card.connected.notAffiliated.noProfileInfo.value1'], Strings['card.connected.notAffiliated.noProfileInfo.value2']]
        }
      }
      if (isAffiliated && !hasPostalCodeAndCity) {
        return {
          title: Strings['card.connected.affiliated.noProfileInfo.title'],
        }
      }
      if (!isAffiliated && hasPostalCodeAndCity) {
        return {
          title: Strings['card.connected.notAffiliated.hasProfileInfo.title'],
        }
      }
    }
    return {
      title: Strings['card.not.connected.title'],
      values: [Strings['card.not.connected.value1'], Strings['card.not.connected.value2']]
    }
  }

  const text: { title: string, values?: string } = handleText();

  return (
    <Card
      id="redirect-login-aide-page"
      buttonMode
      onClick={() =>
        authenticated
          ? navigate('/mon-profil/', { replace: true })
          : keycloak.login({
            redirectUri: `${window.location.origin}/redirection/`,
          })
      }
      title={
        text.title
      }
      valueElement={
        text.values && renderValueElement(text.values)
      }
      footerElement={
        <span>{authenticated
          ? Strings['icon.connected.label']
          : Strings['icon.label']}</span>
      }
      classNames="mcm-card--green mcm-card--pointer"
    />
  );
};

export default AideSearchGreenCard;

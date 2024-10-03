import React, { FC, useEffect } from 'react';
import { RouteComponentProps } from '@reach/router';
import { navigate } from 'gatsby';
import { useQueryParam, StringParam } from 'use-query-params';
import { useQuery } from 'react-query';
import jwt from 'jwt-decode';

import Layout from '@components/Layout/Layout';
import Image from '@components/Image/Image';
import Button from '@components/Button/Button';
import Heading from '@components/Heading/Heading';

import {
  LetterM,
  AffiliateSuccessMessage,
  AffiliateActivationMessage,
  AffiliateFailedMessage,
  AffiliateAlreadyExistsMessage,
} from '../components';

import { requestCitizenAffiliation } from '@api/CitizenService';

import { StatusCode } from '@utils/https';
import { matomoTrackEvent } from '@utils/matomo';
import { useMatomo } from '@datapunt/matomo-tracker-react';

import { useUser } from '../../../context';
import Strings from '../locale/fr.json';

const InscriptionPageAffiliation: FC<RouteComponentProps> = () => {
  const [token] = useQueryParam('token', StringParam);
  const { trackEvent } = useMatomo();
  const { citizen, refetchCitizen } = useUser();
  const { error, refetch, isIdle, isLoading, isSuccess, isError } = useQuery(
    'affiliate',
    async () => {
      let citizenId = '';
      if (token) {
        citizenId = jwt(token)?.id;
      }
      return await requestCitizenAffiliation(citizenId, token);
    },
    {
      enabled: false,
      retry: false,
    }
  );

  useEffect(() => {
    if (token === undefined) {
      navigate('/404', { replace: true });
    }
  }, []);

  const handleClick = async (): Promise<void> => {
    await refetch();
    if (citizen) {
      refetchCitizen();
    }
  };

  const renderMessage = (): React.ReactNode => {
    if (isError && error) {
      if ((error as any).status === StatusCode.PreconditionFailed) {
        return <AffiliateAlreadyExistsMessage />;
      }
      return <AffiliateFailedMessage />;
    }

    if (isSuccess) {
      if (token) {
        const decodedToken: { enterpriseId: string } = jwt(token);
        matomoTrackEvent(
          'validateAffiliation',
          trackEvent,
          decodedToken.enterpriseId
        );
      }

      return <AffiliateSuccessMessage />;
    }
  };

  if (token !== undefined || isIdle) {
    return (
      <Layout pageTitle={Strings['affiliation.title']}>
        <div className="connexion-inscription connexion-inscription--question">
          <div className="connexion-inscription__first">
            <Heading like="h1">{Strings['affiliation.title']}</Heading>
            {(isIdle || isLoading) && <AffiliateActivationMessage />}
            {renderMessage()}
            {(isIdle || isLoading) && (
              <Button onClick={handleClick} disabled={isLoading}>
                {Strings['affiliation.button']}
              </Button>
            )}
          </div>
          <div className="connexion-inscription__second" />
          <div className="connexion-inscription__image">
            <div className="img-rounded-left">
              <Image fixed filename="girl-smiling.jpg" />
            </div>
            {LetterM}
          </div>
        </div>
      </Layout>
    );
  }
  return null;
};

export default InscriptionPageAffiliation;

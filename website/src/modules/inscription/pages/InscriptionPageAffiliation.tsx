import React, { FC, useEffect } from 'react';
import { RouteComponentProps } from '@reach/router';
import { navigate } from 'gatsby';
import { useQueryParam, StringParam } from 'use-query-params';

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
import { useQuery } from 'react-query';
import { putCitizenAffiliation } from '@api/CitizenService';
import { StatusCode } from '@utils/http';
import Strings from '../locale/fr.json';

const InscriptionPageAffiliation: FC<RouteComponentProps> = () => {
  const [token] = useQueryParam('token', StringParam);
  const { error, refetch, isIdle, isLoading, isSuccess, isError } =
    useQuery(
      'affiliate',
      async () => {
        return await putCitizenAffiliation(token);
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

  const handleClick = (): void => {
    refetch();
  };

  const renderMessage = (): React.ReactNode => {
    if (isError && error) {
      if ((error as any).status === StatusCode.PreconditionFailed) {
        return <AffiliateAlreadyExistsMessage />;
      } else {
        return <AffiliateFailedMessage />;
      }
    }
    if(isSuccess) {
      return <AffiliateSuccessMessage />;
    }
  };

  if (token !== undefined || isIdle) {
    return (
      <Layout>
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
          <div className="connexion-inscription__second"></div>
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

import React, { FC } from 'react';
import './_request-information.scss';
import Table from '@components/Table/Table';
import Heading from '@components/Heading/Heading';

import { Subscription } from '@utils/demandes';
import DownloadJustifs from '../../DownloadJustifs/DownloadJustifs';
import Button from '@components/Button/Button';
import { SUBSCRIPTION_STEP } from '@utils/demandes';
import { InputFormat } from '@utils/table';
import Strings from '../locale/fr.json';

interface RequestInformationProps {
  subscription: Subscription;
  handleStep: Function;
}

/**
 * @name RequestInformation
 * @description This is the first step in the process of validating request.
 * @type [Business Controller]
 */
const RequestInformation: FC<RequestInformationProps> = ({
  subscription,
  handleStep,
}) => {
  const specificFieldsList: InputFormat[] = subscription.specificFields
    ? Object.entries(subscription.specificFields).map((entry: any[]) => {
      const key = entry[0];
      const value = entry[1];
      if (Array.isArray(value)) {
        return { label: key, json: key, type: 'array' };
      }
      return { label: key, json: key, type: 'text' };
    })
    : [];

  return (
    <>
      <div className="mcm-demande__fields-section">
        <Heading level="h3" color="blue">
          {Strings['request.information.to.verify']}
        </Heading>
        {subscription.specificFields ? (
          <div className="mcm-demande__section">
            <Table
              inputFormatList={specificFieldsList}
              data={subscription.specificFields}
            />
          </div>
        ) : (
          <p>{Strings['request.information.no.informations.to.verify']}</p>
        )}
      </div>
      <div className="mcm-demande__download-section">
        <Heading level="h3" color="blue">
          {Strings['request.information.obligatory.proof']}
        </Heading>
        {subscription.attachments ? (
          <div className="mcm-demande__section">
            <DownloadJustifs
              subscriptionId={subscription.id}
              subscriptionAttachments={subscription.attachments}
            />
          </div>
        ) : (
          <p>{Strings['request.information.no.file.to.download']}</p>
        )}
      </div>
      <div className="mcm-demande__button-section">
        <Button
          secondary={true}
          onClick={() => handleStep(SUBSCRIPTION_STEP.REJECT)}
        >
          {Strings['request.information.reject.request']}
        </Button>
        <Button onClick={() => handleStep(SUBSCRIPTION_STEP.VALIDATE)}>
          {Strings['request.information.validate.informations.conforrmity']}
        </Button>
      </div>
    </>
  );
};

export default RequestInformation;

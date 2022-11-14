import React, { FC } from 'react';
import { firstCharUpper } from '@utils/helpers';

import Heading from '@components/Heading/Heading';
import Table from '@components/Table/Table';
import MetadataFiles from '@components/MetadataFiles/MetadataFiles';

import { InputFormat } from '@utils/table';

import Strings from '../locale/fr.json';

interface SubscriptionSummaryProps {
  incentiveSpecificFields: object[];
  specificFields: {
    [key: string]:
      | string
      | { id: number; label: string; value: string }[]
      | string[];
  };
  attachmentMetadata?: { fileName: string }[];
  importedFiles?: { path: string; name: string }[];
}

const SubscriptionSummary: FC<SubscriptionSummaryProps> = ({
  incentiveSpecificFields,
  specificFields,
  attachmentMetadata,
  importedFiles,
}) => {
  /**
   * Display filled in specifics fields
   */
  const renderSpecificFields = () => {
    /**
     * Delete consent so it can't be displayed on Table Component
     */
    if (specificFields.consent) {
      delete specificFields.consent;
    }

    /**
     * Loop through specific fields to write it like : {label: key, json: key, type: "type"}
     */
    const identityList: InputFormat = [];
    Object.entries(specificFields).forEach(([key, value]) => {
      incentiveSpecificFields.forEach((element) => {
        if (element.name === key) {
          /**
           * Check if an element is an Array "ListChoice" to render its values properly
           */
          if (Array.isArray(value) && value.length) {
            const values = value.map((el) => el.value);
            specificFields[key] = values;
            identityList.push({
              label: firstCharUpper(element.title),
              json: key,
              type: 'arrayBullets',
            });
          } else {
            identityList.push({
              label: firstCharUpper(element.title),
              json: key,
            });
          }
        }
      });
      /**
       * Transform community to "Communauté" before display it to the screen
       */
      if (key === 'community') {
        identityList.push({
          label: Strings['subscription.third.community.field'],
          json: key,
        });
      }
    });
    // return jsx
    return (
      specificFields &&
      Object.keys(specificFields).length !== 0 && (
        <>
          <Heading className="mb-s" level="h3" color="blue">
            {Strings['subscription.first.step.additional.informations']}
          </Heading>
          <Table inputFormatList={identityList} data={specificFields} />
        </>
      )
    );
  };

  /**
   * Display existing files from simulation-mass
   */
  const renderExistingFiles = () => {
    // return jsx
    return (
      !!attachmentMetadata?.length && (
        <>
          <Heading className="mb-s mt-s" level="h4">
            {Strings['subscription.third.step.old.attachments']}
          </Heading>
          {attachmentMetadata?.map((file) =>
            Object.values(file).map((filename, index) => (
              <MetadataFiles key={index} fileName={filename} />
            ))
          )}
        </>
      )
    );
  };

  /**
   * Display imported Files by the User
   */
  const renderImportedFiles = () => {
    // return jsx
    return (
      !!importedFiles?.length && (
        <>
          <Heading className="mb-s mt-m" level="h4">
            {Strings['subscription.third.step.imported.attachments']}
          </Heading>
          {importedFiles?.map((file, index) => (
            <MetadataFiles key={index} fileName={file.path} />
          ))}
        </>
      )
    );
  };

  return (
    <>
      <p className="mb-m">{Strings['subscription.third.step.description']}</p>
      {renderSpecificFields()}
      {(!!attachmentMetadata?.length || !!importedFiles?.length) && (
        <Heading className="mb-s mt-m" level="h3" color="blue">
          {Strings['subscription.summary.attachment']}
        </Heading>
      )}
      {renderExistingFiles()}
      {renderImportedFiles()}
    </>
  );
};

export default SubscriptionSummary;

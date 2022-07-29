import React, { FC, useEffect, useState } from 'react';

import './_downloadJustifs.scss';

import { getDemandeFileByName } from '@api/DemandeService';
import { createPreviewURL, revokePreviewURL } from '@utils/helpers';
import Table from '@components/Table/Table';
import { InputFormat } from '@utils/table';
import Strings from './locale/fr.json';

interface DownloadProps {
  subscriptionId: string;
  subscriptionAttachments: Array<any>;
}

const DownloadJustifs: FC<DownloadProps> = ({
  subscriptionId,
  subscriptionAttachments,
}) => {
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [previewURL, setPreviewURL] = useState<string>('');

  useEffect(() => {
    return () => {
      revokePreviewURL(previewURL);
    };
  }, []);

  /**
   * Get file base64 from api
   * Generate object url for new tab
   * Open file in new tab
   */
  const downloadFile = async (
    idDemande: string,
    originalName: string,
    mimeType: string
  ) => {
    try {
      const downloadResult = await getDemandeFileByName(
        idDemande,
        originalName
      );

      setErrorMsg('');
      // Revoke previous url in case a new click is triggered
      revokePreviewURL(previewURL);
      // Build preview url
      const url = createPreviewURL(downloadResult.data, mimeType);
      // Set preview URL to openit in new window
      setPreviewURL(url);
      // Open file in new tab and add event to revoke url on close
      window.open(url)!.addEventListener('beforeunload', revokePreviewURL(url));
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        setErrorMsg('Error while downloading file. Try again later');
      }
    }
  };

  let proofInputFormatList: InputFormat[] = [];
  let attachmentsData: any = {};

  // Format data to be compliant with table component
  subscriptionAttachments.forEach((proof: any, index: number) => {
    const json = `file-${index}`;
    proofInputFormatList.push({
      iconName: 'valid',
      json: json,
      type: 'text',
      actionList: [
        {
          label: Strings['label.download.proof'],
          type: 'a',
          callback: async () =>
            await downloadFile(
              subscriptionId,
              proof.originalName,
              proof.mimeType
            ),
        },
      ],
    });
    Object.assign(attachmentsData, {
      [json]: proof.originalName,
      type: 'text',
    });
  });

  return (
    <>
      {errorMsg && <p className="errorMsg">{errorMsg}</p>}
      <Table inputFormatList={proofInputFormatList} data={attachmentsData} />
    </>
  );
};

export default DownloadJustifs;

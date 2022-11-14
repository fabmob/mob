import React, { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Buffer } from 'buffer';
import Rasha from "rasha";

import './_downloadJustifs.scss';

import { getDemandeById, getDemandeFileByName } from '@api/DemandeService';
import Table from '@components/Table/Table';
import { createPreviewURL, revokePreviewURL } from '@utils/helpers';
import { Subscription, PrivateKeyAccess } from '@utils/demandes';
import { InputFormat } from '@utils/table';
import {
  b642ab,
  decryptRSA,
  decryptAES,
  importAESKey,
  decodeFile,
} from '@utils/decryption';

import Strings from './locale/fr.json';

interface DownloadProps {
  subscriptionId: string;
  subscriptionAttachments: Array<{ originalName: string; mimeType: string }>;
}

interface AttachmentType {
  originalName: string;
  uploadDate: Date;
  proofType: string;
  mimeType: string;
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

  const decryptFile = async (
    encryptedFile: Buffer,
    aesKey: string,
    iv: string,
    privateKeyAccess: PrivateKeyAccess,
    encryptionKeyVersion: string
  ) => {
    try {
      // Get private key from vault
      const { data } = await axios.post(privateKeyAccess.loginURL);
      const { data: secretKey } = await axios.get(privateKeyAccess.getKeyURL, {
        headers: {
          'X-Vault-Token': data.auth.client_token,
        },
      });
      const privateKey = secretKey.data.keys[encryptionKeyVersion];
      const privateKeyJwk = await Rasha.import({ pem: privateKey, public: false });
      
      let funderRSASecretKey = await window.crypto.subtle.importKey(
        "jwk",
        privateKeyJwk,
        {
          name: "RSA-OAEP",
          hash: "SHA-1",
        },
        true,
        ["decrypt"]
      );
      
      let decryptedAESKey = await decryptRSA(
        funderRSASecretKey,
        b642ab(aesKey)
        );
      let decryptedIV = await decryptRSA(funderRSASecretKey, b642ab(iv));
      let aesKeytoCryptoKey = await importAESKey(decryptedAESKey);
      
      // Decrypts the file with the decrypted AES key and IV
      let decryptMsg = await decryptAES(
        aesKeytoCryptoKey,
        encryptedFile,
        decryptedIV
        );
      return decryptMsg;
    } catch (error) {
      toast.error(Strings['label.download.error']);
    }
  };

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
      const currentSub: Subscription = await getDemandeById(idDemande);

      const attachments: AttachmentType[] = currentSub.attachments;
      const attachmentToDownload: AttachmentType | undefined = attachments.find(
        (attachment) => attachment.originalName === originalName
      );
      if (attachmentToDownload) {
        const downloadResult = await getDemandeFileByName(
          idDemande,
          originalName
        );
        let decodedFile = decodeFile(downloadResult.data);
        if (
          currentSub.encryptedAESKey &&
          currentSub.encryptedIV &&
          currentSub.privateKeyAccess &&
          currentSub.encryptionKeyVersion
        ) {
          decodedFile = await decryptFile(
            Buffer.from(decodedFile),
            currentSub.encryptedAESKey,
            currentSub.encryptedIV,
            currentSub.privateKeyAccess,
            currentSub.encryptionKeyVersion
          );
        }
        setErrorMsg('');

        if (decodedFile) {
          // Build preview url
          // Revoke previous url in case a new click is triggered
          revokePreviewURL(previewURL);
          const url = createPreviewURL(decodedFile, mimeType);
          // Set preview URL to openit in new window
          setPreviewURL(url);
          // Open file in new tab and add event to revoke url on close
          window.open(url);
        }
      }
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        setErrorMsg('Error while downloading file. Try again later');
      }
    }
  };

  let proofInputFormatList: InputFormat[] = [];
  let attachmentsData: object = {};

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

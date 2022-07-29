import React, { FC, useEffect, useState } from 'react';

import Heading from '@components/Heading/Heading';
import List from '@components/List/List';
import ModalComponent, { ParamsModal } from '@components/Modal/Modal';
import DropZoneComponent from '@components/DropZone/DropZone';
import DocumentBloc from '@components/DocumentBloc/DocumentBloc';
import SVG from '@components/SVG/SVG';
import MetadataFiles from '@components/MetadataFiles/MetadataFiles';

import { PROOF_CHOICE } from '../../../constants';

import Strings from '../locale/fr.json';

interface SendFileStepProps {
  attachmentMetadata?: { fileName: string }[];
  attachments?: string[];
  getAttachment(arg: { path: string; name: string }[]): void;
}

const SendFileStep: FC<SendFileStepProps> = ({
  attachmentMetadata = [],
  attachments = [],
  getAttachment,
}) => {
  const [formattedAttachement, setFormattedAttachement] = useState<string[]>(
    []
  );
  const [filesData, setFilesData] = useState<[]>([]);
  const [modalFiles, setModalFiles] = useState<[]>([]);
  const [isShowModal, setIsShowModal] = useState<boolean>(false);

  useEffect(() => {
    if (attachments?.length) {
      let temp: string[] = [];
      attachments.forEach((elm: string) => {
        const label = PROOF_CHOICE[elm];
        if (label !== undefined) {
          temp = [...temp, label];
        } else {
          temp = [...temp, elm];
        }
        setFormattedAttachement([...temp]);
      });
    }
  }, [attachments]);

  /**
   * display modal
   */
  const showModal = () => {
    setModalFiles([]);
    setIsShowModal(!isShowModal);
  };

  /**
   * handle drop files in drop zone
   * @param files files dropped in drop zone
   */
  const handleDropZone = (files: []) => {
    setModalFiles([...modalFiles, ...files]);
  };

  /**
   * handle modal submit button
   */
  const modalHandleSubmit = () => {
    setFilesData([...filesData, ...modalFiles]);
    getAttachment([...filesData, ...modalFiles]);
    showModal();
  };

  /**
   * modal params
   */
  const uploadModal: ParamsModal = {
    title: Strings['subscription.justif.add.justif.modal.title'],
    submitBtn: {
      label: Strings['subscription.justif.add.justif.modal.validate.btn'],
      onClick: modalHandleSubmit,
    },
  };

  /**
   * delete file from modal
   * @param index index of file to delete
   */
  const deleteModalFile = (index: number) => {
    const temp: [] = [...modalFiles];
    temp.splice(index, 1);
    setModalFiles([...temp]);
  };

  /**
   * delete file from screen
   * @param index index of file to delete
   */
  const deleteFile = (index: number) => {
    const temp: [] = [...filesData];
    temp.splice(index, 1);
    setFilesData([...temp]);
    getAttachment([...temp]);
  };

  return (
    <div className="mb-m">
      <div>
        <p className="mb-m">
          {Strings['subscription.second.step.description']}
        </p>
        <div className="mcm-demande__fields-section">
          <Heading level="h3" color="blue">
            {Strings['subscription.second.step.send.justif']}
          </Heading>
        </div>
        {formattedAttachement?.length ? (
          <List items={formattedAttachement} />
        ) : (
          <Heading level="p" className="mb-s">
            {Strings['subscription.second.step.no.send.justif']}
          </Heading>
        )}

        {/** Bloc justif app */}
        {!!attachmentMetadata?.length && (
          <div className="app_justif">
            <Heading level="h3" color="blue" className="mb-s">
              {Strings['subscription.justif.mobile.justif.title']}
            </Heading>
            <div>
              <Heading level="p" className="justif_title">
                {Strings['subscription.justif.buy.justif']}
              </Heading>
              {attachmentMetadata?.map((elm) => (
                <MetadataFiles fileName={elm.fileName} />
              ))}
            </div>
          </div>
        )}

        {/** Bloc add justif */}
        {!!formattedAttachement?.length && (
          <div className="add_justif">
            <Heading level="h3" color="blue" className="mb-s">
              {Strings['subscription.justif.add.justif.title']}
            </Heading>
            <div>
              <Heading level="p" className="justif_title mb-s">
                {Strings['subscription.first.step.description']}
              </Heading>
              <div>
                {!!filesData.length &&
                  filesData.map((fileData, index) => (
                    <DocumentBloc
                      name={fileData.name}
                      deleteFile={deleteFile}
                      index={index}
                      withAddedDoc
                    />
                  ))}
              </div>
              <button
                type="button"
                className="mb-s"
                onClick={showModal}
                disabled={filesData.length >= 10}
              >
                <div className="icon">
                  <SVG
                    icon={filesData.length >= 10 ? 'grey-add' : 'add'}
                    size={20}
                  />
                </div>
                <Heading level="p">
                  {Strings['subscription.justif.add.justif.btn']}
                </Heading>
              </button>
            </div>
          </div>
        )}
      </div>

      {/** Modal */}
      <ModalComponent
        params={uploadModal}
        isShowModal={isShowModal}
        closeModal={showModal}
        withTitleIcon={false}
        isDisabled={filesData?.length + modalFiles.length > 10}
      >
        <DropZoneComponent dropFileAction={handleDropZone} />
        {!!modalFiles.length && (
          <div className="file_bloc_container">
            {modalFiles.map((file, index) => (
              <DocumentBloc
                name={file.name}
                deleteFile={deleteModalFile}
                index={index}
              />
            ))}
          </div>
        )}
      </ModalComponent>
    </div>
  );
};

export default SendFileStep;

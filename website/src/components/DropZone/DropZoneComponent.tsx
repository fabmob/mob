import React, { FC } from 'react';
import Dropzone from 'react-dropzone';
import classNames from 'classnames';

import SVG from '@components/SVG/SVG';

import Strings from './locale/fr.json';

import './_dropZone.scss';

interface Props {
  isDisabled?: boolean;
  maxFiles?: number;
  multiple?: boolean;
  dropFileAction(): void;
}

const DropZoneComponent: FC<Props> = ({
  dropFileAction,
  multiple,
  maxFiles,
  isDisabled,
}) => {
  const onDropFile = (files) => {
    dropFileAction(files);
  };
  return (
    <Dropzone
      onDrop={onDropFile}
      multiple={multiple}
      maxFiles={maxFiles}
      disabled={isDisabled}
    >
      {({ getRootProps, getInputProps, isDragActive }) => {
        return (
          <section
            className={classNames('container mb-s', {
              dragEffect: isDragActive,
            })}
          >
            <div
              className="border dz_content "
              {...getRootProps()}
              data-testid="dropZone"
            >
              <input {...getInputProps()} />
              <div className="icon_wrapper">
                <SVG icon="addFile" size={20} />
              </div>

              <div className="text_wrapper">
                <span className="import-label">{`${Strings['dropZone.import']}`}</span>
                <span>{`${Strings['dropZone.slide']} / ${Strings['dropZone.drop.document']}`}</span>
              </div>
            </div>
          </section>
        );
      }}
    </Dropzone>
  );
};

export default DropZoneComponent;

import React, { FC } from 'react';

import SVG from '@components/SVG/SVG';
import Heading from '@components/Heading/Heading';

import './_metadataFiles.scss';

interface Props {
  fileName: string;
}
const MetadataFiles: FC<Props> = ({ fileName }) => {
  /**
   * Split filename and get extention from the last element
   */
  const getFormat = (filename: string) => {
    const values = filename.split('.');
    return values[values.length - 1];
  };

  /**
   * Return SVG based on extention
   */
  const renderExtensionIcon = () => {
    let extention = getFormat(fileName);
    switch (extention.toLowerCase()) {
      case 'jpg':
        return <SVG icon="jpg-icon" size={20} />;
      case 'jpeg':
        return <SVG icon="jpeg-icon" size={20} />;
      case 'pdf':
        return <SVG icon="pdf-icon" size={20} />;
      case 'png':
        return <SVG icon="png-icon" size={20} />;
      case 'heic':
        return <SVG icon="heic-icon" size={20} />;
      default:
        return;
    }
  };

  return (
    <div className="app_justif_bloc">
      <div className="app_justif">
        <div className="icon">{renderExtensionIcon()}</div>
        <Heading level="p">{fileName}</Heading>
      </div>
    </div>
  );
};

export default MetadataFiles;

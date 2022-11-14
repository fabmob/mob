import React, { FC } from 'react';

import SVG from '@components/SVG/SVG';
import Heading from '@components/Heading/Heading';

import './_documentBloc.scss';
import Strings from './locale/fr.json';

interface Props {
  name: string;
  deleteFile(arg: number): void;
  index: number;
  withAddedDoc: boolean;
}

const DocumentBloc: FC<Props> = ({
  name,
  deleteFile,
  index,
  withAddedDoc = false,
}) => {
  return (
    <div className="file_bloc">
      <div>
        <SVG icon="success" width="30" height="40" />
        <Heading level="p">{name}</Heading>
        {withAddedDoc && <Heading level="p">{Strings['added.justif']}</Heading>}
      </div>
      <button type="button" onClick={() => deleteFile(index)}>
        {Strings['delete.btn']}
      </button>
    </div>
  );
};

export default DocumentBloc;

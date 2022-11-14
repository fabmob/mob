import React, { FC } from 'react';
import { Helmet } from 'react-helmet';

import Strings from './locale/fr.json';
interface HeadProps {
  title?: string;
  description?: string;
}

const Head: FC<HeadProps> = ({ title, description }) => {
  return (
    <Helmet
      defaultTitle={`${Strings['head.defaultTitle']} ${Strings['head.separator']} ${Strings['head.siteName']}`}
      title={title}
      titleTemplate={`%s ${Strings['head.separator']} ${Strings['head.siteName']}`}
    >
      <html lang="fr" />
      <meta
        name="description"
        content={description ?? Strings['head.description']}
      />
    </Helmet>
  );
};

export default Head;

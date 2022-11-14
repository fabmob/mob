import React, { FC } from 'react';
import { renderProfileLink } from '../../utils';
import Strings from '../../locale/fr.json';

const AffiliateFailedMessage: FC = () => {
  return (
    <>
      <p>
        {Strings['affiliation.failed']}{' '}
        {renderProfileLink()}
        .
      </p>
    </>
  );
};

export default AffiliateFailedMessage;

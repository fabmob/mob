import React, { FC } from 'react';
import { renderProfileLink } from '../../utils';
import Strings from '../../locale/fr.json';

const AffiliateAlreadyExistsMessage: FC = () => {
  return (
    <>
      <p>
        {Strings['affiliation.exists']}{' '}
        {renderProfileLink()}
        .
      </p>
    </>
  );
};

export default AffiliateAlreadyExistsMessage;

import React, { FC } from 'react';
import Strings from '../../locale/fr.json';

const AffiliateActivationMessage: FC = () => {
  return (
    <>
      <p className="headline mb-xs">
        <span className="special">{Strings['affiliation.activation']}</span>
      </p>
      <p className="mb-s">
        {Strings['affiliation.activation.action']}
      </p>
    </>
  );
};

export default AffiliateActivationMessage;

import React from 'react';
import Strings from '../locale/fr.json';

const CreationCompteMessage: React.FC = () => {
  return (
    <>
      <h1 className="mb-s">
        {Strings['creation.line1.create']} <br /> {Strings['creation.line2.account']}
      </h1>
      <p className="headline mb-m">
      {Strings['creation.bravo.message']}
        <span className="special">{Strings['creation.territoire.pilote']}</span>
        {Strings['creation.territoire.message']}
      </p>
      <p className="mb-m">{Strings['creation.complete.inscription']}</p>
    </>
  );
};

export default CreationCompteMessage;

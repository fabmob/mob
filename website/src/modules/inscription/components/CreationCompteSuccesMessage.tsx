import React from 'react';
import Strings from '../locale/fr.json';

const CreationCompteSuccesMessage: React.FC = () => {
  return (
    <>
      <h1 className="mb-s">{Strings['creation.success.thanks']}</h1>
      <p className="headline mb-xs">
        <span className="special">{Strings['creation.success.message']}</span>
      </p>
      <p>{Strings['creation.success.activate.inscription.message']}</p>
    </>
  );
};

export default CreationCompteSuccesMessage;

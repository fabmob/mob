import React from 'react';
import Strings from '../locale/fr.json';

const CreationCompteMessage: React.FC = () => {
  return (
    <>
      <p className="headline mb-m">{Strings['creation.bravo.message']}</p>
    </>
  );
};

export default CreationCompteMessage;

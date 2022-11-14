import React from 'react';
import Strings from '../locale/fr.json';

interface CreationCompteMessageProps {
  completionMode: boolean;
}

const CreationCompteMessage: React.FC<CreationCompteMessageProps> = ({
  completionMode,
}) => {
  const creationTitle = completionMode
    ? Strings['completion.title.create']
    : null;
  const creationDescription = completionMode
    ? Strings['completion.description.account']
    : Strings['creation.line2.account'];

  return (
    <>
    {completionMode &&
      <h1 className="mb-s">
        {creationTitle} <br /> {creationDescription}
      </h1>
    }
      <p className="headline mb-m">{Strings['creation.bravo.message']}</p>
    </>
  );
};

export default CreationCompteMessage;

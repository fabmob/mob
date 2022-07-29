import React from 'react';
import Strings from '../locale/fr.json';

import './_bullet-point.scss';
const PasswordCompositionMessage = (): JSX.Element => {
  return (
    <div className="mb-m">
      <p>{Strings['password.composition.message']}</p>

      <ul className="bullet-point">
        <li>{Strings['password.composition.condition.1']}</li>
        <li>{Strings['password.composition.condition.2']}</li>
        <li>{Strings['password.composition.condition.3']}</li>
        <li>{Strings['password.composition.condition.4']}</li>
        <li>{Strings['password.composition.condition.5']}</li>
      </ul>
    </div>
  );
};

export default PasswordCompositionMessage;

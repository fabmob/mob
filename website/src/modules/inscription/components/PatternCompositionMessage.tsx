import React from 'react';
import Strings from '../locale/fr.json';

import './_bullet-point.scss';
const PatternCompositionMessage = (): JSX.Element => {
  return (
    <div className="mb-m">
      <p>{Strings['pattern.composition.message']}</p>

      <ul className="bullet-point">
        <li>{Strings['pattern.composition.condition.1']}</li>
        <li>{Strings['pattern.composition.condition.2']}</li>
        <li>{Strings['pattern.composition.condition.3']}</li>
        <li>{Strings['pattern.composition.condition.4']}</li>
        <li>{Strings['pattern.composition.condition.5']}</li>
      </ul>
    </div>
  );
};

export default PatternCompositionMessage;

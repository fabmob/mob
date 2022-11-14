import React from 'react';
import { navigate } from '@reach/router';
import Strings from '../locale/fr.json';

import Button from '@components/Button/Button';
import {
  INSCRIPTION_ROUTE,
  INSCRIPTION_INDISPONIBLE_ROUTE,
} from '../constants';

const Pilote1Message: React.FC = () => {
  return (
    <>
      <h1 className="mb-s order-1">
        {Strings['creation.line1.create']} <br /> {Strings['creation.line2.account']}
      </h1>
      <p className="headline mb-m order-2">
      {Strings['pilote1.message']}
        <span className="special">{Strings['pilote1.territoire.pilote']}</span>
      </p>
      <Button
        secondary
        onClick={() => navigate(INSCRIPTION_INDISPONIBLE_ROUTE)}
      >
        {Strings['pilote1.response.negative']}
      </Button>
      <Button onClick={() => navigate(INSCRIPTION_ROUTE)} classnames="order-3">
      {Strings['pilote1.response.positive']}
      </Button>
    </>
  );
};

export default Pilote1Message;

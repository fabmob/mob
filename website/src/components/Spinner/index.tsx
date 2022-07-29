import React, { FC } from 'react';
import loadingSpinner from '@assets/svg/spinner.svg';

import './_index.scss';

const Spinner: FC = () => {
  return (
    <div>
      <img src={loadingSpinner} alt="spinner" className="mcm-spinner" />
    </div>
  );
};

export default Spinner;

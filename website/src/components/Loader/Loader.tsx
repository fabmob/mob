import React from 'react';

import mobLogo from '@assets/svg/logo-mobile.svg';

import './_loader.scss';

export const Loader: React.FC = () => {
  return (
    <div className="box">
      <img src={mobLogo} alt="moB-logo" className="mcm-logo-loading" />
    </div>
  );
};

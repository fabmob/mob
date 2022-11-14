import React from 'react';
import loadingSpinner from '../../assets/svg/spinner.svg';

import './Loading.css';

const Loading = (): React.ReactElement => {
  return <img src={loadingSpinner} alt="spinner" className="loading" />;
};

export default Loading;

import React from 'react';
import './Loading.css';

const Loading = (): React.ReactElement => (
  <div className="loading">
    <div className="content has-text-centered is-fullheight">
      Loading du provider Keycloak
    </div>
  </div>
);

export default Loading;

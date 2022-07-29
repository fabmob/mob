import React, { FC, useEffect } from 'react';
import { navigate } from '@reach/router';

export default () => {
  // This small helper function is for any path the router comes across that is not defined
  useEffect(() => {
    navigate('/', { replace: true });
  }, []);
  return null;
};

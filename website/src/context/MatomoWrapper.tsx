import React, { FC, useEffect, useState } from 'react';
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react';
import { getMatomoData } from '@utils/matomo';

const MatomoWrapper: FC = ({ children }) => {
  const [matomoUrl, setMatomoUrl] = useState<string>();
  
  useEffect(() => {
    getMatomoData(setMatomoUrl);
    return () => {};
  }, []);

  let instance;
  if (matomoUrl) {
    instance = createInstance({
      urlBase: matomoUrl,
      siteId: 1,
    });
  }

  return matomoUrl ? (
    <MatomoProvider value={instance}>{children}</MatomoProvider>
  ) : (
    <></>
  );
};

export default MatomoWrapper;

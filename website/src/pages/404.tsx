import React, { useEffect, useState } from 'react';
import { Link } from 'gatsby';

import Button from '@components/Button/Button';
import Layout from '@components/Layout/Layout';
import { browser } from '@utils/helpers';
import Strings from './locale/fr.json';

const NotFoundPage = () => {
  const [isMount, setMount] = useState(false);

  useEffect(() => {
    setMount(true);
  }, []);

  if (!isMount) {
    return <div>Loading ....</div>;
  }
  return (
    browser && (
      <Layout pageTitle={Strings['page.404.title']}>
        <h1 className="mb-m">{Strings['page.404.title']}</h1>
        <p className="mb-m">
          {Strings['page.404.body']}
        </p>
        <Link id="404-home-page" to="/">
          <Button>{Strings['page.404.return.button']}</Button>
        </Link>
      </Layout>
    )
  );
};

export default NotFoundPage;

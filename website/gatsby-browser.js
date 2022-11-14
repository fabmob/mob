/**
 * Implement Gatsby's Browser APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/browser-apis/
 */

import React from 'react';
import { Router as MyRouter } from '@reach/router';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Helmet } from 'react-helmet';

import MatomoWrapper from './src/context/MatomoWrapper';
import { UserProvider, KeycloakProvider } from './src/context';

import NavigateDefault from '@helpers/configs/navigate';

import 'tailwindcss/tailwind.css';
import './src/assets/scss/main.scss';

import mobFavicon from './src/assets/svg/mob-favicon.svg';

/**
 * Wrapping gatsby app in Keycloak wrapper.
 * @param element
 * @returns {JSX.Element}
 */

// Called when the gatsby browser runtime first starts
export const onClientEntry = () => {
  return (
    <MyRouter>
      <NavigateDefault default />
    </MyRouter>
  );
};

export const wrapRootElement = ({ element }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <>
      <Helmet
        link={[{ rel: 'icon', type: 'image/svg+xml', href: mobFavicon }]}
      ></Helmet>

      <MatomoWrapper>
        <QueryClientProvider client={queryClient}>
          <KeycloakProvider>
            <UserProvider>{element}</UserProvider>
          </KeycloakProvider>
        </QueryClientProvider>
      </MatomoWrapper>
    </>
  );
};

/**
 * Implement Gatsby's Browser APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/browser-apis/
 */

import React from 'react';
import { Router as MyRouter } from '@reach/router';
import { QueryClient, QueryClientProvider } from 'react-query';

import { UserProvider } from './src/context';
import KeycloakProviderInit from '@components/Keycloak/KeycloakProviderInit';
import NavigateDefault from '@helpers/configs/navigate';

import 'tailwindcss/tailwind.css';
import './src/assets/scss/main.scss';

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
    <QueryClientProvider client={queryClient}>
      <KeycloakProviderInit authClient={{}}>
        <UserProvider>{element}</UserProvider>
      </KeycloakProviderInit>
    </QueryClientProvider>
  );
};

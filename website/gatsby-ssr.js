/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/ssr-apis/
 */

// You can delete this file if you're not using it
const React = require('react');
const { QueryClient, QueryClientProvider } = require('react-query');
const { UserProvider, KeycloakProvider } = require('./src/context');

function wrapRootElement({ element }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <KeycloakProvider>
        <UserProvider>{element}</UserProvider>
      </KeycloakProvider>
    </QueryClientProvider>
  );
}

exports.wrapRootElement = wrapRootElement;

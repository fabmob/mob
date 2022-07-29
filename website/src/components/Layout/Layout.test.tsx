import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClientProvider, QueryClient } from 'react-query';

import Layout from './Layout';
import { mockUseKeycloak } from '../../helpers/tests/mocks';

jest.mock('@react-keycloak/web', () => {
  return {
    useKeycloak: () => [mockUseKeycloak.keycloak, mockUseKeycloak.initialized],
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

describe('<Layout />', () => {
  test('Display correct children', () => {
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <Layout>
          <h1>Hello world !</h1>
        </Layout>
      </QueryClientProvider>
    );
    const containerMain = getByText('Hello world !');

    // expect(getByTestId('header')).toBeInTheDocument();
    expect(containerMain).toHaveTextContent('Hello world !');
    expect(containerMain.nodeName).toBe('H1');
    // expect(getByTestId('footer')).toBeInTheDocument();
  });
});

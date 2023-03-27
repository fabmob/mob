import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react';

import { mockUseKeycloak } from '../../../helpers/tests/mocks';
import InscriptionPageAffiliation from './InscriptionPageAffiliation';

jest.mock('use-query-params', () => {
  return {
    useQueryParam: () => {
      return 'token';
    },
  };
});

jest.mock('../../../context', () => {
  return {
    useSession: () => [mockUseKeycloak.keycloak, mockUseKeycloak.isKCInit],
  };
});

jest.mock('@components/Image/Image', () => {
  return {
    __esModule: true,
    A: true,
    default: () => {
      return <div>Affiliation</div>;
    },
  };
});

const mockError422 = {
  data: {
    error: {},
  },
  status: 422,
};

const mockError412 = {
  data: {
    error: {},
  },
  status: 412,
};

jest.mock('axios', () => {
  const mAxiosInstance = {
    post: jest
      .fn()
      .mockReturnValueOnce(Promise.resolve({}))
      .mockImplementationOnce(() => Promise.reject(mockError422))
      .mockImplementationOnce(() => Promise.reject(mockError412)),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };
  return {
    create: jest.fn(() => mAxiosInstance),
  };
});

jest.mock('jwt-decode', () => () => ({ enterpriseId: '1234567890' }));

jest.mock('@utils/matomo', () => {
  return {
    matomoTrackEvent: () => jest.fn(),
  };
});
describe('<InscriptionPageLocalisation />', () => {
  test('Display <AffiliateActivationMessage />', async () => {
    const queryClient = new QueryClient();
    const instance = createInstance({
      urlBase: `https://localhost:/8084`,
      siteId: 1,
    });

    const { getByText, unmount } = render(
      <MatomoProvider value={instance}>
        <QueryClientProvider client={queryClient}>
          <InscriptionPageAffiliation />
        </QueryClientProvider>
      </MatomoProvider>
    );

    expect(getByText('Vous avez demandé une affiliation')).toBeInTheDocument();
    expect(getByText('Affilier mon compte')).toBeInTheDocument();
    unmount();
    cleanup();
  });

  test('Display <AffiliateSuccessMessage />', async () => {
    const queryClient = new QueryClient();
    const instance = createInstance({
      urlBase: `https://localhost:/8084`,
      siteId: 1,
    });

    const { getByText, unmount } = render(
      <MatomoProvider value={instance}>
        <QueryClientProvider client={queryClient}>
          <InscriptionPageAffiliation />
        </QueryClientProvider>
      </MatomoProvider>
    );

    await act(async () => {
      await fireEvent.click(getByText('Affilier mon compte'));
    });
    expect(getByText('Vous avez demandé une affiliation')).toBeInTheDocument();
    unmount();
    cleanup();
  });

  test('Display <AffiliateFailedMessage />', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const instance = createInstance({
      urlBase: `https://localhost:/8084`,
      siteId: 1,
    });

    const { getByText, unmount } = render(
      <MatomoProvider value={instance}>
        <QueryClientProvider client={queryClient}>
          <InscriptionPageAffiliation />
        </QueryClientProvider>
      </MatomoProvider>
    );

    await act(async () => {
      await fireEvent.click(getByText('Affilier mon compte'));
    });
    expect(getByText('Vous avez demandé une affiliation')).toBeInTheDocument();
    expect(
      getByText(
        "Une erreur s'est produite, votre affiliation n'a pas pu être réalisée. Vous pouvez réessayer plus tard depuis la page",
        { exact: false }
      )
    ).toBeInTheDocument();
    unmount();
    cleanup();
  });

  test('Display <AffiliateAlreadyExistsMessage />', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const instance = createInstance({
      urlBase: `https://localhost:/8084`,
      siteId: 1,
    });

    const { getByText, unmount } = render(
      <MatomoProvider value={instance}>
        <QueryClientProvider client={queryClient}>
          <InscriptionPageAffiliation />
        </QueryClientProvider>
      </MatomoProvider>
    );

    await act(async () => {
      await fireEvent.click(getByText('Affilier mon compte'));
    });
    expect(getByText('Vous avez demandé une affiliation')).toBeInTheDocument();
    unmount();
    cleanup();
  });
});

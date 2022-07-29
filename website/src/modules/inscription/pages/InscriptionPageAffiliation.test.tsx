import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { QueryClient, QueryClientProvider } from 'react-query';

import { mockUseKeycloak } from '../../../helpers/tests/mocks';
import InscriptionPageAffiliation from './InscriptionPageAffiliation';

jest.mock('use-query-params', () => {
  return {
    useQueryParam: () => {
      return 'token';
    },
  };
});

jest.mock('@react-keycloak/web', () => {
  return {
    useKeycloak: () => [mockUseKeycloak.keycloak, mockUseKeycloak.initialized],
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

jest.mock('axios', () => {
  const mAxiosInstance = {
    put: jest
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

describe('<InscriptionPageLocalisation />', () => {
  test('Display <AffiliateActivationMessage />', async () => {
    const queryClient = new QueryClient();

    const { getByText, unmount } = render(
      <QueryClientProvider client={queryClient}>
        <InscriptionPageAffiliation />
      </QueryClientProvider>
    );

    expect(getByText('Vous avez demandé une affiliation')).toBeInTheDocument();
    expect(getByText('Affilier mon compte')).toBeInTheDocument();
    unmount();
    cleanup();
  });

  test('Display <AffiliateSuccessMessage />', async () => {
    const queryClient = new QueryClient();

    const { getByText, unmount } = render(
      <QueryClientProvider client={queryClient}>
        <InscriptionPageAffiliation />
      </QueryClientProvider>
    );

    await act(async () => {
      await fireEvent.click(getByText('Affilier mon compte'));
    });
    expect(getByText('Vous avez demandé une affiliation')).toBeInTheDocument();
    expect(
      getByText(
        'Félicitations ! Vous êtes désormais affilié à votre employeur.'
      )
    ).toBeInTheDocument();
    expect(
      getByText(
        'Si vous avez activé votre compte, vous pouvez désormais vous connecter pour visualiser les aides de votre employeur.'
      )
    ).toBeInTheDocument();
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

    const { getByText, unmount } = render(
      <QueryClientProvider client={queryClient}>
        <InscriptionPageAffiliation />
      </QueryClientProvider>
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
    const { getByText, unmount } = render(
      <QueryClientProvider client={queryClient}>
        <InscriptionPageAffiliation />
      </QueryClientProvider>
    );

    await act(async () => {
      await fireEvent.click(getByText('Affilier mon compte'));
    });
    expect(getByText('Vous avez demandé une affiliation')).toBeInTheDocument();
    expect(
      getByText(
        'Vous êtes déjà affilié à une entreprise, vous pouvez vérifier votre affiliation sur votre page',
        { exact: false }
      )
    ).toBeInTheDocument();
    unmount();
    cleanup();
  });
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

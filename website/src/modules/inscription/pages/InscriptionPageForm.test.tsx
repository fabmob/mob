import React from 'react';
import { render } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from 'react-query';

import InscriptionPageForm from './InscriptionPageForm';
import { mockUseKeycloak } from '../../../helpers/tests/mocks';

jest.mock('@react-keycloak/web', () => {
  return {
    useKeycloak: () => [mockUseKeycloak.keycloak, mockUseKeycloak.initialized],
  };
});

jest.mock('@components/Form/SignUpForm/', () => {
  return {
    __esModule: true,
    A: true,
    default: () => {
      return <div>Formulaire inscription</div>;
    },
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

describe('<InscriptionPageForm />', () => {
  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <InscriptionPageForm />
      </QueryClientProvider>
    );

  test('Display correct className when inscriptionMode = true', () => {
    const { container, getByText } = renderComponent();

    expect(
      container.querySelector('.connexion-inscription--form')
    ).toBeInTheDocument();
    // <CreationCompteMessage />
    expect(
      getByText(
        'Pour poursuivre votre inscription, veuillez compléter le formulaire ci-contre.'
      )
    ).toBeInTheDocument();
    // <PasswordCompositionMessage />
    expect(
      getByText('Votre mot de passe doit contenir au moins:')
    ).toBeInTheDocument();
  });

  test('Display correct className when inscriptionMode = false', async () => {
    const { getByText } = renderComponent();
    expect(getByText('Formulaire inscription')).toBeInTheDocument();
  });
});

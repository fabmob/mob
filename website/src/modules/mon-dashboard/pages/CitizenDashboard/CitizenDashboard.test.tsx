import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { mockUseKeycloak } from '@utils/mockKeycloak';
import { waitFor } from '@testing-library/dom';
import { useGetFunder } from '@utils/keycloakUtils';
import CitizenDashboard from './CitizenDashboard';

const demandesResultMock = [
  {
    totalCitizensCount: 0,
  },
  {
    totalCitizensCount: 1,
  },
];

const mockFunderType = {
  funderName: 'google',
  funderType: 'collectivités',
  incentiveType: 'AideEmployeur',
};

const mockTypeEntreprise = {
  funderName: 'google',
  funderType: 'entreprises',
  incentiveType: 'AideEmployeur',
};

jest.mock('../../../../context', () => {
  return {
    useSession: () => mockUseKeycloak,
  };
});

jest.unmock('axios');

jest.mock('axios', () => {
  const mAxiosInstance = {
    get: jest
      .fn()
      .mockResolvedValueOnce(
        // test 1
        Promise.resolve({
          data: demandesResultMock[0],
        })
      )
      .mockReturnValueOnce(
        // test 2
        Promise.resolve({
          data: demandesResultMock[1],
        })
      )
      .mockResolvedValueOnce(
        // test 3
        Promise.resolve({
          data: demandesResultMock[0],
        })
      )
      .mockReturnValueOnce(
        // test 4
        Promise.resolve({
          data: demandesResultMock[1],
        })
      ),

    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };
  return {
    create: jest.fn(() => mAxiosInstance),
  };
});

jest.mock('@utils/keycloakUtils', () => {
  return {
    useGetFunder: jest.fn(),
  };
});

afterEach(cleanup);
describe('<CitizenDashboard />', () => {
  test('renders totalValue = 0  and value for Validated Citizens', async () => {
    useGetFunder.mockImplementation(() => mockFunderType);
    const { getByText } = render(<CitizenDashboard />);
    await waitFor(() => {
      expect(
        getByText(
          'Répartition des aides validées, par citoyens ayant réalisé une demande'
        )
      ).toBeInTheDocument();
      expect(getByText('Citoyens')).toBeInTheDocument();

      expect(
        getByText('0 citoyens ont une demande validée auprès de google')
      ).toBeInTheDocument();
    });
  });

  test('renders totalValue = 1 and value for Validated Citizens', async () => {
    useGetFunder.mockImplementation(() => mockFunderType);
    const { getByText } = render(<CitizenDashboard />);
    await waitFor(() => {
      expect(
        getByText(
          'Répartition des aides validées, par citoyens ayant réalisé une demande'
        )
      ).toBeInTheDocument();
      expect(getByText('Citoyen')).toBeInTheDocument();

      expect(
        getByText('1 citoyen a une demande validée auprès de google')
      ).toBeInTheDocument();
    });
  });

  test('renders totalValue = 0  and value for Validated Salaries', async () => {
    useGetFunder.mockImplementation(() => mockTypeEntreprise);
    const { getByText } = render(<CitizenDashboard />);
    await waitFor(() => {
      expect(
        getByText(
          'Répartition des aides validées, par salariés ayant réalisé une demande'
        )
      ).toBeInTheDocument();
      expect(getByText('Salariés')).toBeInTheDocument();
      expect(
        getByText('0 salariés ont une demande validée auprès de google')
      ).toBeInTheDocument();
    });
  });

  test('renders totalValue = 1 and value for Validated Salaries', async () => {
    useGetFunder.mockImplementation(() => mockTypeEntreprise);
    const { getByText } = render(<CitizenDashboard />);
    await waitFor(() => {
      expect(
        getByText(
          'Répartition des aides validées, par salariés ayant réalisé une demande'
        )
      ).toBeInTheDocument();
      expect(getByText('Salarié')).toBeInTheDocument();
      expect(
        getByText('1 salarié a une demande validée auprès de google')
      ).toBeInTheDocument();
    });
  });
});

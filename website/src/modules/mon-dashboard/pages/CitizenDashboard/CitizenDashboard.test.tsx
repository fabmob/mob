import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { mockUseKeycloak } from '@utils/mockKeycloak';
import { waitFor } from '@testing-library/dom';

import CitizenDashboard from './CitizenDashboard';

const demandesResultMock = [
  {
    totalCitizensCount: 0,
  },
  {
    totalCitizensCount: 1,
  },
];

jest.mock('@react-keycloak/web', () => {
  return {
    useKeycloak: () => mockUseKeycloak,
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

afterEach(cleanup);

describe('<CitizenDashboard />', () => {
  test('renders totalValue = 0  and value for Validated Citizens', async () => {
    const { getByText } = render(<CitizenDashboard />);

    await waitFor(() => {
      expect(
        getByText(
          'Répartition des aides validées, par citoyens ayant réalisé une demande'
        )
      ).toBeInTheDocument();
      expect(getByText('Citoyens')).toBeInTheDocument();
      expect(
        getByText('0 citoyens ont une demande validée auprès de randomfunder')
      ).toBeInTheDocument();
    });
  });

  test('renders totalValue = 1 and value for Validated Citizens', async () => {
    const { getByText } = render(<CitizenDashboard />);

    await waitFor(() => {
      expect(
        getByText(
          'Répartition des aides validées, par citoyens ayant réalisé une demande'
        )
      ).toBeInTheDocument();
      expect(getByText('Citoyen')).toBeInTheDocument();
      expect(
        getByText('1 citoyen a une demande validée auprès de randomfunder')
      ).toBeInTheDocument();
    });
  });
});

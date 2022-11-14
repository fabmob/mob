import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';

import { act } from 'react-dom/test-utils';

import DemandesDashboard from './DemandesDashboard';
import { mockUseKeycloak } from '@utils/mockKeycloak';

const demandesResultMock = {
  result: [
    { status: 'A_TRAITER', count: 6 },
    { status: 'VALIDEE', count: 15 },
    { status: 'REJETEE', count: 1 },
  ],
  totalPending: 10,
  totalCount: 22,
};

jest.unmock('axios');

jest.mock('../../../../context', () => {
  return {
    useSession: () => mockUseKeycloak,
  };
});

jest.mock('axios', () => {
  const mAxiosInstance = {
    get: jest.fn().mockResolvedValue(
      // test  1
      Promise.resolve({
        data: demandesResultMock,
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

describe('<DemandesDashboard />', () => {
  test('renders value with changed filters semester & year', async () => {
    const { container, getByText, getByTestId } = render(<DemandesDashboard />);

    const filters: any = container.querySelectorAll('input');

    await act(async () => {
      await fireEvent.focus(Object.values(filters)[0] as Element);
      await fireEvent.keyDown(Object.values(filters)[0] as Element, {
        key: 'ArrowDown',
        code: 40,
      });
      await fireEvent.click(getByText('2021'));
    });
    await act(async () => {
      await fireEvent.focus(Object.values(filters)[1] as Element);
      await fireEvent.keyDown(Object.values(filters)[1] as Element, {
        key: 'ArrowDown',
        code: 40,
      });
      await fireEvent.click(getByText('2'));
    });

    const svgText: any = container.querySelectorAll('text');

    expect(getByTestId('requests-to-process')).toHaveTextContent(
      'Demandes à traiter sur mon périmètre d’intervention'
    );
    expect(getByTestId('demandes-total')).toHaveTextContent(
      'Statut des demandes'
    );
    expect(Object.values(svgText)[0]).toHaveTextContent('6');
    expect(Object.values(svgText)[1]).toHaveTextContent('Demandes à traiter');
    expect(Object.values(svgText)[2]).toHaveTextContent('15');
    expect(Object.values(svgText)[3]).toHaveTextContent('Demandes validées');
    expect(Object.values(svgText)[4]).toHaveTextContent('1');
    expect(Object.values(svgText)[5]).toHaveTextContent('Demande rejetée');
  });
});

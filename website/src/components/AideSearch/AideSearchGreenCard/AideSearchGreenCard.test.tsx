import React from 'react';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { navigate } from 'gatsby';
import '@testing-library/jest-dom';

import AideSearchGreenCard from './AideSearchGreenCard';
import { mockUseKeycloak } from '@utils/mockKeycloak';

jest.mock('../../../context', () => {
  return {
    useSession: () => mockUseKeycloak,
    useUser: () => mockUseKeycloak,
  };
});

beforeEach(() => cleanup());

describe('<AideSearchGreenCard />', () => {
  test('Display correct green Card', () => {
    const { getByText } = render(<AideSearchGreenCard />);
    expect(
      getByText(
        'Découvrez les aides proposées par votre employeur en créant votre compte.'
      ).closest('.mcm-card--green')
    ).toBeInTheDocument();
  });

  test('Click on green card', async () => {
    const { getByText } = render(<AideSearchGreenCard />);
    expect(getByText('Créer mon compte')).toBeInTheDocument();
    await waitFor(() => {
      fireEvent.click(getByText('Créer mon compte'));
      expect(navigate).toHaveBeenCalledTimes(0);
    });
  });
});

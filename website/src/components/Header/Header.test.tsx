import React from 'react';
import { render } from '@testing-library/react';
import Header from './Header';
import { mockUseKeycloak } from '../../helpers/tests/mocks';

jest.mock('@react-keycloak/web', () => {
  return {
    useKeycloak: () => [mockUseKeycloak.keycloak, mockUseKeycloak.initialized],
  };
});

describe('<Header />', () => {
  test('Props focusable to <SVG icon=menu', () => {
    const { getByRole } = render(<Header />);

    expect(getByRole('navigation')).toBeInTheDocument();
  });
});

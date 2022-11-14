import { render } from '@testing-library/react';
import {
  mockUseKeycloak,
  mockUserKeycloakNotAuthenticated,
} from '../../modules/routes/mockKeycloak';
import { renderProfileLink } from './utils';

jest.mock('../../context', () => {
  return {
    useSession: jest
      .fn()
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated()),
  };
});

describe('renderProfileLink', () => {
  test('when user is logged', () => {
    const { getByText, getByTitle } = render(renderProfileLink());
    expect(getByTitle('Voir mon profil')).toBeInTheDocument();
    expect(getByText('Mon profil')).toBeInTheDocument();
  });

  test("when user isn't logged", () => {
    const { getByText } = render(renderProfileLink());
    expect(getByText("'Mon profil'")).toBeInTheDocument();
  });
});

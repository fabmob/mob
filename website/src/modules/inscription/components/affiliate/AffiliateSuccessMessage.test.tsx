import React from 'react';
import { navigate } from 'gatsby';
import { render, fireEvent, waitFor } from '@testing-library/react';
import {
  mockUseKeycloak,
  mockUserKeycloakNotAuthenticated,
} from '../../../routes/mockKeycloak';
import AffiliateSuccessMessage from './AffiliateSuccessMessage';

jest.mock('../../../../context', () => {
  return {
    useSession: jest
      .fn()
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated()),
  };
});

describe('<AffiliateSuccessMessage />', () => {
  test('check texts attendance when user is logged', () => {
    const { getByText } = render(<AffiliateSuccessMessage />);

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
  });

  test("click on login button when user isn't logged", async () => {
    const { getByText } = render(<AffiliateSuccessMessage />);
    expect(getByText('Me connecter')).toBeInTheDocument();

    fireEvent.click(getByText('Me connecter'));
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        `${window.location.origin}/redirection/`
      )
    );
  });
});

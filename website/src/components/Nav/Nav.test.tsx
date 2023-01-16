import React from 'react';
import { fireEvent, cleanup, render, waitFor } from '@testing-library/react';
import { navigate } from 'gatsby';

import {
  mockUseKeycloak,
  mockUserKeycloakNotAuthenticated,
} from '@modules/routes/mockKeycloak';
import Nav from './Nav';

jest.mock('../../context', () => {
  return {
    useSession: jest
      .fn()
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated()),
  };
});

beforeEach(() => cleanup());

describe('<Nav />', () => {
  test('render connected', () => {
    const { getAllByText, getByRole } = render(<Nav />);
    expect(getByRole('navigation')).toBeInTheDocument();
    expect(getAllByText('Me déconnecter')).toBeTruthy();
  });

  test('click on logout mobile', async () => {
    const { getAllByText } = render(<Nav />);
    expect(getAllByText('Me déconnecter')).toBeTruthy();
    fireEvent.click(getAllByText('Me déconnecter')[0]);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(`/`));
  });

  test('click on logout desktop', async () => {
    const { getAllByText } = render(<Nav />);
    expect(getAllByText('Me déconnecter')).toBeTruthy();
    fireEvent.click(getAllByText('Me déconnecter')[1]);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(`/`));
  });

  test('render disconnected', () => {
    const { getAllByText, getByRole } = render(<Nav />);
    expect(getByRole('navigation')).toBeInTheDocument();
    expect(getAllByText('Me connecter')).toBeTruthy();
  });

  test('click on login mobile', async () => {
    const { getAllByText } = render(<Nav />);
    expect(getAllByText('Me connecter')).toBeTruthy();
    fireEvent.click(getAllByText('Me connecter')[0]);
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        `${window.location.origin}/redirection/`
      )
    );
  });

  test('click on login desktop', async () => {
    const { getAllByText } = render(<Nav />);
    expect(getAllByText('Me connecter')).toBeTruthy();
    fireEvent.click(getAllByText('Me connecter')[1]);
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        `${window.location.origin}/redirection/`
      )
    );
  });
});
import React from 'react';
import { render, cleanup } from '@testing-library/react';

import AuthorizationRoute from './AuthorizationRoute';
import { navigate } from 'gatsby';
import {
  mockUseKeycloak,
  mockUserKeycloakNotAuthenticated,
} from '@utils/mockKeycloak';

import { useSession } from '../../context';

const successfulAccess = <label data-testid="label">successful</label>;

jest.mock('../../context', () => {
  return {
    useSession: jest.fn(),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Authorization Route', () => {
  test('Should display component when user unauthenticated on public only route', () => {
    useSession.mockImplementation(() => mockUserKeycloakNotAuthenticated);
    const { getByTestId, queryByTestId } = render(
      <AuthorizationRoute component={successfulAccess} publicOnly />
    );
    expect(queryByTestId('label')).toBeTruthy();
    expect(getByTestId('label').textContent).toBe('successful');
  });

  test('Should redirect user when user is authenticated on public only route', async () => {
    useSession.mockImplementation(() => mockUseKeycloak);
    const { queryByTestId } = render(
      <AuthorizationRoute component={successfulAccess} publicOnly />
    );
    expect(queryByTestId('label')).toBeNull();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  test('Should display component when user authenticated without forbidden roles', () => {
    useSession.mockImplementation(() => mockUseKeycloak);
    const { getByTestId, queryByTestId } = render(
      <AuthorizationRoute
        component={successfulAccess}
        forbiddenRoles={['content_editor']}
      />
    );
    expect(queryByTestId('label')).toBeTruthy();
    expect(getByTestId('label').textContent).toBe('successful');
  });

  test('Should redirect user when user authenticated with forbidden role', async () => {
    useSession.mockImplementation(() => mockUseKeycloak);
    const { queryByTestId } = render(
      <AuthorizationRoute
        component={successfulAccess}
        publicOnly
        forbiddenRoles={['admin']}
      />
    );
    expect(queryByTestId('label')).toBeNull();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  test('Should display component when user authenticated with allowed role', () => {
    useSession.mockImplementation(() => mockUseKeycloak);
    const { getByTestId, queryByTestId } = render(
      <AuthorizationRoute
        component={successfulAccess}
        allowedRoles={['admin']}
      />
    );
    expect(queryByTestId('label')).toBeTruthy();
    expect(getByTestId('label').textContent).toBe('successful');
  });

  test('Should redirect user when user authenticated without allowed role', async () => {
    useSession.mockImplementation(() => mockUseKeycloak);
    const { queryByTestId } = render(
      <AuthorizationRoute
        component={successfulAccess}
        publicOnly
        allowedRoles={['content_editor']}
      />
    );
    expect(queryByTestId('label')).toBeNull();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  test('Should display component when user authenticated on authenticated only route and has allowed role', () => {
    useSession.mockImplementation(() => mockUseKeycloak);
    const { getByTestId, queryByTestId } = render(
      <AuthorizationRoute
        component={successfulAccess}
        authenticatedOnly
        allowedRoles={['admin']}
      />
    );
    expect(queryByTestId('label')).toBeTruthy();
    expect(getByTestId('label').textContent).toBe('successful');
  });

  test('Should display component when user authenticated on authenticated only route without allowedRoles specified', () => {
    useSession.mockImplementation(() => mockUseKeycloak);
    const { getByTestId, queryByTestId } = render(
      <AuthorizationRoute component={successfulAccess} authenticatedOnly />
    );
    expect(queryByTestId('label')).toBeTruthy();
    expect(getByTestId('label').textContent).toBe('successful');
  });

  test('Should redirect user when user authenticated on authenticated only route without allowed role', async () => {
    useSession.mockImplementation(() => mockUseKeycloak);
    const { queryByTestId } = render(
      <AuthorizationRoute
        component={successfulAccess}
        authenticatedOnly
        allowedRoles={['content_editor']}
      />
    );
    expect(queryByTestId('label')).toBeNull();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  test('Should redirect user when user unauthenticated on authenticated only route', async () => {
    useSession.mockImplementation(() => mockUserKeycloakNotAuthenticated);
    const { queryByTestId } = render(
      <AuthorizationRoute component={successfulAccess} authenticatedOnly />
    );
    expect(queryByTestId('label')).toBeNull();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/');
  });
});

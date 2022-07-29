import {
  mockUseKeycloak,
  mockUserKeycloakNotAuthenticated,
} from './mockKeycloak';
import {
  checkIfCitizen,
  isCitizen,
  isContentEditor,
  isFunder,
  useGetFunder,
  useGetIdUser,
  useRoleAccepted,
} from './keycloakUtils';
import { renderHook } from '@testing-library/react-hooks';

const { result } = renderHook(() => useGetFunder());

jest.mock('@react-keycloak/web', () => {
  return {
    useKeycloak: () => mockUseKeycloak,
  };
});

describe('KeycloakUtils', () => {
  test('authenticated useGetIdUser', () => {
    expect(useGetIdUser()).toBe(mockUseKeycloak.keycloak.idTokenParsed.sub);
  });

  test('authenticated useRoleAccepted', () => {
    expect(useRoleAccepted('financeurs')).toBe(true);
  });

  test('authenticated useRoleAccepted', () => {
    expect(checkIfCitizen(mockUseKeycloak.keycloak)).toBe(false);
  });

  test('authenticated isFunder', () => {
    expect(isFunder()).toBe(true);
  });

  test('authenticated isCitizen', () => {
    expect(isCitizen()).toBe(true);
  });

  test('authenticated isContentEditor : false', () => {
    expect(isContentEditor()).toBe(false);
  });
});

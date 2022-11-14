import { mockUseKeycloak } from './mockKeycloak';
import {
  getIsCitizen,
  isContentEditor,
  isFunder,
  useGetFunder,
  useGetIdUser,
  useRoleAccepted,
} from './keycloakUtils';

jest.mock('../context', () => {
  return {
    useSession: () => mockUseKeycloak,
  };
});

describe('KeycloakUtils', () => {
  test('authenticated useGetIdUser', () => {
    expect(useGetIdUser()).toBe(mockUseKeycloak.keycloak.idTokenParsed.sub);
  });

  test('authenticated useRoleAccepted', () => {
    expect(useRoleAccepted('financeurs')).toBe(true);
  });

  test('authenticated isFunder', () => {
    expect(isFunder()).toBe(true);
  });

  test('authenticated getIsCitizen', () => {
    expect(getIsCitizen()).toBe(true);
  });

  test('authenticated isContentEditor : false', () => {
    expect(isContentEditor()).toBe(false);
  });
});

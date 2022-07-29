import {
  mockUseKeycloak,
  mockUserKeycloakNotAuthenticated,
} from './mockKeycloak';
import { useGetFunder } from './keycloakUtils';
import { renderHook } from '@testing-library/react-hooks';

const { result } = renderHook(() => useGetFunder());

jest.mock('@react-keycloak/web', () => {
  return {
    useKeycloak: () => mockUserKeycloakNotAuthenticated,
  };
});
describe('useGetFunder', () => {
  test('not authenticated', () => {
    expect(result.useGetFunder).toBe(undefined);
  });
});

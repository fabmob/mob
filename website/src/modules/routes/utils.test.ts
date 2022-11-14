import { isAuthorized, isAuthenticated } from './utils';
import { mockUseKeycloak } from './mockKeycloak';

jest.mock('../../context', () => {
  return {
    useSession: () => mockUseKeycloak(),
  };
});

describe('isAuthenticated true', () => {
  test('IsAuthorized without roles', () => {
    expect(isAuthorized(['financeurs'])).toEqual(true);
  });

  test('IsAuthorized enough roles', () => {
    expect(isAuthorized(['random'])).toEqual(false);
  });

  test('IsAuthenticated', () => {
    expect(isAuthenticated()).toEqual(true);
  });
});

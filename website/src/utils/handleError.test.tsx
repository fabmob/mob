import React from 'react';
import { handleError } from './handleError';
import Toast from '../components/Toast/Toast';
import { act, cleanup, render } from '@testing-library/react';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

afterEach(cleanup);
describe('handleErrorTest', () => {
  test('showToastrError not displayed', async () => {
    const utils = render(<Toast />);
    const mockError500 = {
      data: { error: { statusCode: 500, resourceName: 'erreur' } },
    };
    act(() => {
      handleError(mockError500, false);
    });
    const message = `Il semble qu'il y ait un problème, votre requête n'a pas pu aboutir. Merci de réessayer ultérieurement.`;
    expect(utils.queryByText(message)).not.toBeInTheDocument();
  });
  test('showToastrError 400', async () => {
    const utils = render(<Toast />);
    const mockError400 = {
      data: { error: { statusCode: 400, resourceName: 'erreur' } },
    };
    const message = `Il semble qu'il y ait un problème, votre requête n'a pas pu aboutir. Verifiez votre requête.`;
    act(() => {
      handleError(mockError400, true);
    });
    expect(utils.queryByText(message)).toBeInTheDocument();
  });
  test('showToastrError 422', async () => {
    const mockError422 = {
      data: { error: { statusCode: 422, resourceName: 'erreur' } },
    };
    const message = `Il semble qu'il y ait un problème avec votre erreur, votre requête n'a pas pu aboutir. Merci de réessayer ultérieurement.`;
    const utils = render(<Toast />);
    act(() => {
      handleError(mockError422, true);
    });
    expect(utils.queryByText(message)).toBeInTheDocument();
  });
  test('showToastrError 409', async () => {
    const mockError409 = {
      data: { error: { statusCode: 409, resourceName: 'erreur' } },
    };
    const message = `Il semble qu'il y ait un conflit avec votre erreur, votre requête n'a pas pu aboutir.`;
    const utils = render(<Toast />);
    act(() => {
      handleError(mockError409, true);
    });
    expect(utils.queryByText(message)).toBeInTheDocument();
  });
  test('showToastrError 404', async () => {
    const mockError404 = {
      data: { error: { statusCode: 404, resourceName: 'erreur' } },
    };
    const message = `Il semble que la ressource erreur n'existe pas, votre requête n'a pas pu aboutir.`;
    const utils = render(<Toast />);
    act(() => {
      handleError(mockError404, true);
    });
    expect(utils.queryByText(message)).toBeInTheDocument();
  });
  test('showToastrError 415', async () => {
    const mockError415 = {
      data: { error: { statusCode: 415, resourceName: 'erreur' } },
    };
    const message = `Il semble l'extension du fichier ne respecte pas le format demandé.`;
    const utils = render(<Toast />);
    act(() => {
      handleError(mockError415, true);
    });
    expect(utils.queryByText(message)).toBeInTheDocument();
  });
  test('showToastrError other error', async () => {
    const mockError500 = {
      data: { error: { statusCode: 500, resourceName: 'erreur' } },
    };
    const message = `Il semble qu'il y ait un problème, votre requête n'a pas pu aboutir. Merci de réessayer ultérieurement.`;
    const utils = render(<Toast />);
    act(() => {
      handleError(mockError500, true);
    });
    expect(utils.queryByText(message)).toBeInTheDocument();
  });
});

import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import DownloadJustifs from './DownloadJustifs';

const mockError400 = { response: { status: 400 } };
jest.mock('axios', () => {
  const mAxiosInstance = {
    get: jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: 'fakeUrl',
        })
      )
      .mockImplementationOnce(() => Promise.reject(mockError400)),

    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };
  return {
    create: jest.fn(() => mAxiosInstance),
  };
});

afterEach(cleanup);
describe('<DownloadJustifs />', () => {
  global.URL.createObjectURL = jest.fn(() => '/fakeUrl');
  global.URL.revokeObjectURL = jest.fn();
  const renderComponent = () => {
    return render(
      <DownloadJustifs
        subscriptionId="61c333159097fc4ce88322f1"
        subscriptionAttachments={[
          { originalName: 'Justificatif1', mimeType: 'pdf' },
          { originalName: 'Justificatif2', mimeType: 'pdf' },
        ]}
      />
    );
  };

  test('It should render the DownloadJustifs with 2 justifs to download', async () => {
    Object.defineProperty(window, 'open', {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        addEventListener: jest.fn(),
      })),
    });
    const utils = renderComponent();
    const dlJustifButtons = await utils.findAllByText(
      'Télécharger le justificatif'
    );
    expect(utils.getByText('Justificatif1')).toBeInTheDocument();
    expect(utils.getByText('Justificatif2')).toBeInTheDocument();
    expect(dlJustifButtons).toHaveLength(2);

    await act(() => {
      fireEvent.click(dlJustifButtons[0]);
    });
    expect(window.open).toHaveBeenCalled();
  });
  test('It should render the DownloadJustifs and show error message on download error', async () => {
    const utils = renderComponent();
    const dlJustifButtons = await utils.findAllByText(
      'Télécharger le justificatif'
    );
    expect(utils.getByText('Justificatif1')).toBeInTheDocument();
    expect(utils.getByText('Justificatif2')).toBeInTheDocument();
    expect(dlJustifButtons).toHaveLength(2);

    fireEvent.click(dlJustifButtons[0]);

    const errorMessage = await utils.findByText(
      'Error while downloading file. Try again later'
    );
    expect(errorMessage).toBeInTheDocument();
  });
});

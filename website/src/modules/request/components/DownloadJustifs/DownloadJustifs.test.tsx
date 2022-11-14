import React from 'react';
import axios from 'axios';
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react';
import { Crypto } from '@peculiar/webcrypto';

import { https } from '@utils/https';
import * as decryption from '@utils/decryption';

import DownloadJustifs from './DownloadJustifs';
import Strings from './locale/fr.json';

const mockError400 = { response: { status: 400 } };

const mockSubscription = {
  id: '61c333159097fc4ce88322f1',
  encryptedAESKey: `${process.env.MOCK_ENCRYPTED_AES_KEY}`,
  encryptedIV: `${process.env.MOCK_ENCRYPTED_IV}`,
  encryptionKeyVersion: 1,
  encryptionKeyId: 'encryptionKeyId',
  privateKeyAccess: {
    loginURL: 'loginURL',
    getKeyURL: 'getKeyURL',
  },
  attachments: [
    { originalName: 'Justificatif1' },
    { originalName: 'Justificatif2' },
  ],
};

const mockPrivateKey = `${process.env.MOCK_PRIVATE_KEY}`;

jest.spyOn(decryption, 'decryptAES').mockReturnValue('decryptedMsg');
Object.assign(window, {
  crypto: new Crypto(),
});
const mockGetHttps = jest.spyOn(https, 'get');
const mockGetAxios = jest.spyOn(axios, 'get');
const mockPostAxios = jest.spyOn(axios, 'post');

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

    mockGetAxios.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          data: { keys: { 1: mockPrivateKey } },
        },
      })
    );
    mockPostAxios.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          auth: {
            client_token: 'client_token',
          },
        },
      })
    );
    mockGetHttps.mockImplementationOnce(() =>
      Promise.resolve({
        data: mockSubscription,
      })
    );
    mockGetHttps.mockImplementationOnce(() =>
      Promise.resolve({
        data: 'fakeUrl',
      })
    );
    const utils = renderComponent();
    const dlJustifButtons = await utils.findAllByText(
      'Télécharger le justificatif'
    );
    expect(utils.getByText('Justificatif1')).toBeInTheDocument();
    expect(utils.getByText('Justificatif2')).toBeInTheDocument();
    expect(dlJustifButtons).toHaveLength(2);

    act(() => {
      fireEvent.click(dlJustifButtons[0]);
    });
    await waitFor(() => {
      expect(window.open).toHaveBeenCalled();
    });
  });
  test('It should render the DownloadJustifs and show error message on download error', async () => {
    const utils = renderComponent();
    const dlJustifButtons = await utils.findAllByText(
      'Télécharger le justificatif'
    );
    mockGetHttps.mockImplementationOnce(() => Promise.reject(mockError400));
    expect(utils.getByText('Justificatif1')).toBeInTheDocument();
    expect(utils.getByText('Justificatif2')).toBeInTheDocument();
    expect(dlJustifButtons).toHaveLength(2);

    fireEvent.click(dlJustifButtons[0]);

    const errorMessage = await utils.findByText(
      'Error while downloading file. Try again later'
    );
    expect(errorMessage).toBeInTheDocument();
  });
  test('It should render the DownloadJustifs and show error message on decrypt file error', async () => {
    const utils = renderComponent();
    const dlJustifButtons = await utils.findAllByText(
      'Télécharger le justificatif'
    );
    mockPostAxios.mockImplementationOnce(() => Promise.reject(mockError400));
    mockGetHttps.mockImplementationOnce(() =>
      Promise.resolve({
        data: mockSubscription,
      })
    );
    mockGetHttps.mockImplementationOnce(() =>
      Promise.resolve({
        data: 'fakeUrl',
      })
    );
    expect(utils.getByText('Justificatif1')).toBeInTheDocument();
    expect(utils.getByText('Justificatif2')).toBeInTheDocument();
    expect(dlJustifButtons).toHaveLength(2);

    act(() => {
      fireEvent.click(dlJustifButtons[0]);
    });
    waitFor(async () => {
      const errorToast = await utils.findByText(
        Strings['label.download.error']
      );
      expect(errorToast).toBeInTheDocument();
    });
  });
});

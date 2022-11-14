import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import RequestReject from './RequestReject';
import selectEvent from 'react-select-event';
import axios from 'axios';

jest.mock('axios', () => {
  const mAxiosInstance = {
    put: jest
      .fn()
      .mockReturnValueOnce(Promise.resolve())
      .mockImplementationOnce(() => Promise.reject())
      .mockImplementationOnce(() => Promise.resolve()),

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
describe('<RequestReject />', () => {
  const renderComponent = () => {
    return render(
      <RequestReject
        subscriptionId="61c333159097fc4ce88322f1"
        handleStep={() => jest.fn()}
      />
    );
  };

  test.each(['Autre (précisez)', 'Justificatif invalide ou non lisible'])(
    `It should render the RequestReject component with given motif %i`,
    async (motif) => {
      const utils = renderComponent();
      const refuseDemandeBtn = await utils.findByRole('button', {
        name: 'Refuser la demande',
      });
      const returnBtn = await utils.findByRole('button', {
        name: `Retour à l'étape précédente`,
      });
      const selectMotifField = await utils.findByLabelText(
        'Motif du rejet de la demande *'
      );
      expect(refuseDemandeBtn).toBeInTheDocument();
      expect(refuseDemandeBtn).toBeDisabled();
      expect(returnBtn).toBeInTheDocument();
      expect(selectMotifField).toBeInTheDocument();
      expect(selectMotifField).toBeInTheDocument();

      if (motif === 'Autre (précisez)') {
        await selectEvent.select(
          utils.getByLabelText('Motif du rejet de la demande *'),
          motif
        );
        expect(refuseDemandeBtn).toBeEnabled();
        const input = (await utils.getByPlaceholderText(
          'Détaillez le motif de rejet (80 max)'
        )) as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'Demande redondante' } });
        expect(input.value).toBe('Demande redondante');
      } else if (motif === 'Justificatif invalide ou non lisible') {
        await selectEvent.select(
          utils.getByLabelText('Motif du rejet de la demande *'),
          'Justificatif invalide ou non lisible'
        );
        expect(refuseDemandeBtn).toBeEnabled();
      }

      // modal should be rendered after refuse button is clicked
      act(() => {
        fireEvent.click(refuseDemandeBtn);
      });
      expect(
        await utils.findByRole('button', {
          name: 'Oui, rejeter cette demande',
        })
      ).toBeInTheDocument();

      const rejectBtn = await screen.findByRole('button', {
        name: 'Oui, rejeter cette demande',
      });
      const cancelBtn = await screen.findByRole('button', {
        name: 'Annuler',
      });

      await act(async () => {
        fireEvent.click(rejectBtn);
      });
      expect(axios.create).toHaveBeenCalled();

      fireEvent.click(cancelBtn);
      expect(rejectBtn).not.toBeInTheDocument();
      fireEvent.click(returnBtn);
    }
  );
});

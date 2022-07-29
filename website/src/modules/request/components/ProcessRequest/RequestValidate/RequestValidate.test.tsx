import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import RequestValidate from './RequestValidate';
import axios from 'axios';
import selectEvent from 'react-select-event';

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
describe('<RequestValidate />', () => {
  const renderComponent = () => {
    return render(
      <RequestValidate
        subscriptionId="61c333159097fc4ce88322f1"
        handleStep={() => jest.fn()}
      />
    );
  };

  test.each(['Versement unique', 'Aucun versement', 'Versements multiples'])(
    `It should render the RequestValidate component with %s`,
    async (payementMode) => {
      const utils = renderComponent();
      const activateDemandeBtn = await utils.findByRole('button', {
        name: `Activer l'aide`,
      });
      const returnBtn = await utils.findByRole('button', {
        name: `Retour à l'étape précédente`,
      });
      expect(activateDemandeBtn).toBeInTheDocument();
      expect(activateDemandeBtn).toBeDisabled();
      expect(returnBtn).toBeInTheDocument();

      if (payementMode === 'Versement unique') {
        fireEvent.click(utils.getByLabelText('Versement unique'));
        expect(activateDemandeBtn).toBeEnabled();

        const input = utils.getByLabelText(
          'Montant en euros *'
        ) as HTMLInputElement;
        fireEvent.change(input, { target: { value: 6763 } });
        expect(input.value).toBe('6763');
      } else if (payementMode === 'Aucun versement') {
        fireEvent.click(utils.getByLabelText(payementMode));
        expect(activateDemandeBtn).toBeEnabled();
      } else if (payementMode === 'Versements multiples') {
        fireEvent.click(utils.getByLabelText(payementMode));
        expect(activateDemandeBtn).toBeEnabled();

        let date = new Date();
        const newDate = [
          date.getDate(),
          date.getMonth() + 6,
          date.getFullYear(),
        ].join('/');
        const input = utils.getByLabelText('Fréquence du versement *');
        const montantInput = utils.getByLabelText(
          'Montant en euros par palier de versements *'
        ) as HTMLInputElement;
        const dateInput = utils.getByLabelText(
          'Date du dernier versement *'
        ) as HTMLInputElement;
        await selectEvent.select(input, 'Mensuelle');
        fireEvent.change(montantInput, { target: { value: 6763 } });
        expect(montantInput.value).toBe('6763');
        fireEvent.change(dateInput, {
          target: {
            value: newDate,
          },
        });
        expect(dateInput.value).toBe(newDate);
      }

      act(() => {
        fireEvent.click(activateDemandeBtn);
      });
      expect(
        await utils.findByRole('button', {
          name: 'Oui, activer le dispositif',
        })
      ).toBeInTheDocument();

      const activateBtn = await screen.findByRole('button', {
        name: 'Oui, activer le dispositif',
      });
      const cancelBtn = await screen.findByRole('button', {
        name: 'Annuler',
      });

      await act(async () => {
        fireEvent.click(activateBtn);
      });
      expect(axios.create).toHaveBeenCalled();

      fireEvent.click(cancelBtn);
      expect(activateBtn).not.toBeInTheDocument();

      fireEvent.click(returnBtn);
    }
  );
});

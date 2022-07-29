import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import selectEvent from 'react-select-event';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import SubscriptionValidateForm from './SubscriptionValidateForm';
import { PAYMENT_VALUE, FREQUENCY_VALUE } from '@utils/demandes';
import Button from '@components/Button/Button';

afterEach(cleanup);

const subscriptionValidateSinglePaymentMock = {
  mode: PAYMENT_VALUE.SINGLE,
  amountSingle: 2500,
  comments: "",
};

const subscriptionValidateMultiplePaymentMock = {
  mode: PAYMENT_VALUE.MULTIPLE,
  amountMultiple: 2500,
  frequency: FREQUENCY_VALUE.MONTHLY,
  lastPayment: '17/12/2080',
  comments: "",
};

const subscriptionValidateNoPaymentMock = {
  mode: PAYMENT_VALUE.NONE,
  comments: "",
};

let result: any = undefined;
const onSubmit = (formResult: any) => {
  result = formResult;
};

const onChange = jest.fn();

describe('<SubscriptionValidateForm />', () => {
  test('Submit form with subscriptionValidateSinglePaymentMock', async () => {
    const { getByText, getByLabelText } = render(
      <SubscriptionValidateForm onSubmit={onSubmit} onChange={onChange}>
        <Button submit form="subscription-validate-form">
          Envoyer
        </Button>
      </SubscriptionValidateForm>
    );

    // fill the form
    await act(async () => {
      fireEvent.click(getByLabelText('Versement unique'));
    });
    await act(async () => {
      fireEvent.change(getByLabelText('Montant en euros *'), {
        target: { value: subscriptionValidateSinglePaymentMock.amountSingle },
      });
    });

    // submit
    await act(async () => {
      fireEvent.click(getByText('Envoyer'));
    });
    expect(result).toEqual(subscriptionValidateSinglePaymentMock);
  });

  test('Submit form with subscriptionValidateMultiplePaymentMock', async () => {
    const { getByText, getByLabelText } = render(
      <SubscriptionValidateForm onSubmit={onSubmit} onChange={onChange}>
        <Button submit form="subscription-validate-form">
          Envoyer
        </Button>
      </SubscriptionValidateForm>
    );

    // fill the form
    await act(async () => {
      fireEvent.click(getByLabelText('Versements multiples'));
    });

    await selectEvent.select(
      getByLabelText('Fréquence du versement *'),
      'Mensuelle'
    );
    await act(async () => {
      fireEvent.change(
        getByLabelText('Montant en euros par palier de versements *'),
        {
          target: { value: subscriptionValidateMultiplePaymentMock.amountMultiple },
        }
      );
    });
    await act(async () => {
      fireEvent.change(getByLabelText('Date du dernier versement *'), {
        target: { value: subscriptionValidateMultiplePaymentMock.lastPayment },
      });
    });
    // submit
    await act(async () => {
      fireEvent.click(getByText('Envoyer'));
    });
    expect(result).toEqual(subscriptionValidateMultiplePaymentMock);
  });

  test('Submit form with subscriptionValidateNoPaymentMock', async () => {
    const { getByText, getByLabelText } = render(
      <SubscriptionValidateForm onSubmit={onSubmit} onChange={onChange}>
        <Button submit form="subscription-validate-form">
          Envoyer
        </Button>
      </SubscriptionValidateForm>
    );

    // fill the form
    await act(async () => {
      fireEvent.click(getByLabelText('Aucun versement'));
    });

    // submit
    await act(async () => {
      fireEvent.click(getByText('Envoyer'));
    });
    expect(result).toEqual(subscriptionValidateNoPaymentMock);
  });
});

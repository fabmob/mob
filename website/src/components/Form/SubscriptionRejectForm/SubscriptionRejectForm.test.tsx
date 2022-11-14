import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import selectEvent from 'react-select-event';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';

import SubscriptionRejectForm from './SubscriptionRejectForm';
import Button from '@components/Button/Button';

afterEach(cleanup);

const subscriptionReject = {
  type: 'ConditionsNonRespectees',
  comments: ''
};

const subscriptionRejectMock = {
  type: 'Autre',
  other: 'autre raison',
  comments: 'commentaire'
};

let result: any = undefined;
const onSubmit = (formResult: any) => {
  result = formResult;
};

const onChange = jest.fn();

describe('<SubscriptionRejectForm />', () => {
  test('Submit form without other reason', async () => {
    const { getByText, getByLabelText } = render(
      <SubscriptionRejectForm onSubmit={onSubmit} onChange={onChange}>
        <Button submit form="subscription-reject-form">
          Envoyer
        </Button>
      </SubscriptionRejectForm>
    );

    await selectEvent.select(
      getByLabelText('Motif du rejet de la demande *'),
      "Conditions d'éligibilité non respectées"
    );

    // submit
    await act(async () => {
      fireEvent.click(getByText('Envoyer'));
    });
    expect(result).toEqual(subscriptionReject);
  });

  test('Submit form with other reason', async () => {
    const { getByText, getByLabelText, getByPlaceholderText } = render(
      <SubscriptionRejectForm onSubmit={onSubmit} onChange={onChange}>
        <Button submit form="subscription-reject-form">
          Envoyer
        </Button>
      </SubscriptionRejectForm>
    );

    await selectEvent.select(
      getByLabelText('Motif du rejet de la demande *'),
      'Autre (précisez)'
    );
    await act(async () => {
      fireEvent.change(
        getByPlaceholderText('Détaillez le motif de rejet (80 max)'),
        {
          target: { value: 'autre raison'},
        }
      );
    });

    await act(async () => {
      fireEvent.change(
        getByLabelText('Commentaires'),
        {
          target: { value: 'commentaire'},
        }
      );
    });

    // submit
    await act(async () => {
      fireEvent.click(getByText('Envoyer'));
    });
    expect(result).toEqual(subscriptionRejectMock);
  });
});

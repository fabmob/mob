import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextareaMarkdownField from './TextareaMarkdownField';

describe('<TextareaMarkdownField />', () => {
  const errors = {
    paymentMethod: {
      message: 'Attention, ce champ est obligatoire',
      type: 'required',
    },
  };

  test('Div with correct className when there is an error', () => {
    const { getByText, rerender } = render(
      <TextareaMarkdownField
        classnames="payment"
        id="paymentMethod"
        label="Modalité de versement *"
        name="paymentMethod"
        errors={errors}
        rows={6}
      />
    );
    const label = getByText('Modalité de versement *');

    expect(label.closest('div')).toHaveAttribute(
      'class',
      'field payment field--error'
    );
    // with no error
    rerender(
      <TextareaMarkdownField
        classnames="payment"
        id="paymentMethod"
        label="Modalité de versement *"
        name="paymentMethod"
        errors={{}}
        rows={6}
      />
    );
    expect(label.closest('div')).toHaveAttribute('class', 'field payment');
  });

  test('Label render with correct text and the attributes of label', () => {
    const { queryByText, getByText } = render(
      <TextareaMarkdownField
        id="paymentMethod"
        label="Modalité de versement *"
        name="paymentMethod"
        errors={{}}
        rows={6}
      />
    );
    const label = getByText('Modalité de versement *');

    // text
    expect(queryByText('Modalité de versement *')).toBeTruthy();
    // attribute
    expect(label).toHaveAttribute('for', 'paymentMethod');
  });

  test('The attributes of textarea', () => {
    const { getByPlaceholderText } = render(
      <TextareaMarkdownField
        id="paymentMethod"
        label="Modalité de versement *"
        name="paymentMethod"
        errors={{}}
        rows={6}
        cols={2}
        disabled
      />
    );

    const textarea = getByPlaceholderText('Entrez une valeur');

    expect(textarea).toHaveAttribute('id', 'paymentMethod');
    expect(textarea).toHaveAttribute('name', 'paymentMethod');
    expect(textarea).toHaveAttribute('rows', '6');
    expect(textarea).toHaveAttribute('cols', '2');
    expect(textarea).toHaveAttribute('disabled');
  });
});

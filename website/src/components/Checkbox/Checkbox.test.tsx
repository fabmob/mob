import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Checkbox from './Checkbox';

describe('<Checkbox />', () => {
  const errors = {
    login: {
      message: 'Attention, ce champ est obligatoire',
      type: 'required',
    },
  };

  test('Div with correct className when there is an error and small size', () => {
    const { getByText, rerender } = render(
      <Checkbox
        id="login"
        label="Identifiant"
        type="checkbox"
        name="login"
        size="small"
        errors={errors}
      />
    );
    const label = getByText('Identifiant');

    expect(label.closest('div')).toHaveAttribute(
      'class',
      'checkbox-radio checkbox--error checkbox--small'
    );
    // with no error and medium size
    rerender(
      <Checkbox
        id="login"
        label="Identifiant"
        name="login"
        type="checkbox"
        size="medium"
      />
    );
    expect(label.closest('div')).toHaveAttribute('class', 'checkbox-radio');

    // with no error and no size
    rerender(
      <Checkbox id="login" label="Identifiant" name="login" type="checkbox" />
    );
    expect(label.closest('div')).toHaveAttribute('class', 'checkbox-radio');
  });

  test('Label render with correct text and the attributes of label', () => {
    const { queryByText, getByText, rerender } = render(
      <Checkbox id="login" label="Identifiant" type="radio" name="login" />
    );
    const label = getByText('Identifiant');

    // text
    expect(queryByText('Identifiant')).toBeTruthy();
    // attributes
    expect(label).toHaveAttribute('class', 'field__label');
    expect(label).toHaveAttribute('for', 'login');

    //Correct className if size = small
    rerender(
      <Checkbox
        id="login"
        label="Identifiant"
        name="login"
        type="checkbox"
        size="small"
      />
    );
    expect(label).toHaveAttribute('class', 'field__label field__label--small');
  });

  test('The attributes of input', () => {
    const { getByText } = render(
      <Checkbox
        id="login"
        label="Identifiant"
        type="radio"
        name="login"
        disabled
      />
    );

    const label = getByText('Identifiant');
    const input = label.previousElementSibling;

    expect(input).toHaveAttribute('type', 'radio');
    expect(input).toHaveAttribute('id', 'login');
    expect(input).toHaveAttribute('name', 'login');
    expect(input).toHaveAttribute('disabled');
  });

  test('The attributes of input while checkbox and children', () => {
    const message =
      'En cochant cette case je reconnais avoir pris connaissance, et accepter';

    const { getByText } = render(
      <Checkbox
        id="login"
        label="Identifiant"
        type="checkbox"
        name="login"
        children={<p>{message}</p>}
      />
    );
    const label = getByText((content) => {
      return content.includes(message);
    });

    expect(label.firstChild.textContent).toEqual(message);
  });
});

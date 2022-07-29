import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextField from './TextField';

describe('<TextField />', () => {
  const errors = {
    login: {
      message: 'Attention, ce champ est obligatoire',
      type: 'required',
    },
  };

  test('Div with correct className when there is an error', () => {
    const { getByText, rerender } = render(
      <TextField
        id="login"
        label="Identifiant"
        type="text"
        name="login"
        errors={errors}
        classnames="text-field"
      />
    );
    const label = getByText('Identifiant');
    expect(label.closest('div')).toHaveAttribute(
      'class',
      'field text-field field--error'
    );
    // with no error
    rerender(
      <TextField
        id="login"
        label="Identifiant"
        type="text"
        name="login"
        errors={{}}
        classnames="text-field"
      />
    );
    expect(label.closest('div')).toHaveAttribute('class', 'field text-field');
  });

  test('Label render with correct text and attributes', () => {
    const { queryByText, getByText } = render(
      <TextField
        id="login"
        label="Identifiant"
        type="text"
        name="login"
        errors={errors}
        classnames="text-field"
      />
    );
    const label = getByText('Identifiant');
    expect(label.closest('div')).toHaveAttribute(
      'class',
      'field text-field field--error'
    );
  });

  test('Label render with correct text, attributes and required', () => {
    const { queryByText, getByText } = render(
      <TextField
        id="login"
        label="Identifiant"
        type="text"
        name="login"
        errors={errors}
        classnames="text-field"
        required
      />
    );

    const label = getByText((content) => {
      return content.startsWith('Identifiant');
    });

    expect(label.children.item(0).textContent).toEqual(' *');

    expect(label).toHaveAttribute('for', 'login');
  });

  test('Label element not rendered when label prop not specified', () => {
    const { queryByText } = render(
      <TextField
        id="login"
        type="text"
        name="login"
        errors={errors}
        classnames="text-field"
        required
      />
    );

    const label = queryByText((content) => {
      return content.startsWith('Identifiant');
    });
    expect(label).not.toBeInTheDocument();
  });

  test('The attributes of input', () => {
    const { getByPlaceholderText, rerender } = render(
      <TextField
        id="login"
        label="Identifiant"
        type="text"
        name="login"
        errors={errors}
        classnames="text-field"
        placeholder="exemple@mail.com"
        disabled
      />
    );
    const input = getByPlaceholderText('exemple@mail.com');

    expect(input).toHaveAttribute('class', 'field__text');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('id', 'login');
    expect(input).toHaveAttribute('name', 'login');
    expect(input).toHaveAttribute('disabled');

    // check text placeholder if no name
    rerender(
      <TextField
        id="login"
        label="Identifiant"
        type="text"
        name=""
        errors={errors}
        classnames="text-field"
        disabled
      />
    );

    const placeHolder = getByPlaceholderText('Entrez une valeur');
    expect(placeHolder).toHaveAttribute('placeholder', 'Entrez une valeur');
  });
});

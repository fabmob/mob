import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useForm } from 'react-hook-form';
import { screen } from '@testing-library/dom';
import selectEvent from 'react-select-event';
import SelectField from './SelectField';

describe('<SelectField />', () => {
  const statusOptions = [
    { value: 'salarie', label: 'Salarié' },
    { value: 'etudiant', label: 'Étudiant' },
    {
      value: 'independantLiberal',
      label: 'Indépendant / Profession libérale',
    },
    { value: 'retraite', label: 'Retraité' },
    { value: 'sansEmploi', label: 'Sans emploi' },
  ];

  const errors = {
    status: {
      message: 'Attention, ce champ est obligatoire',
      type: 'required',
    },
  };

  const ComponentSelectMultiple = ({
    isMulti = false,
    isCreatble = false,
    maxLimit = 3,
  }): JSX.Element => {
    const { control } = useForm();

    const transportsOptions = [
      { value: 'transportsCommun', label: 'Transports en communs' },
      { value: 'velo', label: 'Vélo' },
      { value: 'voiture', label: 'Voiture' },
    ];

    return (
      <SelectField
        name="transportList"
        id="transportList"
        label="Mode de transport"
        placeholder="Choisir un ou plusieurs transports"
        options={transportsOptions}
        errors={{}}
        control={control}
        isMulti={isMulti}
        isCreatable={isCreatble}
        maxLimit={maxLimit}
      />
    );
  };

  test('Div with correct className, isCreatable = false and not required', () => {
    const Component = () => {
      const { control } = useForm();
      return (
        <SelectField
          classnames="transport"
          name="status"
          id="status"
          label="Quel est votre statut ?"
          options={statusOptions}
          errors={{}}
          control={control}
        />
      );
    };

    const { getByText } = render(<Component />);
    const label = getByText('Quel est votre statut ?');

    expect(label.closest('div')).toHaveAttribute('class', 'field transport');
  });

  test('Div with correct className, isCreatable = false and required', () => {
    const Component = () => {
      const { control } = useForm();
      return (
        <SelectField
          classnames="transport"
          name="status"
          id="status"
          label="Quel est votre statut ?"
          options={statusOptions}
          errors={{}}
          control={control}
          required
        />
      );
    };

    const { getByText } = render(<Component />);

    const label = getByText((content) => {
      return content.startsWith('Quel est votre statut ?');
    });

    expect(label.lastChild.textContent).toEqual(' *');
    expect(label.closest('div')).toHaveAttribute('class', 'field transport');
  });

  test('Div with correct className, isCreatable = true', () => {
    const Component = () => {
      const { control } = useForm();
      return (
        <SelectField
          name="status"
          id="status"
          label="Quel est votre statut ?"
          options={statusOptions}
          errors={{}}
          control={control}
          isCreatable
        />
      );
    };

    const { getByText } = render(<Component />);
    const label = getByText('Quel est votre statut ?');

    expect(label.closest('div')).toHaveAttribute('class', 'field');
  });

  test('Div with correct className when there is an error, isCreatable = false', () => {
    const Component = () => {
      const { control } = useForm();
      return (
        <SelectField
          name="status"
          id="status"
          label="Quel est votre statut ?"
          options={statusOptions}
          errors={errors}
          control={control}
        />
      );
    };

    const { getByText } = render(<Component />);
    const legend = getByText('Quel est votre statut ?');

    expect(legend.closest('div')).toHaveAttribute(
      'class',
      'field field--error'
    );
  });

  test('Div with correct className when there is an error, isCreatable = true', () => {
    const Component = () => {
      const { control } = useForm();
      return (
        <SelectField
          name="status"
          id="status"
          label="Quel est votre statut ?"
          options={statusOptions}
          errors={errors}
          control={control}
          isCreatable
        />
      );
    };

    const { getByText } = render(<Component />);
    const legend = getByText('Quel est votre statut ?');

    expect(legend.closest('div')).toHaveAttribute(
      'class',
      'field field--error'
    );
  });

  test('Label render with correct text and attributes, isCreatable = false', () => {
    const Component = () => {
      const { control } = useForm();
      return (
        <SelectField
          name="status"
          id="status"
          label="Quel est votre statut ?"
          options={statusOptions}
          errors={{}}
          control={control}
          isSearchable
          isClearable
        />
      );
    };

    const { getByText, queryByText } = render(<Component />);
    const label = getByText('Quel est votre statut ?');

    // text
    expect(queryByText('Quel est votre statut ?')).toBeTruthy();
    // attributes
    expect(label).toHaveAttribute('for', 'status');
  });

  test('Label render with correct text and attributes, isCreatable = true', () => {
    const Component = () => {
      const { control } = useForm();
      return (
        <SelectField
          name="status"
          id="status"
          label="Quel est votre statut ?"
          options={statusOptions}
          errors={{}}
          control={control}
          isSearchable
          isClearable
          isCreatable
        />
      );
    };

    const { getByText, queryByText } = render(<Component />);
    const label = getByText('Quel est votre statut ?');

    // text
    expect(queryByText('Quel est votre statut ?')).toBeTruthy();
    // attributes
    expect(label).toHaveAttribute('for', 'status');
  });

  test('props of SelectFieldProps isSearchable = true, isCreatable = false', () => {
    const Component = () => {
      const { control } = useForm();
      return (
        <SelectField
          name="status"
          id="status"
          label="Quel est votre statut ?"
          options={statusOptions}
          errors={{}}
          control={control}
          isSearchable
        />
      );
    };

    const { getByText, getByTestId } = render(<Component />);
    const svg = getByTestId('svg-icon');
    const label = getByText('Quel est votre statut ?');
    const fieldSelect = label.nextElementSibling;

    // ClassName
    expect(
      fieldSelect?.classList.contains('field__select--is-searchable')
    ).toBe(true);

    // svg
    expect(svg).toHaveAttribute('viewBox', '0 0 22 23');
  });

  test('props of SelectFieldProps isSearchable = true, isCreatable = true', () => {
    const Component = () => {
      const { control } = useForm();
      return (
        <SelectField
          name="status"
          id="status"
          label="Quel est votre statut ?"
          options={statusOptions}
          errors={{}}
          control={control}
          isSearchable
          isCreatable
        />
      );
    };

    const { getByText, getByTestId } = render(<Component />);
    const svg = getByTestId('svg-icon');
    const label = getByText('Quel est votre statut ?');
    const fieldSelect = label.nextElementSibling;

    // ClassName
    expect(
      fieldSelect?.classList.contains('field__select--is-searchable')
    ).toBe(true);

    // svg
    expect(svg).toHaveAttribute('viewBox', '0 0 22 23');
  });

  test('props of SelectFieldProps isSearchable = false, isCreatable = false', () => {
    const Component = () => {
      const { control } = useForm();
      return (
        <SelectField
          name="status"
          id="status"
          label="Quel est votre statut ?"
          options={statusOptions}
          errors={{}}
          control={control}
        />
      );
    };

    const { getByText, getByTestId } = render(<Component />);
    const svg = getByTestId('svg-icon');
    const label = getByText('Quel est votre statut ?');
    const fieldSelect = label.nextElementSibling;

    // ClassName
    expect(
      fieldSelect?.classList.contains('field__select--is-searchable')
    ).toBe(false);

    // svg
    expect(svg).toHaveAttribute('viewBox', '0 0 40 40');
  });

  test('props of SelectFieldProps isSearchable = false, isCreatable = true', () => {
    const Component = () => {
      const { control } = useForm();
      return (
        <SelectField
          name="status"
          id="status"
          label="Quel est votre statut ?"
          options={statusOptions}
          errors={{}}
          control={control}
          isCreatable
        />
      );
    };

    const { getByText, getByTestId } = render(<Component />);
    const svg = getByTestId('svg-icon');
    const label = getByText('Quel est votre statut ?');
    const fieldSelect = label.nextElementSibling;

    // ClassName
    expect(
      fieldSelect?.classList.contains('field__select--is-searchable')
    ).toBe(false);

    // svg
    expect(svg).toHaveAttribute('viewBox', '0 0 40 40');
  });

  test('should render the correct message if status not present, isCreatable = false', async () => {
    const Component = () => {
      const { control } = useForm();
      return (
        <SelectField
          name="status"
          id="status"
          label="Quel est votre statut ?"
          options={statusOptions}
          errors={{}}
          control={control}
          isSearchable
        />
      );
    };

    const { getByText } = render(<Component />);
    const input = screen.getByDisplayValue('');

    await act(async () => {
      fireEvent.change(input, {
        target: { value: 'Ingénieur' },
      });
    });

    expect(getByText('Aucun résultat')).toBeInTheDocument();
  });

  test('should render the correct message if status not present, isCreatable = true', async () => {
    const Component = () => {
      const { control } = useForm();
      return (
        <SelectField
          name="status"
          id="status"
          label="Quel est votre statut ?"
          options={statusOptions}
          errors={{}}
          control={control}
          isSearchable
          isCreatable
        />
      );
    };

    const { getByText } = render(<Component />);
    const input = screen.getByDisplayValue('');

    await act(async () => {
      fireEvent.change(input, {
        target: { value: 'Ingénieur' },
      });
    });

    expect(getByText('Create "Ingénieur"')).toBeInTheDocument();
  });

  test('multi select > should call onChange() prop with selected options, isCreatble = false', async () => {
    const { queryByText, getByLabelText } = render(
      <ComponentSelectMultiple isMulti />
    );

    await selectEvent.select(getByLabelText('Mode de transport'), [
      'Voiture',
      'Vélo',
    ]);
    expect(queryByText('Voiture')).toBeTruthy();
    expect(queryByText('Vélo')).toBeTruthy();
    expect(queryByText('Transports en communs')).toBeFalsy();

    await selectEvent.select(getByLabelText('Mode de transport'), [
      'Transports en communs',
    ]);
    expect(queryByText('Voiture')).toBeTruthy();
    expect(queryByText('Vélo')).toBeTruthy();
    expect(queryByText('Transports en communs')).toBeTruthy();
  });

  test('multi select > should call onChange() prop with selected options, isCreatable = true', async () => {
    const { queryByText, getByLabelText } = render(
      <ComponentSelectMultiple isMulti isCreatble />
    );

    await selectEvent.select(getByLabelText('Mode de transport'), [
      'Voiture',
      'Vélo',
    ]);
    expect(queryByText('Voiture')).toBeTruthy();
    expect(queryByText('Vélo')).toBeTruthy();
    expect(queryByText('Transports en communs')).toBeFalsy();

    await selectEvent.select(getByLabelText('Mode de transport'), [
      'Transports en communs',
    ]);
    expect(queryByText('Voiture')).toBeTruthy();
    expect(queryByText('Vélo')).toBeTruthy();
    expect(queryByText('Transports en communs')).toBeTruthy();
  });

  test('simple select > should call onChange() prop with selected option, isCreatble = false', async () => {
    const { queryByText, getByLabelText } = render(<ComponentSelectMultiple />);

    await selectEvent.select(getByLabelText('Mode de transport'), 'Voiture');
    expect(queryByText('Voiture')).toBeTruthy();
    expect(queryByText('Vélo')).toBeFalsy();
    expect(queryByText('Transports en communs')).toBeFalsy();

    await selectEvent.select(
      getByLabelText('Mode de transport'),
      'Transports en communs'
    );
    expect(queryByText('Transports en communs')).toBeTruthy();
    expect(queryByText('Vélo')).toBeFalsy();
    expect(queryByText('Voiture')).toBeFalsy();
  });

  test('simple select > should call onChange() prop with selected option, isCreatble = true', async () => {
    const { queryByText, getByLabelText } = render(
      <ComponentSelectMultiple isCreatble />
    );

    await selectEvent.select(getByLabelText('Mode de transport'), 'Voiture');
    expect(queryByText('Voiture')).toBeTruthy();
    expect(queryByText('Vélo')).toBeFalsy();
    expect(queryByText('Transports en communs')).toBeFalsy();

    await selectEvent.select(
      getByLabelText('Mode de transport'),
      'Transports en communs'
    );
    expect(queryByText('Transports en communs')).toBeTruthy();
    expect(queryByText('Vélo')).toBeFalsy();
    expect(queryByText('Voiture')).toBeFalsy();
  });

  test('simple select > should call onChange() prop with selected option, isCreatble = true', async () => {
    const { queryByText, getByLabelText } = render(
      <ComponentSelectMultiple isCreatble />
    );

    await selectEvent.select(getByLabelText('Mode de transport'), 'Voiture');
    expect(queryByText('Voiture')).toBeTruthy();
    expect(queryByText('Vélo')).toBeFalsy();
    expect(queryByText('Transports en communs')).toBeFalsy();

    await selectEvent.select(
      getByLabelText('Mode de transport'),
      'Transports en communs'
    );
    expect(queryByText('Transports en communs')).toBeTruthy();
    expect(queryByText('Vélo')).toBeFalsy();
    expect(queryByText('Voiture')).toBeFalsy();
  });
});

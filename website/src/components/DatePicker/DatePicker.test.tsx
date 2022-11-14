import React from 'react';
import { render, screen } from '@testing-library/react';
import DatePickerComponent from './DatePicker';
import { useForm } from 'react-hook-form';
import { renderHook } from '@testing-library/react-hooks';

describe('<DatePicker />', () => {
  const setValue = jest.fn();
  const getDateErrors = jest.fn();

  const errors = {
    birthdate: {
      message: 'Merci de renseigner votre date de naissance',
      type: 'required',
      types: { required: 'Merci de renseigner votre date de naissance' },
    },
  };

  const { result } = renderHook(() => useForm());

  test('renders datePicker', () => {
    const { getByTestId } = render(
      <DatePickerComponent
        name="datePicker"
        label="date"
        required
        hasAgeCheck
        control={result.current.control}
        errors={null}
        setValue={setValue}
        getDateErrors={getDateErrors}
      />
    );
    expect(getByTestId('datePicker')).toBeInTheDocument();
    expect(getByTestId('datePicker')).toHaveAttribute('class', 'field');
  });
  test('renders datePicker with error', () => {
    const { getByTestId } = render(
      <DatePickerComponent
        name="birthdate"
        label="date"
        required
        hasAgeCheck
        control={result.current.control}
        errors={errors?.birthdate}
        setValue={setValue}
        getDateErrors={getDateErrors}
      />
    );
    expect(getByTestId('error-datePicker')).toBeInTheDocument();
  });

  test('renders datePicker with younger date', async () => {
    render(
      <DatePickerComponent
        name="birthdate"
        label="date"
        required
        hasAgeCheck
        control={result.current.control}
        errors={errors?.birthdate}
        setValue={setValue}
        readOnly
        defaultValue={new Date()}
        getDateErrors={getDateErrors}
      />
    );

    expect(screen.getByTestId('error-datePicker')).toBeInTheDocument();
  });
});

import React, { useState, useEffect } from 'react';
import { Controller, Control } from 'react-hook-form';
import DatePicker from 'react-date-picker';
import { subYears, differenceInMinutes, isBefore, format } from 'date-fns';
import { FieldErrors } from 'react-hook-form';
import classNames from 'classnames';

import './_datePicker.scss';

import SVG from '../SVG/SVG';

import Strings from './locale/fr.json';

interface DatePickerProps {
  name: string;
  label?: string;
  required?: boolean;
  hasAgeCheck: boolean;
  control: Control;
  setValue(arg1: string, arg2: string): void;
  errors: FieldErrors;
  getDateErrors: (arg: boolean) => void;
  readOnly?: boolean;
  defaultValue?: Date | undefined;
}

const ELIGIBLE_DATE = 16;
const MIN_DATE = '01/01/1900';

const DatePickerComponent = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      name,
      label,
      required = false,
      hasAgeCheck = false,
      readOnly = false,
      control = {},
      setValue,
      errors,
      getDateErrors,
      defaultValue,
    },
    ref
  ) => {
    const [dateValue, setDateValue] = useState<Date | null>();
    const [dateErrors, setDateErrors] = useState({});
    const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
    /**
     * Set component error to Yup error
     */
    useEffect(() => {
      if (errors) {
        setDateErrors({ [name]: errors?.message });
        getDateErrors(true);
      }
    }, [errors]);

    /**
     * Check if date is younger than 16 years
     */
    const checkAgeCitizen = (value: Date) => {
      const olderThan = subYears(new Date(), ELIGIBLE_DATE);
      return differenceInMinutes(olderThan, value) > 0;
    };

    /**
     * Handle component errors
     * @param date input value
     */
    const handleChange = (date: Date) => {
      if (date === null && required) {
        setDateErrors({
          ...dateErrors,
          [name]: Strings['citizens.error.date.required'],
        });
        getDateErrors(true);
      } else if (hasAgeCheck && !checkAgeCitizen(date)) {
        setDateErrors({
          ...dateErrors,
          [name]: Strings['citizens.error.birthdate.age'],
        });
        getDateErrors(true);
      } else if (isBefore(date, new Date(MIN_DATE))) {
        setDateErrors({
          ...dateErrors,
          [name]: Strings['citizens.error.date.format'],
        });
        getDateErrors(true);
      } else {
        const newDateErrors = { ...dateErrors };
        delete newDateErrors[name];
        setDateErrors(newDateErrors);
        getDateErrors(Object.keys(newDateErrors).length === 0 ? false : true);
      }
      setDateValue(date);
      setValue(name, format(new Date(date), 'dd/MM/yyyy'));
    };

    /**
     * set date value
     */
    useEffect(() => {
      if (readOnly) {
        handleChange(defaultValue);
      }
    }, []);
    /**
     * Display bloc error
     */
    const displayErrors = () => {
      if (Object.keys(dateErrors).length) {
        return (
          <span className="field__error" data-testid="error-datePicker">
            <SVG icon="warning" size={20} />
            {dateErrors[Object.keys(dateErrors)[0]]}
          </span>
        );
      }
      return null;
    };

    /**
     * On calendar Open
     */
    const handleOpenCanlendar = () => {
      setIsCalendarOpen(!isCalendarOpen);
    };

    const CSSClass = classNames('field', {
      'field--error': Object.keys(dateErrors).length,
    });

    return (
      <div className={CSSClass} data-testid="datePicker">
        {label && (
          <span className="field__label">
            {label}
            {required && <span aria-hidden="true"> *</span>}
          </span>
        )}
        <Controller
          control={control}
          name={name}
          render={() => (
            <DatePicker
              dayPlaceholder="JJ"
              monthPlaceholder="MM"
              yearPlaceholder="AAAA"
              onChange={(date: Date) => handleChange(date)}
              value={readOnly ? defaultValue : dateValue}
              ref={ref}
              format="dd/MM/yyyy"
              onCalendarOpen={() => handleOpenCanlendar()}
              showLeadingZeros
              disabled={readOnly}
            />
          )}
        />
        {displayErrors()}
      </div>
    );
  }
);

export default DatePickerComponent;

import React from 'react';
import { ErrorMessage } from '@hookform/error-message';
import { FieldErrors } from 'react-hook-form';

import SVG from '../SVG/SVG';
import Strings from './locale/fr.json';

import { getValueByString } from '@utils/helpers';

import classNames from 'classnames';
import './_text-field.scss';

interface InputProps {
  id: string;
  label?: string;
  name: string;
  type: 'text' | 'email' | 'url' | 'password' | 'number' | 'tel' | 'date';
  disabled?: boolean;
  errors: FieldErrors;
  classnames?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const TextField = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      name,
      type,
      disabled = false,
      errors,
      classnames,
      required,
      placeholder,
      maxLength,
      onBlur,
      onChange,
    },
    ref
  ) => {
    const CSSClass = classNames('field', classnames, {
      'field--error': getValueByString(errors, name),
    });
    return (
      <div className={CSSClass}>
        {label && (
          <label className="field__label" htmlFor={id}>
            {label}
            {required && <span aria-hidden="true"> *</span>}
          </label>
        )}
        <input
          className="field__text"
          type={type}
          id={id}
          name={name}
          disabled={disabled}
          ref={ref}
          placeholder={placeholder || Strings['placeholder']}
          maxLength={maxLength}
          onBlur={onBlur}
          onChange={onChange}
        />
        <ErrorMessage
          name={name}
          errors={errors}
          render={({ messages }): JSX.Element[] | null => {
            if (process.env.NODE_ENV !== 'development' && messages) {
              //console.log(messages);
            }
            if (messages) {
              return Object.entries(messages).map(([errorType, message]) => (
                <span className="field__error" key={errorType}>
                  <SVG icon="warning" size={20} />
                  {message}
                </span>
              ));
            }
            return null;
          }}
        />
      </div>
    );
  }
);

export default TextField;

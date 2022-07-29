import React from 'react';
import classNames from 'classnames';
import './_checkbox.scss';
import { ErrorMessage } from '@hookform/error-message';
import { FieldErrors } from 'react-hook-form';
import SVG from '../SVG/SVG';

interface Props {
  id: string;
  label?: string;
  name: string;
  size?: 'medium' | 'small';
  type: 'checkbox' | 'radio';
  value?: string;
  checked?: boolean;
  disabled?: boolean;
  errors?: FieldErrors;
  children?: React.ReactNode;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

/**
 * A checkbox element allows user to select value in form or elsewhere.
 */
const Checkbox = React.forwardRef<HTMLInputElement, Props>(
  (
    {
      id,
      label,
      name,
      size = 'medium',
      type,
      value,
      checked = false,
      disabled = false,
      errors,
      children,
      onBlur,
      onChange,
    },
    ref
  ) => {
    const CSSClass = classNames('checkbox-radio', {
      'checkbox--error': errors && errors[name],
      'checkbox--small': size === 'small',
    });

    const CSSLabel = classNames('field__label', {
      'field__label--small': size === 'small',
    });

    return (
      <div className={CSSClass}>
        <input
          type={type}
          id={id}
          data-testid={id}
          name={name}
          disabled={disabled}
          ref={ref}
          defaultChecked={checked}
          value={value ? value : ''}
          onBlur={onBlur}
          onChange={onChange}
        />
        <label className={CSSLabel} htmlFor={id}>
          {children ? children : label}
        </label>
        {errors && (
          <ErrorMessage
            name={name}
            errors={errors}
            render={({ messages }): JSX.Element[] | null => {
              if (process.env.NODE_ENV !== 'development' && messages) {
                console.log(messages);
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
        )}
      </div>
    );
  }
);

export default Checkbox;

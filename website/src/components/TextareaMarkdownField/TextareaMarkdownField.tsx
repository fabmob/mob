import React from 'react';
import classNames from 'classnames';
import { ErrorMessage } from '@hookform/error-message';
import { FieldErrors } from 'react-hook-form';
import SVG from '../SVG/SVG';
import Strings from './locale/fr.json';

interface TextareaMarkdownProps {
  cols?: number;
  rows?: number;
  id: string;
  label: string;
  name: string;
  disabled?: boolean;
  errors: FieldErrors;
  classnames?: string;
  placeHolder?: string;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}

const TextareaMarkdownField = React.forwardRef<
  HTMLTextAreaElement,
  TextareaMarkdownProps
>(
  (
    {
      cols,
      rows,
      id,
      label,
      name,
      disabled = false,
      errors,
      classnames,
      placeholder,
      onBlur,
      onChange,
    },
    ref
  ) => {
    const CSSClass = classNames('field', classnames, {
      'field--error': errors[name],
    });
    return (
      <div className={CSSClass}>
        <label className="field__label" htmlFor={id}>
          {label}
          <textarea
            className="field__text"
            cols={cols}
            rows={rows}
            id={id}
            name={name}
            disabled={disabled}
            ref={ref}
            placeholder={placeholder || Strings['placeholder']}
            onBlur={onBlur}
            onChange={onChange}
          />
        </label>
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
      </div>
    );
  }
);

export default TextareaMarkdownField;

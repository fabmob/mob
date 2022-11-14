import React from 'react';
import CreatableSelect from 'react-select/creatable';
import Select, { ActionMeta, components } from 'react-select';
import classNames from 'classnames';
import { FieldErrors, Controller, Control } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import SVG from '../SVG/SVG';
import './_select-field.scss';
import { OptionType } from '../FiltersSelect/FilterSelect';
import Strings from './locale/fr.json';

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  name: string;
  id: string;
  label: string;
  options: Option[];
  errors: FieldErrors;
  control: Control;
  defaultValue?: string;
  defaultOptions?: boolean;
  isSearchable?: boolean;
  isClearable?: boolean;
  placeholder?: string;
  classnames?: string;
  isMulti?: boolean;
  maxLimit?: number;
  isCreatable?: boolean;
  isLoading?: boolean;
  required?: boolean;
  onSelectChange?: (value: any, action?: ActionMeta<OptionType>) => void;
  disabled?: boolean;
}

// Can't use SVG component with sprite here because it causes icon flickering at each rerender
const SelectField: React.FC<SelectFieldProps> = ({
  name,
  id,
  label,
  options,
  errors,
  control,
  defaultValue = '',
  isSearchable = false,
  isClearable = false,
  placeholder = Strings['list.placeholder'],
  classnames,
  isMulti = false,
  maxLimit = 0,
  isCreatable = false,
  required = false,
  onSelectChange,
  isLoading,
  defaultOptions,
  disabled = false,
}) => {
  type SelectProps = React.ComponentProps<typeof Select>;

  const searchIcon = (
    <svg
      viewBox="0 0 22 23"
      xmlns="http://www.w3.org/2000/svg"
      data-testid="svg-icon"
    >
      <path
        d="M8 0a8 8 0 015.86 13.446l7.347 7.347a1 1 0 01-1.32 1.497l-.094-.083-7.473-7.472A8.001 8.001 0 011.598 3.205 8 8 0 018 0zm0 2a6 6 0 100 12A6 6 0 008 2z"
        fill="#01BF7D"
      />
    </svg>
  );

  const triangleIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      data-testid="svg-icon"
    >
      <path d="M20 25l5-10H15z" />
    </svg>
  );

  const deleteIcon = (
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.661 11.161a1 1 0 011.414 0l7.424 7.424 7.426-7.424a1 1 0 011.414 1.414L20.914 20l7.425 7.426a1 1 0 01.083 1.32l-.083.094a1 1 0 01-1.414 0l-7.426-7.425-7.424 7.425a1 1 0 01-1.414-1.414l7.424-7.426-7.424-7.424a1 1 0 01-.083-1.32z"
        fill="#01BF7D"
      />
    </svg>
  );

  const SelectWrapper = ({
    onChange,
    onBlur,
    value,
  }: Pick<SelectProps, 'onChange' | 'onBlur' | 'value'>): JSX.Element => {
    const DropdownIndicator = (props: any) => {
      return (
        <components.DropdownIndicator {...props}>
          {isSearchable ? searchIcon : triangleIcon}
        </components.DropdownIndicator>
      );
    };

    const ClearIndicator = (props: any) => {
      return (
        <components.ClearIndicator {...props}>
          {deleteIcon}
        </components.ClearIndicator>
      );
    };

    const CSSClass = classNames('field field__select', {
      'field__select--is-searchable': isSearchable,
    });

    return (
      <>
        {isCreatable ? (
          <CreatableSelect
            id="mcm-select"
            classNamePrefix="mcm-select"
            className={CSSClass}
            options={options}
            {...{ onChange, onBlur, value }}
            value={value}
            isSearchable={isSearchable}
            isClearable={isClearable}
            placeholder={placeholder}
            components={{ DropdownIndicator, ClearIndicator }}
            isMulti={isMulti}
            inputId={id}
            isLoading={isLoading}
            defaultOptions={defaultOptions}
            isDisabled={disabled}
          />
        ) : (
          <Select
            id="mcm-select"
            classNamePrefix="mcm-select"
            className={CSSClass}
            options={options}
            {...{ onChange, onBlur, value }}
            value={value}
            isSearchable={isSearchable}
            isClearable={isClearable}
            placeholder={placeholder}
            components={{ DropdownIndicator, ClearIndicator }}
            noOptionsMessage={(): string => Strings['list.noResult']}
            isMulti={isMulti}
            inputId={id}
            isLoading={isLoading}
            defaultOptions={defaultOptions}
            isDisabled={disabled}
            isOptionDisabled={() =>
              maxLimit ? value?.length >= maxLimit : false
            }
          />
        )}
      </>
    );
  };

  const filedClass = classNames('field', classnames, {
    'field--error': errors[name],
  });

  return (
    <div className={filedClass}>
      <label className="field__label" htmlFor={id}>
        {label} {required && <span aria-hidden="true"> *</span>}
      </label>
      <Controller
        defaultValue={maxLimit > 0 ? [] : defaultValue}
        name={name}
        control={control}
        render={({ field }): JSX.Element => (
          <SelectWrapper
            {...{
              onChange: (item: any, actionMeta: any): void => {
                field.onChange(
                  isMulti ? item : (item && item.value) || ''
                );
                if (onSelectChange) {
                  onSelectChange(item, actionMeta);
                }
              },
              value: isMulti
                ? field.value
                : options.find((item) => item.value === field.value), // set the default value by look up the options
            }}
          />
        )}
      />
      <ErrorMessage
        name={name}
        errors={errors}
        render={({ messages }): React.ReactNode => {
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
};

export default SelectField;

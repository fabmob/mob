import React, { FC, useState } from 'react';
import Select, { components, ControlProps, OptionProps } from 'react-select';

export interface OptionType {
  label: string;
  value: string;
}

interface FiltersSelectProps {
  options: OptionType[];
  isMulti: boolean;
  onSelectChange: (event: any) => void;
  placeholder: string;
  defaultValue?: OptionType;
  showSelectedValue?: boolean;
}

// Dropdown indicator for react-select
const DropdownIndicator = (props: any) => {
  return (
    <components.DropdownIndicator {...props}>
      <svg
        xmlns="https://www.w3.org/2000/svg"
        viewBox="0 0 40 40"
        data-testid="svg-icon"
      >
        <path d="M20 25l5-10H15z" />
      </svg>
    </components.DropdownIndicator>
  );
};

// Control for react-select
const Control = (props: ControlProps<any, any>) => (
  <div>
    {/* eslint-disable-next-line react/jsx-props-no-spreading */}
    <components.Control {...props} />
  </div>
);

// ValueContainer for react-select
const Placeholder = ({ children, ...props }: any) => {
  const { getValue, hasValue, selectProps } = props;
  const nbValues = getValue().length;
  if (!hasValue) {
    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <components.Placeholder {...props}>{children}</components.Placeholder>
    );
  }
  if (selectProps.showSelectedValue) {
    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <components.Placeholder {...props}>
        {`${children} (${selectProps.value.label})`}
      </components.Placeholder>
    );
  }
  return (
    <components.Placeholder {...props}>
      {`${children} (${nbValues})`}
    </components.Placeholder>
  );
};

// Option for react-select
const Option = (props: OptionProps<any, any>) => {
  const { label, isSelected } = props;
  return (
    <div>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <components.Option {...props}>
        <div className="checkbox-radio">
          <input type="checkbox" checked={isSelected} readOnly />
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="field__label">{label}</label>
        </div>
      </components.Option>
    </div>
  );
};
/**
 * Dropdown with checkboxes allowing to filter results
 * @param options
 * @param isMulti
 * @param onSelectChange
 * @param placeholder
 * @param showSelectedValue
 * @param defaultValue
 * @constructor
 */
const FilterSelect: FC<FiltersSelectProps> = ({
  options,
  isMulti,
  onSelectChange,
  placeholder,
  showSelectedValue = false,
  defaultValue = null,
}) => {
  const [selectedOption, setSelectedOption] = useState(defaultValue);

  const handleChange = (option: React.SetStateAction<OptionType | null>) => {
    setSelectedOption(option);
    return onSelectChange(option);
  };
  // TODO : Fix l'auto-focus sur la 1ère option après un clic sur une option. En attente de : https://github.com/JedWatson/react-select/issues/4370
  return (
    <Select
      classNamePrefix="mcm-select"
      className="field field__select"
      options={options}
      components={{
        DropdownIndicator,
        Control,
        ClearIndicator: () => null,
        Placeholder,
        Option,
      }}
      isMulti={isMulti}
      onChange={handleChange}
      hideSelectedOptions={false}
      closeMenuOnSelect={false}
      allowSelectAll
      isSearchable={false}
      isClearable={false}
      value={selectedOption}
      placeholder={placeholder}
      controlShouldRenderValue={false}
      blurInputOnSelect={false}
      showSelectedValue={showSelectedValue}
    />
  );
};

export default FilterSelect;

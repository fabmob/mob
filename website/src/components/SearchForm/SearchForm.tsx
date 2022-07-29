import React, { FC } from 'react';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import Button from '../Button/Button';
import Strings from './locale/fr.json';
import './_search-form.scss';

interface Props {
  onSubmit?: (searchTerm: string) => void;
  /** Initiale value of the input */
  searchText?: string | undefined;
  label?: string;
  placeholder?: string;
}

const SearchForm: FC<Props> = ({
  onSubmit,
  searchText,
  label,
  placeholder,
}) => {
  const schema = yup.object().shape({
    searchField: yup
      .string()
      .test(
        'search',
        'Votre recherche doit faire plus de 3 caractères',
        (value) =>
          value === '' ||
          value === null ||
          value === undefined ||
          value.length >= 3
      ),
  });

  const {
    register,
    handleSubmit,
    formState: { isDirty, isValid },
  } = useForm<{ searchField: string }>({
    mode: 'onChange',
    defaultValues: { searchField: searchText },
    resolver: yupResolver(schema),
  });

  const handleSearchSubmit = async ({
    searchField,
  }: {
    searchField: string;
  }): Promise<void> => {
    if (onSubmit) {
      onSubmit(searchField);
    }
  };

  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(handleSearchSubmit);
    }
  };

  return (
    <form
      className="mcm-search-form"
      onSubmit={handleSubmit(handleSearchSubmit)}
    >
      {/* eslint jsx-a11y/label-has-associated-control: ["error", { assert: "either" } ] */}
      {label && (
        <label className="field__label is-hidden" htmlFor="searchField">
          {label}
        </label>
      )}
      <input
        id="searchField"
        className="field__text search-field mb-xs"
        placeholder={placeholder}
        {...register('searchField')}
        onKeyDown={handleOnKeyDown}
        type="search"
      />
      <Button submit disabled={isDirty && !isValid} classnames="mb-m">
        {Strings['search.form.button']}
      </Button>
    </form>
  );
};

export default SearchForm;

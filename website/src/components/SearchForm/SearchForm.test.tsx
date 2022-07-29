import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import SearchForm from './SearchForm';

describe('<SearchForm />', () => {
  const label = 'Rechercher une aide';
  test('Submit form with no text', async () => {
    const handleSearch = jest.fn();
    const { getByText, getByLabelText } = render(
      <SearchForm onSubmit={handleSearch} label={label} />
    );
    await act(async () => {
      fireEvent.change(getByLabelText('Rechercher une aide'), {
        target: { value: '' },
      });
    });

    await act(async () => {
      fireEvent.click(getByText('Rechercher'));
    });

    expect(handleSearch).toHaveBeenCalled();
  });

  test('Submit form with less than 3 characters', async () => {
    const handleSearch = jest.fn();
    const { getByText, getByLabelText } = render(
      <SearchForm onSubmit={handleSearch} label={label} />
    );
    await act(async () => {
      fireEvent.change(getByLabelText('Rechercher une aide'), {
        target: { value: 'te' },
      });
    });

    await act(async () => {
      fireEvent.click(getByText('Rechercher'));
    });

    expect(handleSearch).not.toHaveBeenCalled();
  });

  test('Submit form with more than 3 characters', async () => {
    const handleSearch = jest.fn((value) => {
      expect(value).toEqual('test');
    });
    const { getByText, getByLabelText } = render(
      <SearchForm onSubmit={handleSearch} label={label} />
    );
    await act(async () => {
      fireEvent.change(getByLabelText('Rechercher une aide'), {
        target: { value: 'test' },
      });
    });

    await act(async () => {
      fireEvent.click(getByText('Rechercher'));
    });

    expect(handleSearch).toHaveBeenCalled();
  });
  test('Init default value and change it', async () => {
    const { getByLabelText } = render(
      <SearchForm searchText="my default value" label={label} />
    );
    const input = getByLabelText('Rechercher une aide').closest('input');
    await screen.findByDisplayValue('my default value');
    expect(input?.value).toBe('my default value');

    await act(async () => {
      fireEvent.change(getByLabelText('Rechercher une aide'), {
        target: { value: 'new value' },
      });
    });

    expect(input?.value).toBe('new value');
  });
});

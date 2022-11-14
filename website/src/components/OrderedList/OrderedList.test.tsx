import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderedList from './OrderedList';

describe('<OrderedList />', () => {
  test('Display items of ordered list', () => {
    const list = ['string', <span>html element</span>];
    const { getByText } = render(<OrderedList items={list} />);
    expect(getByText('string')).toBeInTheDocument();
    expect(getByText('html element')).toBeInTheDocument();
  });
});

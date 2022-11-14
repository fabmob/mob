import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import List from './List';

describe('<List />', () => {
  test('Display empty list', () => {
    const { container } = render(<List />);
    expect(container.getElementsByClassName('mcm-list').length).toBe(1);
    expect(container.getElementsByTagName('ul').length).toBe(1);
  });
  test('Display simple list', () => {
    const list = ['string', <div>html element</div>];
    const { getByText } = render(<List items={list} />);
    expect(getByText('string')).toBeInTheDocument();
    expect(getByText('html element')).toBeInTheDocument();
  });
  test('Display ordered list', () => {
    const { container } = render(<List ordered />);
    expect(container.getElementsByTagName('ol').length).toBe(1);
  });
});

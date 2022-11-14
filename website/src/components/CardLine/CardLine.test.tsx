import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import CardLine from './CardLine';

describe('<CardLine />', () => {
  test('Display empty card', () => {
    const { container } = render(<CardLine />);
    expect(container.getElementsByClassName('card-line').length).toBe(1);
    expect(container.getElementsByTagName('div').length).toBe(1);
  });

  test('Custom classnames does not override default classes', () => {
    const { container } = render(<CardLine classnames="custom-class" />);
    expect(container.getElementsByClassName('card-line').length).toBe(1);
    expect(container.getElementsByClassName('custom-class').length).toBe(1);
  });

  test('Display children element', () => {
    const { getByText } = render(<CardLine>Children String</CardLine>);
    expect(getByText('Children String')).toBeInTheDocument();
  });
});

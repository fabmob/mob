import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import CardLineColumn from './CardLineColumn';

describe('<CardLineColumn />', () => {
  test('Display empty column', () => {
    const { container } = render(<CardLineColumn />);
    expect(container.getElementsByClassName('card-line__column').length).toBe(
      1
    );
    expect(container.getElementsByTagName('div').length).toBe(1);
  });
  test('custom classnames does not override default classes', () => {
    const { container } = render(<CardLineColumn classnames="custom-class" />);
    expect(container.getElementsByClassName('card-line__column').length).toBe(
      1
    );
    expect(container.getElementsByClassName('custom-class').length).toBe(1);
  });
  test('Display children element', () => {
    const { getByText } = render(
      <CardLineColumn>Children String</CardLineColumn>
    );
    expect(getByText('Children String')).toBeInTheDocument();
  });
});

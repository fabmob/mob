import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import CardLineContent from './CardLineContent';

describe('<CardLineContent />', () => {
  test('Display empty card', () => {
    const { container } = render(<CardLineContent />);
    expect(container.getElementsByClassName('card-line__content').length).toBe(
      1
    );
    expect(container.getElementsByTagName('div').length).toBe(1);
  });
  test('custom classnames does not override default classes', () => {
    const { container } = render(<CardLineContent classnames="custom-class" />);
    expect(container.getElementsByClassName('card-line__content').length).toBe(
      1
    );
    expect(container.getElementsByClassName('custom-class').length).toBe(1);
  });
  test('Display children element', () => {
    const { getByText } = render(
      <CardLineContent>Children String</CardLineContent>
    );
    expect(getByText('Children String')).toBeInTheDocument();
  });
});

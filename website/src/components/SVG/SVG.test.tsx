import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import SVG from './SVG';

describe('SVG component', () => {
  it('should render the correct passed icon', () => {
    const { getByTestId } = render(<SVG icon="search" />);
    expect(getByTestId('svg-icon').firstChild).toHaveAttribute(
      'xlink:href',
      '[object Object]#search'
    );
  });

  it('should pass the correct size', () => {
    const { getByTestId } = render(<SVG icon="search" size={24} />);
    const component = getByTestId('svg-icon');
    expect(component).toHaveAttribute('width', '24');
    expect(component).toHaveAttribute('height', '24');
  });

  it('should pass any prop to SVG element', () => {
    const { getByTestId } = render(
      <SVG icon="search" size={24} className="mock-css-class" fill="red" />
    );
    const component = getByTestId('svg-icon');
    expect(component).toHaveAttribute('class', 'mock-css-class');
    expect(component).toHaveAttribute('fill', 'red');
  });
});

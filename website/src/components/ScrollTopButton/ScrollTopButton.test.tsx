import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import ScrollTopButton from './ScrollTopButton';

describe('ScrollTopButton component', () => {
  it('should render correctly', () => {
    window.scrollTo = jest.fn();
    const { getByLabelText } = render(<ScrollTopButton />);
    expect(getByLabelText('Return to top')).toBeInTheDocument();
    fireEvent.click(getByLabelText('Return to top'));
  });
});

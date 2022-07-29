import React from 'react';
import { render } from '@testing-library/react';
import CircleProgressBar from './CircleProgressBar';

describe('<CircleProgressBar />', () => {
    test('renders circle progress bar with 25 as value', () => {
      const max = 50;
      const value = 25;
      const text = 'text';
      const { getByTestId, getByText } = render(
        <CircleProgressBar max={max} value={value} text={text} />
      );
      expect(getByTestId('svg')).toHaveAttribute('viewBox', '0 0 180 180');
      expect(getByTestId('svg-circle-front')).toHaveAttribute('stroke-dasharray', '534.0707511102648');
      expect(getByTestId('svg-circle-front')).toHaveAttribute('stroke-dashoffset', '267.0353755551324')
      expect(getByText(text)).toBeInTheDocument();
      expect(getByText(value)).toBeInTheDocument();
    });

    test('renders circle progress bar with 0 as value', () => {
        const max = 50;
        const value = 0;
        const text = 'text';
        const { getByTestId, getByText } = render(
          <CircleProgressBar max={max} value={value} text={text} />
        );
        expect(getByTestId('svg')).toHaveAttribute('viewBox', '0 0 180 180');
        expect(getByTestId('svg-circle-front')).toHaveAttribute('stroke-dasharray', '534.0707511102648');
        expect(getByTestId('svg-circle-front')).toHaveAttribute('stroke-dashoffset', '534.0707511102648')
        expect(getByText(text)).toBeInTheDocument();
        expect(getByText(value)).toBeInTheDocument();
      });
});
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import TooltipInfoIcon from './TooltipInfoIcon';

describe('<TooltipInfoIcon />', () => {
  test('Display correct content', () => {
    const { queryByTestId } = render(
      <TooltipInfoIcon
        iconName="information"
        iconSize={20}
        tooltipContent="Test Tooltip"
      />
    );
    expect(queryByTestId('svg-icon')).toBeInTheDocument();
  });
});

import React from 'react';
import { render } from '@testing-library/react';
import Stepper from './Stepper';

describe('<Stepper />', () => {
  const stepperContent: string[] = ['Step 1', 'Step 2', 'Step 3'];
  const activeStep = 0;
  test('renders children text', () => {
    const { getByText } = render(
      <Stepper contents={stepperContent} activeStep={activeStep} />
    );
    expect(getByText('1 • Step 1')).toBeInTheDocument();
  });
});

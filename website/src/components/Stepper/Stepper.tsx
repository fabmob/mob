import React, { FC, Fragment } from 'react';
import './_stepper.scss';

interface StepsProps {
  contents: string[];
  activeStep: number;
}

const Stepper: FC<StepsProps> = ({ contents, activeStep }) => {
  /**
   * check if it's the last element of the stepper
   * @param index
   * @returns bool
   */
  const showStripe = (index: number) => {
    if (index + 1 < contents.length) return true;
    return false;
  };

  return (
    <div className="mcm-stepper">
      {contents.map((content, index) => {
        const value: string = content.replace(/\s/g, '').toLowerCase();
        return (
          <Fragment key={`step-${value}`}>
            <p className={`${index === activeStep && 'activeStep'}`}>
              {`${index + 1} `} &#8226; {` ${content}`}
            </p>
            <span>{`${showStripe(index) ? ' >' : ''}`}</span>
          </Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;

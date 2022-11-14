import React, { FC } from 'react';

interface StepsTitleProps {
  children?: string;
}

const StepsTitle: FC<StepsTitleProps> = ({ children }) => {
  return <p className="mcm-steps-title">{children}</p>;
};

export default StepsTitle;

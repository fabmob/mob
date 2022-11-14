import React, { FC } from 'react';
import StepsTitle from './StepsTitle';
import StepsItem, { StepsItemProps } from './StepsItem';
import './_step.scss';

interface StepsProps {
  title?: string;
  items?: StepsItemProps[];
}

const Steps: FC<StepsProps> = ({ title, items }) => {
  return (
    <div className="mcm-steps">
      {title && <StepsTitle>{title}</StepsTitle>}
      {items &&
        items.map(({ image, text }: StepsItemProps, index) => {
          const uniqueKey = `steps-item-${index}`;
          return <StepsItem key={uniqueKey} image={image} text={text} />;
        })}
    </div>
  );
};

export default Steps;

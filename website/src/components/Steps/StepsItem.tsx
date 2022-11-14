import React, { FC } from 'react';

export interface StepsItemProps {
  image?: string;
  text?: string;
}

const StepsItem: FC<StepsItemProps> = ({ image, text }) => {
  return (
    <div className="mcm-steps__item">
      <div className="step-img">
        <img src={image} alt="" />
      </div>
      <p className="step-text">{text}</p>
    </div>
  );
};

export default StepsItem;

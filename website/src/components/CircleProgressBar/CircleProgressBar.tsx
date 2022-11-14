import React, { FC } from 'react';
import classnames from 'classnames';
import './_circle-progress-bar.scss';

interface CircleProgressBarProps {
  classNames?: string;
  max: number;
  value: number;
  text: string;
}

const CircleProgressBar: FC<CircleProgressBarProps> = ({
  classNames,
  value,
  max,
  text,
}) => {
  const size = 180;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const dashArray = radius * Math.PI * 2;
  const dashOffset =
    max !== 0 ? dashArray - (dashArray * value) / max : dashArray;
  const viewBox = `0 0 ${size} ${size}`;

  const CSSClassCircle =
    max === 0
      ? classnames('mcm-front-circle')
      : classnames('mcm-front-circle', classNames);
  const CSSClassValue = classnames('mcm-value', classNames);
  return (
    <svg width={size} height={size} viewBox={viewBox} data-testid="svg">
      <circle
        className={'mcm-background-circle'}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={`${strokeWidth}px`}
      />
      <circle
        data-testid="svg-circle-front"
        className={CSSClassCircle}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={`${strokeWidth}px`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        className={CSSClassValue}
        x="55%"
        y="45%"
        dy="0.4rem"
        textAnchor="end"
      >
        {`${value}`}
      </text>
      <text x="50%" y="50%" dy="1.5rem" textAnchor="middle">
        {text}
      </text>
    </svg>
  );
};

export default CircleProgressBar;

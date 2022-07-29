import React, { FC } from 'react';
import SVG from '../SVG/SVG';
import './_arrow-link.scss';

interface ArrowLinkProps {
  label?: string;
}

const ArrowLink: FC<ArrowLinkProps> = ({ label }) => {
  return (
    <div className="mcm-arrow-link">
      {label && <span className="mcm-arrow-link__label">{label}</span>}
      <div className="mcm-arrow-link__icon">
        <SVG icon="arrow-right" />
      </div>
    </div>
  );
};

export default ArrowLink;

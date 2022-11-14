import React, { FC } from 'react';

import './_progressBar.scss';

/**
 * INTERFACES
 *
 *
 *
 *
 */
interface ProgressBarProps {
  partialCount: number,
  totalCount: number,
  percentageCount: number,
  singularSubject: string,
  pluralSubject: string
}

/**
 * Generic component used to render a card with the following attributes.
 * @param citizenTotalCount
 * @constructor
 */

const ProgressBar: FC<ProgressBarProps> = ({ partialCount, totalCount, percentageCount, singularSubject, pluralSubject }) => {
  return (
    <div className="mcm-progress-bar-container">
      {/* COUNTS / TEXT */}
      <div className="mcm-progress-bar-text-group">
        <div className="mcm-progress-bar-part-count-text">
          {partialCount === 1
            ? `${partialCount} ${singularSubject}`
            : `${partialCount} ${pluralSubject}`
          }
        </div>

        <div className="mcm-progress-bar-total-count-text">
          {totalCount}
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="mcm-progress-bar-body">
        <div className="mcm-total-count-progress" />
        <div className="mcm-partial-count-progress" style={{ width: `${percentageCount}%` }} />
      </div>
    </div>
  )
};

export default ProgressBar;

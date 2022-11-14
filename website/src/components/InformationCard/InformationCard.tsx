import React, { FC, useEffect, useState } from 'react';
import classNames from 'classnames';

import SVG from '@components/SVG/SVG';

import './_informationCard.scss';

interface Props {
  /** Primary content. */
  children?: React.ReactNode;
  title?: string;
  withBorder?: boolean;
}

const InformationCard: FC<Props> = ({
  children,
  title,
  withBorder = false,
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isExpended, setIsExpended] = useState<boolean>(false);

  useEffect(() => {
    if (window.innerWidth < 600) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }, []);

  /**
   * expend div or retract it
   */
  const handleExpend = () => {
    setIsExpended(!isExpended);
  };

  return (
    <div
      className={classNames('page-container additional-info information-card', {
        border: withBorder,
        expended: isExpended,
      })}
    >
      <div className="additional-info__header">
        {title === 'Contact' ? (
          <SVG icon="big-profile" size={20} />
        ) : (
          <SVG icon="trombone" size={20} />
        )}
        <span>{title}</span>
      </div>
      {children}
      {isMobile && (
        <button
          type="button"
          className={classNames('arrow_down', {
            rotate: isExpended,
          })}
          onClick={handleExpend}
        >
          <SVG icon="arrow-down" size={40} />
        </button>
      )}
    </div>
  );
};

export default InformationCard;

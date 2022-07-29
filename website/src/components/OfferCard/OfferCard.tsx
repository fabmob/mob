import React, { FC, useState, useEffect } from 'react';

import ProgressBar from './ProgressBar/ProgressBar';
import Strings from '@modules/mon-dashboard/pages/locale/fr.json';

import './_offerCard.scss';

/**
 * INTERFACE
 *
 *
 *
 *
 */
interface OfferCardProps {
  dataList: {
    incentiveList: object[];
    totalCitizensCount: number;
  };
}

/**
 * Generic component used to render a card with the following attributes.
 * @constructor
 */
const OfferCard: FC<OfferCardProps> = ({ dataList }) => {
  /**
   * STATES
   *
   *
   *
   *
   */
  const [incentiveList, setIncentiveList] = useState<Object[]>([]);

  /**
   * USE EFFECTS
   *
   *
   *
   *
   */
  useEffect(() => {
    if (dataList.incentiveList) {
      setIncentiveList(dataList.incentiveList);
    }
  }, [dataList.incentiveList]);

  /**
   * RENDER
   *
   *
   *
   *
   */
  return (
    <div className="mcm-offer-card-container">
      <div className="mcm-offer-card-content">
        {incentiveList.map((aide: any) => {
          const {
            incentiveId,
            incentiveTitle,
            totalSubscriptionsCount,
            validatedSubscriptionPercentage,
          } = aide;
          const { totalCitizensCount } = dataList;

          return (
            <div className="mcm-offer-card" key={incentiveId}>
              {/* TITLE */}
              <p className="mcm-offer-card-title">{incentiveTitle}</p>

              {/* COMMENT */}
              <div className="mcm-offer-card-comment">
                {totalSubscriptionsCount === 1
                  ? `${totalSubscriptionsCount} ${Strings['dashboard.offer.comment.singular.p1']}`
                  : `${totalSubscriptionsCount} ${Strings['dashboard.offer.comment.plural.p1']}`}{' '}
                {totalCitizensCount === 1
                  ? `${totalCitizensCount} ${Strings['dashboard.offer.comment.singular.p2']}`
                  : `${totalCitizensCount} ${Strings['dashboard.offer.comment.plural.p2']}`}{' '}
                {totalSubscriptionsCount === 1
                  ? `${Strings['dashboard.offer.comment.singular.p3']}`
                  : `${Strings['dashboard.offer.comment.plural.p3']}`}{' '}
              </div>

              {/* PERCENTAGE PROGRESSE BAR */}
              <div className="mcm-offer-card-percentage">
                <div className="mcm-offer-card-percentage__percentageText">
                  {`${validatedSubscriptionPercentage}%`}
                </div>

                {/* PROGRESS BAR */}
                <ProgressBar
                  partialCount={totalSubscriptionsCount}
                  totalCount={totalCitizensCount}
                  percentageCount={validatedSubscriptionPercentage}
                  singularSubject={`${Strings['dashboard.citizens.singular']}`}
                  pluralSubject={`${Strings['dashboard.citizens.plural']}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OfferCard;

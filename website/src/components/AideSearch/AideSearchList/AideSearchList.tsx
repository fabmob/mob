import React, { FC, ReactNode, useEffect, useState } from 'react';

import Button from '@components/Button/Button';
import Card from '@components/Card/Card';
import AideSearchGreenCard from '@components/AideSearch/AideSearchGreenCard/AideSearchGreenCard';

import { getDispositifImgFilename } from '@utils/getDispositifImage';
import { Incentive, aidesMapping } from '@utils/aides';
import { flattenTransportList } from '@utils/helpers';

import { environment } from '../../../environment';

import Strings from './locale/fr.json';

/**
 * INTERFACES
 */
interface Props {
  items: Incentive[];
  greenCard?: boolean;
}

/**
 * dispositif list length
 */
const dispositifListLength = 11;

const DEFAULT_LIMIT = environment.DEFAULT_LIMIT || 200;

/**
 * @name AideSearchList
 * @description This component is for listing the incentives
 */
const AideSearchList: FC<Props> = ({ items, greenCard }) => {
  /**
   * COMPONENT STATES
   * only the items currently displayed on the page
   */
  const [showedDispositifList, setShowedDispositifList] = useState<Incentive[]>(
    []
  );

  /**
   * get the incentive card
   * @returns JSX node
   */
  const renderDispositifs = (): ReactNode => {
    if (showedDispositifList && showedDispositifList.length > 0) {
      return showedDispositifList.map(
        (
          { id, title, minAmount, incentiveType, transportList, funderName },
          index
        ) => {
          const uniqueKey = `card-${index}`;
          return (
            <Card
              theId={`aide-page-${index}`}
              href={`/aide-page?id=${id}`}
              key={uniqueKey}
              imageFilename={getDispositifImgFilename(transportList)}
              title={title}
              funderName={funderName}
              tags={[
                ...flattenTransportList(transportList),
                aidesMapping[incentiveType],
              ]}
              value={minAmount}
            />
          );
        }
      );
    }
    return null;
  };

  /**
   * displays the 12 next items in the list
   */
  const renderNextItems = () => {
    const newItems = items.slice(
      showedDispositifList.length,
      showedDispositifList.length + dispositifListLength
    );
    setShowedDispositifList([...showedDispositifList, ...newItems]);
  };

  /**
   * USE EFFECTS
   */
  useEffect(() => {
    setShowedDispositifList(items.slice(0, 10));
  }, [items]);

  /**
   * RENDER
   */
  return (
    <>
      <div className="mcm-dispositifs">
        {greenCard && <AideSearchGreenCard />}
        {renderDispositifs()}
      </div>

      {showedDispositifList.length >= DEFAULT_LIMIT && (
        <p className="limit-msg">
          {Strings['incentives.limit.message'].replace(
            '{0}',
            `${DEFAULT_LIMIT}`
          )}
        </p>
      )}

      {showedDispositifList.length < items.length && (
        <div className="load-more">
          <Button secondary onClick={renderNextItems}>
            {Strings['show.result']}
          </Button>
        </div>
      )}
    </>
  );
};

export default AideSearchList;

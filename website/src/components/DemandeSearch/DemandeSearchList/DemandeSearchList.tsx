import React, { FC, ReactNode, useEffect, useState } from 'react';

import { Subscription, STATUS } from '@utils/demandes';

import CardRequest from '../../CardRequest/CardRequest';
import Button from '../../Button/Button';

import Strings from './locale/fr.json';
import './_demande-search-list.scss';

interface Props {
  items: Subscription[];
}

const DemandeSearchList: FC<Props> = ({ items }) => {
  // only the items currently displayed on the page
  const [showedDemandeList, setshowedDemandeList] = useState<Subscription[]>(
    []
  );

  useEffect(() => {
    setshowedDemandeList(items.slice(0, 10));
  }, [items]);

  const renderDispositifs = (): ReactNode => {
    if (showedDemandeList && showedDemandeList.length > 0) {
      return showedDemandeList.map((demande, index) => {
        const uniqueKey = `card-${index}`;
        return <CardRequest request={demande} key={uniqueKey} />;
      });
    }
    return null;
  };

  // Displays the 10 next items in the list
  const renderNextItems = () => {
    const newItems = items.slice(
      showedDemandeList.length,
      showedDemandeList.length + 10
    );
    setshowedDemandeList([...showedDemandeList, ...newItems]);
  };

  return (
    <>
      <div className="mcm-dispositifs">{items && renderDispositifs()}</div>
      {showedDemandeList.length < items.length && (
        <div className="load-more">
          <Button secondary onClick={renderNextItems}>
            {Strings['employees.button.load.more']}
          </Button>
        </div>
      )}
    </>
  );
};

export default DemandeSearchList;

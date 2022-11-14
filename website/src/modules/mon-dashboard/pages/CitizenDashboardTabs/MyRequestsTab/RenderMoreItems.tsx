import React, { FC } from 'react';
import Button from '@components/Button/Button';
import { Subscription } from '@utils/demandes';
import Strings from '../../locale/fr.json';

const MORE_ITEMS = 5;

interface RenderMoreItemsProps {
  subscriptions: Subscription[];
  subscriptionsToDisplay: Subscription[];
  setItemsToDisplay: Function;
}

const RenderMoreItems: FC<RenderMoreItemsProps | null> = (props) => {
  const { subscriptions, subscriptionsToDisplay, setItemsToDisplay } = props;
  const renderNextItems = () => {
    const newItems = subscriptions.slice(
      subscriptionsToDisplay?.length,
      subscriptionsToDisplay?.length + MORE_ITEMS
    );
    setItemsToDisplay([...subscriptionsToDisplay, ...newItems]);
  };

  return subscriptionsToDisplay.length < subscriptions.length ? (
    <div className="load-more-items">
      <Button secondary onClick={renderNextItems}>
        {Strings['dashboard.citizen.subscriptions.render.more.items']}
      </Button>
    </div>
  ) : (
    <></>
  );
};

export default RenderMoreItems;

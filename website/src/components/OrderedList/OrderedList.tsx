import React, { FC, ReactNode } from 'react';
import OrderedListItem from './OrderedListItem';
import './_ordered-list.scss';

interface OrderedListProps {
  items?: ReactNode[];
}

const OrderedList: FC<OrderedListProps> = ({ items }) => {
  return (
    <ol className="mcm-ordered-list">
      {items &&
        items.map((item, index) => {
          const uniqueKey = `ordered-list-item-${index}`;
          return <OrderedListItem key={uniqueKey}>{item}</OrderedListItem>;
        })}
    </ol>
  );
};

export default OrderedList;

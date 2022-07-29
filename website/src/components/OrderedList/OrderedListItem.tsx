import React, { FC, ReactNode } from 'react';

export interface OrderedListItemProps {
  children?: ReactNode;
}

const OrderedListItem: FC<OrderedListItemProps> = ({ children }) => {
  return <li className="mcm-ordered-list__item">{children}</li>;
};

export default OrderedListItem;

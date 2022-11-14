import React, { FC, ReactNode } from 'react';

export interface ListItemProps {
  children?: ReactNode;
}

const ListItem: FC<ListItemProps> = ({ children }) => {
  return <li className="mcm-list__item">{children}</li>;
};

export default ListItem;

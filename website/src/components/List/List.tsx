import classNames from 'classnames';
import React, { FC, ReactNode } from 'react';
import ListItem from './ListItem';
import './_list.scss';

type ListMarkers = 'arrow' | 'check';

interface Props {
  classnames?: string;
  items?: ReactNode[];
  marker?: ListMarkers;
  ordered?: boolean;
  relaxed?: boolean;
  nospace?: boolean;
}

/**
 * Component that display a list of related items.
 * @param className
 * @param items
 * @param marker
 * @param ordered
 * @param relaxed
 * @param nospace
 * @constructor
 */
const List: FC<Props> = ({
  classnames,
  marker,
  items,
  ordered = false,
  relaxed = false,
  nospace = false,
}) => {
  const ComponentType = ordered ? 'ol' : 'ul';
  const CSSClass = classNames('mcm-list', classnames, {
    'mcm-list--ordered': ordered,
    'mcm-list--check': marker === 'check',
    'mcm-list--arrow': marker === 'arrow',
    'mcm-list--relaxed': relaxed,
    'mcm-list--nospace': nospace,
    // [`mcm-list--${marker}`]: marker !== undefined, I don't know why but doesn't work ;-(
  });
  return (
    <ComponentType className={CSSClass}>
      {items &&
        items.map((item, index) => {
          const uniqueKey = `list-item-${index}`;
          return <ListItem key={uniqueKey}>{item}</ListItem>;
        })}
    </ComponentType>
  );
};

export default List;

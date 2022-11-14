import React, { FC } from 'react';
import classNames from 'classnames';

interface Props {
  /** Primary content. */
  children?: React.ReactNode;

  /** Additional classes. */
  classnames?: string;
}

const CardLineContent: FC<Props> = ({ children, classnames }) => {
  const CSSClass = classNames('card-line__content', classnames);

  return <div className={CSSClass}>{children}</div>;
};

export default CardLineContent;

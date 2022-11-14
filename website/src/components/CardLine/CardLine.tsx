import React, { FC } from 'react';
import classNames from 'classnames';
import './_card-line.scss';

interface Props {
  /** Primary content. */
  children?: React.ReactNode;

  /** Additional classes. */
  classnames?: string;
}

const CardLine: FC<Props> = ({ children, classnames }) => {
  const CSSClass = classNames('card-line', classnames);
  return <div className={CSSClass}>{children}</div>;
};

export default CardLine;

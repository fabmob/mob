import React, { FC, ReactNode } from 'react';
import classNames from 'classnames';
import './_heading.scss';

export type HeadingColor =
  | 'blue'
  | 'blue-dark'
  | 'dark'
  | 'grey-dark'
  | 'grey-mid'
;

export type HeadingLevel = 'h1' | 'h2' | 'h3';

interface Props {
  /** Primary content. */
  children?: ReactNode;
  /** Additional classes. */
  className?: string;
  /** Color of the header. */
  color?: HeadingColor;
  /** Heading element can be display like another heading. */
  like?: HeadingLevel;
  /** Correspond of the heanding level. */
  level?: HeadingLevel;
}

/**
 * @name Heading
 * @description .
 * @type [UI Presenter]
 */
const Heading: FC<Props> = ({ className, children, color, like, level }) => {
  const classes = classNames(className, {
    [`${like}-like`]: like !== undefined,
    [`${color}`]: color !== undefined,
  });

  const ComponentType = level !== undefined ? level : 'h1';

  return <ComponentType className={classes}>{children}</ComponentType>;
};

export default Heading;

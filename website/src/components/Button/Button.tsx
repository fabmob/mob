import React from 'react';

import classNames from 'classnames';
import SVG, { SVGIcons } from '../SVG/SVG';

import './_button.scss';

interface ButtonProps {
  /** Primary content. */
  children?: React.ReactNode;
  classnames?: string;
  disabled?: boolean;
  icon?: SVGIcons;
  inverted?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  secondary?: boolean;
  submit?: boolean;
  basic?: boolean;
}

/**
 * Renders primary or secondary UI button
 * @param children
 * @param classnames
 * @param disabled
 * @param icon
 * @param onClick
 * @param secondary
 * @param submit
 * @param basic

 * @constructor
 */
const Button: React.FC<ButtonProps> = ({
  children,
  classnames,
  disabled = false,
  icon,
  inverted,
  onClick,
  secondary = false,
  submit = false,
  basic = false,
}) => {
  const CSSClass = classNames('button', classnames, {
    'button--secondary': secondary,
    'button--icon': icon,
    'button--inverted': inverted,
  });

  return (
    <button
      type={submit ? 'submit' : 'button'}
      className={basic ? classnames : CSSClass}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <SVG icon={icon} />}
      {children}
    </button>
  );
};

export default Button;

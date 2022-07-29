import React, { FC, ReactNode, SVGProps } from 'react';
import SVGSprite from '../../assets/svg/sprite/sprite.svg';

export type SVGIcons =
  | 'download-xlsx'
  | 'big-profile'
  | 'profil-card'
  | 'pdf'
  | 'arrow-right'
  | 'close'
  | 'information'
  | 'logo-mobile'
  | 'logo-with-baseline'
  | 'logo-baseline'
  | 'menu'
  | 'play'
  | 'play-green'
  | 'profile'
  | 'search'
  | 'triangle-down'
  | 'triangle-up'
  | 'valid'
  | 'visible'
  | 'download'
  | 'warning'
  | 'addFile'
  | 'add'
  | 'grey-add'
  | 'arrow-down'
  | 'arrow-up'
  | 'trombone'
  | 'success'
  | 'pdf-icon'
  | 'jpeg-icon'
  | 'jpg-icon'
  | 'png-icon'
  | 'wip'
  | 'error';

interface Props extends SVGProps<SVGSVGElement> {
  icon: SVGIcons;
  size?: number;
  children?: ReactNode;
}

/**
 * Renders a SVG from the sprite.svg file.
 * @param children
 * @param icon
 * @param size
 * @param rest
 * @constructor
 */
const SVG: FC<Props> = ({ children, icon, size, ...rest }) => {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <svg width={size} height={size} {...rest} data-testid="svg-icon">
      {children}
      <use xlinkHref={`${SVGSprite}#${icon}`} />
    </svg>
  );
};

export default SVG;

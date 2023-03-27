import React, { FC } from 'react';
import Tippy from '@tippyjs/react';
import SVG, { SVGIcons } from '../SVG/SVG';

interface TooltipProps {
  tooltipContent: string;
  placement?: any;
  iconName: SVGIcons;
  iconSize: number;
}

const TooltipInfoIcon: FC<TooltipProps> = ({
  tooltipContent,
  placement = 'top',
  iconName,
  iconSize,
}) => {
  return (
    <Tippy
      content={tooltipContent}
      className={`form-tooltip ${
        iconName === 'error' ? 'form-tooltip__error' : 'form-tooltip__info'
      }`}
      trigger="mouseenter focus"
      aria={{ content: 'describedby' }}
      maxWidth={330}
      placement={placement}
      offset={[0, 16]}
    >
      <p>
        <SVG size={iconSize} icon={iconName} />
      </p>
    </Tippy>
  );
};

export default TooltipInfoIcon;

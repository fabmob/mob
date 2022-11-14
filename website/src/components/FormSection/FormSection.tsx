import React, { FC } from 'react';
import classNames from 'classnames';
import Tippy from '@tippyjs/react';
import SVG from '../SVG/SVG';
import './_form-section.scss';

interface FormSectionProps {
  sectionName: string;
  tooltip?: string;
  largeSpacing?: boolean;
}

const FormSection: FC<FormSectionProps> = ({
  sectionName,
  tooltip,
  largeSpacing = false,
  children,
}) => {
  const tooltipContent = (
    <Tippy
      content={tooltip}
      className="form-tooltip"
      trigger="mouseenter focus"
      aria={{ content: 'describedby' }}
      maxWidth={330}
      placement="top"
      offset={[0, 16]}
    >
      <button className="form-tooltip__trigger" type="button">
        <SVG className="form-tooltip__icon" size={20} icon="information" />
      </button>
    </Tippy>
  );

  const CSSClass = classNames('fieldset', {
    'fieldset--large-spacing': largeSpacing,
  });

  return (
    <fieldset className={CSSClass}>
      <legend className="form-section-title">
        {sectionName}
        {tooltip && <span className="tooltip">{tooltipContent}</span>}
      </legend>

      <div className="form__fields">{children}</div>
    </fieldset>
  );
};
export default FormSection;

import React, { FC, ReactChild } from 'react';
import Heading from '../../../../components/Heading/Heading';
import './_request-body.scss';

import { format } from 'date-fns';
import SVG from '@components/SVG/SVG';
import Strings from './locale/fr.json';

interface Props {
  date?: Date;
  title?: string;
  description?: string;
  useIcon?: boolean;
  iconName?: string;
  children?: any;
}

/**
 * @name RequestBody
 * @description .
 * @type [UI Presenter]
 */
const RequestBody: FC<Props> = ({ date, title, description, useIcon, iconName, children }) => {
  return (
    <div className="request-body o-bg-wrapper">
      {date && (
        <time dateTime={date.toTimeString()} className="request-date p-like">
          {Strings['request.body.date.label']} {format(date, 'dd/MM/yyyy')} {Strings['request.body.date.label.to']} {format(date, "H'h'mm")}
        </time>
      )}
      <Heading like="h2">{title}</Heading>
      <div className="request-description p-like">
        {useIcon && iconName && <SVG icon={iconName} size={20} />}
        {description}
      </div>
      {children}
    </div>
  );
};

export default RequestBody;

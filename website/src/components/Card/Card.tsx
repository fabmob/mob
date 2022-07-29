import React, { FC } from 'react';

import Image from '../Image/Image';
import classnames from 'classnames';

import Heading from '../Heading/Heading';

import Strings from './locale/fr.json';
import './_card.scss';

interface CardProps {
  theId?: string;
  href?: string;
  onClick?: any;
  imageFilename?: string;
  title: string;
  funderName?: string;
  value?: string;
  tags?: string[];
  footerElement?: JSX.Element;
  classNames?: string;
  buttonMode?: boolean;
}

interface TagsProps {
  tags?: string[];
}

export const RenderTags: FC<TagsProps> = ({ tags }) => {
  return (
    <>
      {tags &&
        tags.map((tag, index) => {
          return (
            <span
              data-testid="tagComponent"
              key={`tag-${index}`}
              className="card-body-tags__tag"
            >
              {tag}
            </span>
          );
        })}
    </>
  );
};

/**
 * Generic component used to render a card with the following attributes.
 * @param theId
 * @param href
 * @param onClick
 * @param imageFilename
 * @param title
 * @param funderName
 * @param value
 * @param tags
 * @param footerElement
 * @param classNames
 * @param buttonMode
 * @constructor
 */
const Card: FC<CardProps> = ({
  theId,
  href = '#',
  onClick,
  imageFilename,
  title,
  funderName,
  value,
  tags,
  footerElement = <span>{Strings['show.detail']}</span>,
  classNames,
  buttonMode = false,
}) => {
  const CommonComponent = (
    <>
      <div className="mcm-card__header">
        {imageFilename && (
          <div className="card-header-img">
            <Image filename={imageFilename} />
          </div>
        )}
        <div className="mcm-card__title">
          <Heading level="h3">{title}</Heading>
          {funderName && <p className="funder_name">{funderName}</p>}
        </div>
      </div>
      <div className="mcm-card__body">
        <span className="body-title">{value}</span>
        <div className="card-body-tags">
          <RenderTags tags={tags} />
        </div>
      </div>
      <div className="mcm-card__footer">{footerElement}</div>
    </>
  );

  const CSSClass = classnames('mcm-card', classNames);

  return buttonMode ? (
    <a
      id={theId}
      target="_blank"
      rel="noreferrer"
      className={CSSClass}
      onClick={() => onClick()}
    >
      {CommonComponent}
    </a>
  ) : (
    <a
      id={theId}
      target="_blank"
      rel="noreferrer"
      href={href}
      className={CSSClass}
    >
      {CommonComponent}
    </a>
  );
};

export default Card;

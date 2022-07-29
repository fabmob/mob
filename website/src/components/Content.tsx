import React, { FC } from 'react';

interface ContentProps {
  content: string;
  className: string;
}

export const HTMLContent: FC<ContentProps> = ({ content, className }) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: content }} />
);

const Content: FC<ContentProps> = ({ content, className }) => (
  <div className={className}>{content}</div>
);

export default Content;

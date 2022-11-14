import React, { FC, useState } from 'react';
import SVG from '../SVG/SVG';

import './_collapsable-block.scss';

const CollapsableBlock: FC<{ title: string; content: string }> = ({
  title,
  content,
}) => {
  const [showContent, setShowContent] = useState<boolean>(false);

  const handleClickComments = () => {
    setShowContent(!showContent);
  };

  return (
    <div className={`collapsable-block-container ${content ? '' : 'hidden'}`}>
      <hr className="" />
      <div className="title" onClick={handleClickComments}>
        <span>{title}</span>
        <span className="title-icon">
          <SVG icon={showContent ? 'arrow-up' : 'arrow-down'} size={40} />
        </span>
      </div>
      {showContent && <div className="description">{content}</div>}
    </div>
  );
};

export default CollapsableBlock;

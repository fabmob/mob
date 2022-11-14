import React, { FC, useState } from 'react';
import SVG from '../../SVG/SVG';
import { Question } from '@utils/faq';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import './_faq-collapse.scss';

const FaqCollapse: FC<Question> = ({ title, answer }) => {
  const [showAnswer, setShowAnswer] = useState<boolean>(false);

  const handleClickComments = () => {
    setShowAnswer(!showAnswer);
  };

  return (
    <div className="faq-collapse-container">
      <div className="title" onClick={handleClickComments}>
        <h3 className="question-title">{title}</h3>
        <span className="title-icon">
          <SVG icon={showAnswer ? 'arrow-up' : 'arrow-down'} size={40} />
        </span>
      </div>
      {showAnswer && (
        <ReactMarkdown
          className="description"
          children={answer}
          remarkPlugins={[remarkGfm]}
        />
      )}
      <hr className="" />
    </div>
  );
};

export default FaqCollapse;

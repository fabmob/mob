import React, { FC } from 'react';
import FaqCollapse from '../FaqCollapse/FaqCollapse';
import { Question, Bloc } from '@utils/faq';

import './_faq-bloc.scss';

const FaqBloc: FC<Bloc> = ({ blocTitle, questions }) => {
  return (
    <div className="">
      <div className="blocTitle">
        <h2>{blocTitle}</h2>
      </div>
      {questions?.length > 0 && (
        <>
          {questions?.map((question: Question) => (
            <FaqCollapse
              key={question.title}
              title={question.title}
              answer={question.answer}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default FaqBloc;

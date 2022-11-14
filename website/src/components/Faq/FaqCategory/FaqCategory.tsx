import React, { FC } from 'react';
import FaqBloc from '../FaqBloc/FaqBloc';
import { Bloc, Category } from '@utils/faq';

import './_faq-category.scss';

const FaqCategory: FC<Category> = ({ categoryTitle, bloc }) => {
  return (
    <div className="">
      <div className="category-title">
        <h2 className="">{categoryTitle}</h2>
      </div>
      {bloc?.length > 0 && (
        <>
          {bloc?.map((bloc: Bloc) => (
            <FaqBloc
              key={bloc.blocTitle}
              blocTitle={bloc.blocTitle}
              questions={bloc.questions}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default FaqCategory;

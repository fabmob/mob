import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import FaqCollapse from './FaqCollapse';

describe('<FaqCollapse />', () => {
  test('renders FaqCollapse with content', async () => {
    const { findByText, getByText } = render(
      <FaqCollapse
        title="Question"
        answer="Ceci est la réponse à la question"
      />
    );
    expect(getByText('Question')).toBeInTheDocument();
    const showAnswerBtn = await findByText('Question');
    fireEvent.click(showAnswerBtn);
    expect(await findByText('Ceci est la réponse à la question')).toBeInTheDocument();
  });
  test('renders FaqCollapse without content', async () => {
    const { getByText } = render(
      <FaqCollapse title="Question" answer="" />
    );
    expect(getByText('Question')).toBeInTheDocument();
  });
});

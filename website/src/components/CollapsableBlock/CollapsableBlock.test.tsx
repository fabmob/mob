import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import CollapsableBlock from './CollapsableBlock';

describe('<CollapsableBlock />', () => {
  test('renders CollapsableBlock with content', async () => {
    const { findByText, getByText } = render(
      <CollapsableBlock
        title="Commentaires"
        content="Ceci est un commentaire"
      />
    );
    expect(getByText('Commentaires')).toBeInTheDocument();
    const showCommentBtn = await findByText('Commentaires');
    fireEvent.click(showCommentBtn);
    expect(await findByText('Ceci est un commentaire')).toBeInTheDocument();
  });
  test('renders CollapsableBlock without content', async () => {
    const { findByText, getByText } = render(
      <CollapsableBlock title="Commentaires" content="" />
    );
    expect(getByText('Commentaires')).toBeInTheDocument();
  });
});

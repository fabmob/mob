import React from 'react';
import { render, waitFor } from '@testing-library/react';

import Head from './Head';

import Strings from './locale/fr.json';

describe('<Head />', () => {
  it('Default title to be in the document ', async () => {
    render(<Head />);

    await waitFor(() => {
      expect(document.title).toBe(
        `${Strings['head.defaultTitle']} ${Strings['head.separator']} ${Strings['head.siteName']}`
      );
    });
  });

  it('Random title to be in the document ', async () => {
    const randomTitle: string = 'Random';
    render(<Head title={randomTitle} />);

    await waitFor(() => {
      expect(document.title).toBe(
        `${randomTitle} ${Strings['head.separator']} ${Strings['head.siteName']}`
      );
    });
  });
  it('Random description to be in the document ', async () => {
    const description: string = 'Random';
    render(<Head title={description} description={description} />);

    await waitFor(() => {
      expect(document?.querySelector('meta[name="description"]')?.content).toBe(
        description
      );
    });
  });
});

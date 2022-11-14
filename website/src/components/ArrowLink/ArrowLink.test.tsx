import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArrowLink from './ArrowLink';

describe('<ArrowLink />', () => {
  test('ArrowLink renders with correct text and href', () => {
    const { getByText } = render(
      <ArrowLink href="/test" label="Cliquez ici" />
    );
    expect(getByText('Cliquez ici')).toBeInTheDocument();
  });
});

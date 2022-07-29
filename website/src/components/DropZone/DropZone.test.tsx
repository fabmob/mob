import React from 'react';
import { render } from '@testing-library/react';
import DropZone from './DropZone';

jest.mock('../Image/Image.tsx');

describe('<DropZone />', () => {
  const value = 'ou glisser / déposer vos documents ici';

  test('renders children text', () => {
    const { getByText } = render(
      <DropZone dropFileAction={() => {}}>{value}</DropZone>
    );
    expect(getByText(value)).toBeInTheDocument();
  });
});

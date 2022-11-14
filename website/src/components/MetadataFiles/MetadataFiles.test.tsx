import React from 'react';
import { render } from '@testing-library/react';
import MetadataFiles from './MetadataFiles';

describe('<MetadataFiles />', () => {
  const value = 'FileName.jpg';

  test('renders children text', () => {
    const { getByText } = render(<MetadataFiles fileName={value} />);
    expect(getByText(value)).toBeInTheDocument();
  });
});
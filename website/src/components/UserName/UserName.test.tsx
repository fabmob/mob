import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserName from './UserName';

jest.mock('../Image/Image.tsx');

describe('<UserName />', () => {
  test('Display correct content', () => {
    const { getByText } = render(<UserName userName="User Name" />);
    expect(getByText('User Name')).toBeInTheDocument();
  });
});

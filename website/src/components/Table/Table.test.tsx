import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Table from './Table';

const addressList = [
  { label: 'Ville', json: 'city', type: 'text' },
  { label: 'Code postal', json: 'postcode', type: '' },
];

const user = {
  authenticated: false,
  email: null,
  email_verified: false,
  name: null,
  family_name: null,
  given_name: null,
  roles: null,
  id: null,
  birthdate: null,
  city: 'Tunis',
  postcode: '2050',
  status: null,
};

describe('<Table />', () => {
  test('Display correct content', () => {
    const { getByText } = render(
      <Table inputFormatList={addressList} data={user} />
    );
    const mainContainer = getByText('Ville');
    expect(mainContainer).toHaveTextContent('Ville');
    expect(getByText('Tunis')).toBeInTheDocument();
    expect(getByText('Code postal')).toBeInTheDocument();
    expect(getByText('2050')).toBeInTheDocument();
  });
});

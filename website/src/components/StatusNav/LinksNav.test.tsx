import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import LinksNav from './LinksNav';

const navLinks = [
  { label: 'Citoyen.ne', path: '/', active: true },
  { label: 'Employeur', path: '/#employeur', active: false },
  { label: 'Collectivité', path: '/#collectivite', active: false },
  { label: 'Opérateur de mobilité', path: '/#operateur', active: false },
];

describe('<Button />', () => {
  it('should display a link with the correct href for each element in the navItems array', () => {
    const { getByText } = render(<LinksNav navItems={navLinks} />);
    expect(getByText('Citoyen.ne').closest('a')).toHaveAttribute('href', '/');
    expect(getByText('Employeur').closest('a')).toHaveAttribute(
      'href',
      '/#employeur'
    );
  });
});

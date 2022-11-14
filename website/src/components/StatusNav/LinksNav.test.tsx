import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';

import LinksNav from './LinksNav';

const navLinks = [
  { label: 'Citoyen.ne', path: '/', active: true },
  { label: 'Employeur', path: '/#employeur', active: false },
  { label: 'Collectivité', path: '/#collectivite', active: false },
  { label: 'Opérateur de mobilité', path: '/#operateur', active: false },
];

const navLinks2 = [
  { label: 'Ide de france', active: true },
  { label: 'Mulhouse', active: false },
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

  it('should display label and fire a click event when path is not provided', () => {
    const { getByText } = render(<LinksNav navItems={navLinks2} />);
    fireEvent.click(getByText('Mulhouse'));
  });
});

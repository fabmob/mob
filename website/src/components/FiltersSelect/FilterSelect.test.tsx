import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterSelect from './FilterSelect';

describe('FilterSelect component', () => {
  const transportsOptions = [
    { value: 'transportsCommun', label: 'Transports en commun' },
    { value: 'velo', label: 'Vélo' },
    { value: 'voiture', label: 'Voiture' },
    { value: 'libreService', label: '2 ou 3 roues en libre-service' },
    { value: 'electrique', label: '2 ou 3 roues électrique' },
    { value: 'autopartage', label: 'Autopartage' },
    { value: 'covoiturage', label: 'Covoiturage' },
  ];
  const onSelectChange = jest.fn();
  test('FilterSelect component renders with correct placeholder', () => {
    const { getByText } = render(
      <FilterSelect
        isMulti
        options={transportsOptions}
        onSelectChange={onSelectChange}
        placeholder="Modes de transport"
      />
    );
    expect(getByText('Modes de transport')).toBeInTheDocument();
  });
});

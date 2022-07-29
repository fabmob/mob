import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import DashboardFilters from './DashboardFilters';

describe('DashboardFilters Component', () => {
  const onFiltersChanges = jest.fn();
  test('DashboardFilters component renders with correct placeholder', () => {
    const currentYear: string = new Date().getFullYear().toString();
    const { getByText } = render(<DashboardFilters filtersChanges={onFiltersChanges} />);

    expect(getByText(`Année (${currentYear})`)).toBeInTheDocument();
    expect(getByText('Semestre (1 & 2)')).toBeInTheDocument();
  });

  test('DashboardFilters component renders 2 filters fields', () => {
    const { getAllByTestId } = render(<DashboardFilters filtersChanges={onFiltersChanges} />);

    expect(getAllByTestId('svg-icon')).toHaveLength(2);
  });
});

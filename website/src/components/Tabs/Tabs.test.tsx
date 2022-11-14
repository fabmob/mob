import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Tab from './Tabs';
import { STATUS } from '../../utils/demandes';

const tabs = [
  {
    id: 0,
    tabLabel: 'A traiter',
    statusState: STATUS.TO_PROCESS,
  },
  {
    id: 1,
    tabLabel: 'Validées',
    statusState: STATUS.VALIDATED,
  },
  {
    id: 2,
    tabLabel: 'Rejetées',
    statusState: STATUS.REJECTED,
  },
  {
    id: 3,
    tabLabel: 'Par salarié',
  },
];

describe('Tab component', () => {
  it('should render correctly the tabs and their content', () => {
    const { getByText } = render(<Tab tabs={tabs} />);

    expect(getByText('A traiter')).toBeInTheDocument();
    expect(getByText('Validées')).toBeInTheDocument();
    expect(getByText('Rejetées')).toBeInTheDocument();
  });
  it('should render correctly the info block when the block is passed', () => {
    const { getByText } = render(
      <Tab tabs={tabs} setSelectedIndex={STATUS.TO_PROCESS} />
    );
    expect(getByText('A traiter')).toBeInTheDocument();
  });
});

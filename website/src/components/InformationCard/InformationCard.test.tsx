import React from 'react';
import { render, act, fireEvent, screen } from '@testing-library/react';
import InformationCard from './InformationCard';

describe('<InformationCard />', () => {
  const value = 'title';

  test('renders title', () => {
    const { getByText } = render(
      <InformationCard title={value}>
        <div>Hello</div>
      </InformationCard>
    );
    expect(getByText(value)).toBeInTheDocument();
  });
  test('responsive test', () => {
    window.innerWidth = 500;
    const { getByText } = render(
      <InformationCard title={value}>
        <div>Hello</div>
      </InformationCard>
    );
    expect(getByText(value)).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByRole('button'));
    });
  });
});

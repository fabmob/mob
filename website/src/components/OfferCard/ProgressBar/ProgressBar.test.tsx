import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import ProgressBar from './ProgressBar';

const props = {
  "partialCount": 1,
  "totalCount": 1,
  "percentageCount": 100,
  "singularSubject": 'Citoyen',
  "pluralSubject": 'Citoyens'
}

afterEach(cleanup);

describe('<ProgressBar />', () => {
  test('renders totalValue = 0  and value for Validated Citizens', async () => {
    const { getByText } = render(<ProgressBar { ...props } />);

    await waitFor(() => {
      expect(getByText("1 Citoyen")).toBeInTheDocument();
      expect(getByText('1')).toBeInTheDocument();
    });
  });
});

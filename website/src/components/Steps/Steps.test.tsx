import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Steps from './Steps';
import { StepsItemProps } from './StepsItem';

describe('<Step />', () => {
  test('Display correct title', () => {
    const { getByText } = render(<Steps title="title of steps" />);
    expect(getByText('title of steps')).toBeInTheDocument();
  });
  test('Display steps with image and text', () => {
    const itemsList: StepsItemProps[] = [
      { image: '/src/1', text: 'step 1 information' },
      { image: '/src/2', text: 'step 2 information' },
      { image: '/src/3', text: 'step 3 information' },
    ];
    const { getByText, container } = render(<Steps items={itemsList} />);

    expect(getByText('step 1 information')).toBeInTheDocument();
    expect(getByText('step 2 information')).toBeInTheDocument();
    expect(getByText('step 3 information')).toBeInTheDocument();

    expect(container.querySelector('img[src="/src/1"]')).toBeTruthy();
    expect(container.querySelector('img[src="/src/2"]')).toBeTruthy();
    expect(container.querySelector('img[src="/src/3"]')).toBeTruthy();
  });
});

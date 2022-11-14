import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import TableRow from './TableRow';

describe('<TableRow />', () => {
  test('Display correct basic content', () => {
    const { getByText } = render(
      <TableRow
        key="random-value"
        label="Date de naissance"
        type="date"
        value="1999-02-15T00:00:00.000Z"
      />
    );
    const mainContainer = getByText('Date de naissance');
    expect(mainContainer).toHaveTextContent('Date de naissance');
    expect(getByText('15/02/1999')).toBeInTheDocument();
  });

  test('Display correct content with multiple actions', () => {
    const actionList = [
      { label: 'p action', type: 'p' },
      { label: 'a action', type: 'a', callback: () => console.log('test') },
      {
        label: 'button action',
        type: 'button',
        callback: () => console.log('button test'),
      },
      { label: 'default action' },
    ];
    const { getByText } = render(
      <TableRow
        key="random-value"
        label="Date de naissance"
        type="date"
        value="1999-02-15T00:00:00.000Z"
        actionList={actionList}
      />
    );
    const mainContainer = getByText('Date de naissance');
    expect(mainContainer).toHaveTextContent('Date de naissance');
    expect(getByText('15/02/1999')).toBeInTheDocument();
    expect(getByText('p action')).toBeInTheDocument();
  });

  test('Display correct content with icon', () => {
    const { getByTestId, getByText } = render(
      <TableRow
        key="random-value"
        label="Date de naissance"
        type="date"
        value="1999-02-15T00:00:00.000Z"
        iconName="success"
      />
    );

    expect(getByTestId('svg-icon').firstChild).toHaveAttribute(
      'xlink:href',
      '[object Object]#success'
    );
    const mainContainer = getByText('Date de naissance');
    expect(mainContainer).toHaveTextContent('Date de naissance');
    expect(getByText('15/02/1999')).toBeInTheDocument();
  });
});

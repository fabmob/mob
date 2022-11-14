import React from 'react';
import { render } from '@testing-library/react';
import RequestBody from './RequestBody';
import { format } from 'date-fns';

describe('<RequestBody />', () => {
  test('renders date, title and descrition', () => {
    const date = new Date();
    const title = 'my title';
    const description = 'my description';
    const { container, getByText } = render(
      <RequestBody date={date} title={title} description={description} />
    );

    expect(
      getByText(
        `Demande du ${format(date, 'dd/MM/yyyy')} à ${format(date, "H'h'mm")}`
      )
    ).toBeInTheDocument();
    expect(getByText(title)).toBeInTheDocument();
    expect(getByText(description)).toBeInTheDocument();
  });

  test('renders date, title, descrition and icon', () => {
    const date = new Date();
    const title = 'my title';
    const description = 'my description';
    const iconName = 'success';
    const { container, getByText, getByTestId } = render(
      <RequestBody
        date={date}
        title={title}
        description={description}
        useIcon
        iconName={iconName}
      />
    );

    expect(getByTestId('svg-icon').firstChild).toHaveAttribute(
      'xlink:href',
      '[object Object]#success'
    );
    expect(
      getByText(
        `Demande du ${format(date, 'dd/MM/yyyy')} à ${format(date, "H'h'mm")}`
      )
    ).toBeInTheDocument();
    expect(getByText(title)).toBeInTheDocument();
    expect(getByText(description)).toBeInTheDocument();
  });
});

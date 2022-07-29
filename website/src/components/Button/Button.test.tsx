import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from './Button';

describe('<Button />', () => {
  test('Button renders with correct text', () => {
    const { queryByText, rerender } = render(<Button>Submit</Button>);
    expect(queryByText('Submit')).toBeTruthy();

    // Change props
    rerender(<Button>Cancel</Button>);
    expect(queryByText('Cancel')).toBeTruthy();
  });

  test('Calls correct function on click', () => {
    const onClick = jest.fn();
    const { getByText } = render(<Button onClick={onClick}>Submit</Button>);
    fireEvent.click(getByText('Submit'));
    expect(onClick).toHaveBeenCalled();
  });

  test('Props disabled', () => {
    const { getByText } = render(<Button disabled>Submit</Button>);
    expect(getByText('Submit')).toHaveAttribute('disabled');
  });

  test('Props submit', () => {
    const { getByText, rerender } = render(<Button submit>Submit</Button>);
    expect(getByText('Submit')).toHaveAttribute('type', 'submit');

    // Change value props submit
    rerender(<Button submit={false}>Submit</Button>);
    expect(getByText('Submit')).toHaveAttribute('type', 'button');
  });

  test('Props className', () => {
    const { getByText, rerender } = render(<Button secondary>Submit</Button>);
    expect(getByText('Submit')).toHaveClass('button--secondary');

    rerender(<Button inverted>Submit</Button>);
    expect(getByText('Submit')).toHaveClass('button--inverted');

    rerender(<Button classnames="btn-connexion">Submit</Button>);
    expect(getByText('Submit')).toHaveClass('button btn-connexion');
  });

  test('Button with icon', () => {
    const { getByText, getByTestId } = render(
      <Button icon="play">Submit</Button>
    );
    expect(getByTestId('svg-icon')).toBeInTheDocument();
    expect(getByText('Submit')).toHaveClass('button--icon');
  });
});

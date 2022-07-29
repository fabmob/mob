import React from 'react';
import { render } from '@testing-library/react';
import Heading, { HeadingColor, HeadingLevel } from './Heading';

describe('<Heading />', () => {
  const value = 'Title';
  test('renders children text', () => {
    const { container, getByText } = render(<Heading>{value}</Heading>);
    expect(container.getElementsByTagName('h1').length).toBe(1);
    expect(getByText(value)).toBeInTheDocument();
  });
  test('renders child component', () => {
    const Child = () => {
      return <div data-testid="child">{value}</div>;
    };
    const { getByText, getByTestId } = render(
      <Heading>
        <Child />
      </Heading>
    );
    expect(getByText(value)).toBeInTheDocument();
    expect(getByTestId('child')).toBeInTheDocument();
  });
  test('adds prop value to className', () => {
    const { container } = render(
      <Heading className="custom-class">{value}</Heading>
    );
    expect(container.getElementsByClassName('custom-class').length).toBe(1);
  });
  test('changes color heading', () => {
    const colors: HeadingColor[] = [
      'blue',
      'blue-dark',
      'dark',
      'grey-dark',
      'grey-mid',
    ];
    const { container, getByText, rerender } = render(
      <Heading>{value}</Heading>
    );

    colors.forEach((color: HeadingColor) => {
      rerender(<Heading color={color}>{value}</Heading>);
      expect(getByText(value)).toBeInTheDocument();
      expect(container.getElementsByClassName(color).length).toBe(1);
    });
  });
  test('changes level heading', () => {
    const levels: HeadingLevel[] = ['h1', 'h2', 'h3'];
    const { container, getByText, rerender } = render(
      <Heading>{value}</Heading>
    );

    levels.forEach((level: HeadingLevel) => {
      rerender(<Heading level={level}>{value}</Heading>);
      expect(getByText(value)).toBeInTheDocument();
      expect(container.querySelector(level)).toBeInTheDocument();
    });
  });
  test('changes like level heading', () => {
    const levels: HeadingLevel[] = ['h1', 'h2', 'h3'];
    const { container, getByText, rerender } = render(
      <Heading>{value}</Heading>
    );

    levels.forEach((level: HeadingLevel) => {
      rerender(<Heading like={level}>{value}</Heading>);
      expect(getByText(value)).toBeInTheDocument();
      expect(container.getElementsByClassName(`${level}-like`).length).toBe(1);
    });
  });
});

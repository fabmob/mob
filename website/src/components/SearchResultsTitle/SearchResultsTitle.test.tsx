import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchResultsTitle from './SearchResultsTitle';

describe('<SearchResultsTitle />', () => {
  const noResultText = 'Aucun résultat de recherche pour ';
  const resultText = 'résultats de recherche pour ';

  test('No search with custom text', () => {
    const { getByText } = render(
      <SearchResultsTitle
        nbResult={10}
        defaultInitText="%count demandes à traiter"
      />
    );
    expect(getByText('10 demandes à traiter')).toBeInTheDocument();
  });
  test('No result with search text', () => {
    render(<SearchResultsTitle nbResult={0} termSearch="Martin" />);
    screen.getByText((_content, node) => {
      if (node === null) {
        return false;
      }
      const hasText = (node: Element) =>
        node.textContent === noResultText + 'Martin';
      const nodeHasText = hasText(node as Element);
      const childrenDontHaveText = Array.from(node.children).every(
        (child) => !hasText(child)
      );

      return nodeHasText && childrenDontHaveText;
    });
  });
  test('No result with filters search', () => {
    render(<SearchResultsTitle nbResult={0} filtersSearch={['Incentive 1']} />);
    screen.getByText((_content, node) => {
      if (node === null) {
        return false;
      }
      const hasText = (node: Element) =>
        node.textContent === noResultText + 'Incentive 1';
      const nodeHasText = hasText(node as Element);
      const childrenDontHaveText = Array.from(node.children).every(
        (child) => !hasText(child)
      );

      return nodeHasText && childrenDontHaveText;
    });
  });
  test('No result with search text and filters search same time', () => {
    render(
      <SearchResultsTitle
        nbResult={0}
        termSearch="Martin"
        filtersSearch={['Incentive 1']}
      />
    );
    screen.getByText((_content, node) => {
      if (node === null) {
        return false;
      }
      const hasText = (node: Element) =>
        node.textContent === noResultText + 'Martin, Incentive 1';
      const nodeHasText = hasText(node as Element);
      const childrenDontHaveText = Array.from(node.children).every(
        (child) => !hasText(child)
      );

      return nodeHasText && childrenDontHaveText;
    });
  });
  test('10 results with search text', () => {
    render(<SearchResultsTitle nbResult={10} termSearch="Martin" />);
    screen.getByText((_content, node) => {
      if (node === null) {
        return false;
      }
      const hasText = (node: Element) =>
        node.textContent === '10 ' + resultText + 'Martin';
      const nodeHasText = hasText(node as Element);
      const childrenDontHaveText = Array.from(node.children).every(
        (child) => !hasText(child)
      );

      return nodeHasText && childrenDontHaveText;
    });
  });
  test('10 results with filters search', () => {
    render(
      <SearchResultsTitle nbResult={10} filtersSearch={['Incentive 1']} />
    );
    screen.getByText((_content, node) => {
      if (node === null) {
        return false;
      }
      const hasText = (node: Element) =>
        node.textContent === '10 ' + resultText + 'Incentive 1';
      const nodeHasText = hasText(node as Element);
      const childrenDontHaveText = Array.from(node.children).every(
        (child) => !hasText(child)
      );

      return nodeHasText && childrenDontHaveText;
    });
  });
  test('10 results with search text and filters search same time', () => {
    render(
      <SearchResultsTitle
        nbResult={10}
        termSearch="Martin"
        filtersSearch={['Incentive 1']}
      />
    );
    screen.getByText((_content, node) => {
      if (node === null) {
        return false;
      }
      const hasText = (node: Element) =>
        node.textContent === '10 ' + resultText + 'Martin, Incentive 1';
      const nodeHasText = hasText(node as Element);
      const childrenDontHaveText = Array.from(node.children).every(
        (child) => !hasText(child)
      );

      return nodeHasText && childrenDontHaveText;
    });
  });
});

import React, { FC, Fragment } from 'react';
import './_search-results-title.scss';
import Strings from './locale/fr.json';

interface Props {
  nbResult: number;
  termSearch?: string;

  /** List of filters apply by user in an array. */
  filtersSearch?: string[];

  /** Alternative text display when no term and filters are available.
   * You can use %count pattern to choose the number of result placement in string. */
  defaultInitText?: string;
}

/**
 * @name SearchResultsTitle
 * @example
 * <SearchResultsTitle
 *   nbResult={29}
 *   termSearch="Martin"
 *   defaultInitText="%count elements found for this search" />
 * />
 */
const SearchResultsTitle: FC<Props> = ({
  nbResult,
  termSearch,
  filtersSearch = [],
  defaultInitText,
}) => {
  const filters = filtersSearch.map((filter: string, index) => {
    const uniqueKey = `tag-${index}`;
    return (
      <Fragment key={uniqueKey}>
        {index > 0 && ', '}
        <span>{filter}</span>
      </Fragment>
    );
  });

  const renderResults = () => {
    if (nbResult > 0 && (filters.length || termSearch)) {
      return [
        <span key="span-1" className="semi-bold">
          {nbResult} {Strings['search.result.number']}
        </span>,
        Strings['search.result.for'],
        termSearch ? (filters.length ? `${termSearch}, ` : termSearch) : '',
        filters,
      ];
    }
    if (nbResult === 0 && (filters.length || termSearch)) {
      return [
        <span key="span-2" className="semi-bold">
          {Strings['search.result.none']}
        </span>,
        filters || termSearch ? Strings['search.result.for'] : '',
        termSearch ? (filters.length ? `${termSearch}, ` : termSearch) : '',
        filters,
      ];
    }
    if (defaultInitText) {
      return defaultInitText.replace('%count', nbResult.toString());
    }

    return `${Strings['search.result.all']} (${nbResult})`;
  };

  return (
    <div className="mcm-search-results-title">
      <span className="info">{renderResults()}</span>
    </div>
  );
};

export default SearchResultsTitle;

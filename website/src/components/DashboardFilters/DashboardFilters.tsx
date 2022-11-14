import React, { FC, useState, useCallback, useEffect } from 'react';
import { setYear, eachYearOfInterval } from 'date-fns';
import Strings from './locale/fr.json';

import FilterSelect, {
  OptionType,
} from '@components/FiltersSelect/FilterSelect';

/**
 * INTERFACE
 *
 *
 *
 *
 */
interface DashboardFiltersProps {
  filtersChanges: (value1: string, value2: string) => void,
}

/**
 * Generic component used to render the both filters fro years and semesters
 * @constructor
 */
const DashboardFilters: FC<DashboardFiltersProps> = ({ filtersChanges }) => {
  /**
   * VARIABLES
   *
   *
   *
   *
   */
  const BEGIN_YEAR = 2020;
  const yearInterval = eachYearOfInterval({
    start: setYear(new Date(), BEGIN_YEAR),
    end: new Date(),
  });

  const yearOptionList: OptionType[] = yearInterval.reverse().map((year) => {
    return {
      label: year.getFullYear().toString(),
      value: year.getFullYear().toString(),
    };
  });

  const semesterOptionList: OptionType[] = [
    { label: '1 & 2', value: 'all' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
  ];

  /**
   * STATES
   *
   *
   *
   *
   */
  const [yearSelected, setSelectedYear] = useState<OptionType>(
    yearOptionList[0]
  );
  const [semesterSelected, setSelectedSemester] = useState<OptionType>(
    semesterOptionList[0]
  );
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  /**
   * FUNCTIONS
   *
   *
   *
   *
   */
  const onSelectYearChanged = useCallback((option: OptionType) => {
    setSelectedYear(option);
  }, []);

  const onSelectSemesterChanged = useCallback((option: OptionType) => {
    setSelectedSemester(option);
  }, []);

  /**
   * USE EFFECTS
   *
   *
   *
   *
   */
  useEffect(() => {
    if (isLoaded) {
      filtersChanges(yearSelected.value, semesterSelected.value);
    }
    setIsLoaded(true);
  }, [yearSelected, semesterSelected, isLoaded]);

  /**
   * RENDER
   *
   *
   *
   *
   */
  return (
    <>
      <FilterSelect
        options={yearOptionList}
        isMulti={false}
        showSelectedValue
        defaultValue={yearSelected}
        onSelectChange={onSelectYearChanged}
        placeholder={Strings['ph.year']}
      />

      <FilterSelect
        options={semesterOptionList}
        isMulti={false}
        showSelectedValue
        defaultValue={semesterSelected}
        onSelectChange={onSelectSemesterChanged}
        placeholder={Strings['ph.semester']}
      />
    </>
  );
};

export default DashboardFilters;

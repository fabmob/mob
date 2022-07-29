import React, { FC, useState, Fragment } from 'react';

import Heading from '@components/Heading/Heading';
import { useGetFunder } from '@utils/keycloakUtils';
import {
  CitoyenAideDashboard,
  getCitoyensDashboard,
} from '@api/DashboardService';
import TooltipInfoIcon from '@components/TooltipInfoIcon/TooltipInfoIcon';
import SVG from '@components/SVG/SVG';
import OfferCard from '@components/OfferCard/OfferCard';
import DashboardFilters from '@components/DashboardFilters/DashboardFilters';

import Strings from '../locale/fr.json';

import './_citizenDashboard.scss';

const CitizenDashboard: FC = () => {
  /**
   * STATES
   *
   *
   *
   *
   */
  const [dashboardData, setDashboardData] = useState<any>({});

  /**
   * VARIABLES
   *
   *
   *
   *
   */
  const { funderName } = useGetFunder();
  const { totalCitizensCount } = dashboardData;

  /**
   * FUNCTIONS
   *
   *
   *
   * handle the citizens dashboard result and get the total count
   */
  const handleCitoyensDashResult = async (
    yearSelected: string,
    semesterSelected: string
  ) => {
    const data: CitoyenAideDashboard = await getCitoyensDashboard(
      yearSelected,
      semesterSelected
    );
    setDashboardData(data);
  };

  /**
   * trigger on filters changes
   * @param yearSelected the selected year in the filter years field value
   * @param semesterSelected the selected semester in the semester field value (all value by default)
   */
  const onFiltersChanges = (yearSelected: string, semesterSelected: string) => {
    handleCitoyensDashResult(yearSelected, semesterSelected);
  };

  /**
   * RENDER
   *
   *
   *
   *
   */
  return (
    <>
      <div className="mcm-citizens-heading">
        <Heading like="h2">
          {Strings['dashboard.citizens.title']}
          <TooltipInfoIcon
            tooltipContent={Strings['dashboard.citizens.title.tooltip']}
            iconName="information"
            iconSize={20}
          />{' '}
        </Heading>
      </div>

      <div className="mcm-citizens-container">
        <div className="mcm-citizens-info-tab">
          <Heading
            className="mcm-citizens-info-tab__info"
            like="h2"
            color="blue"
          >
            <SVG className="form-tooltip__icon" size={85} icon="big-profile" />
            <span className="mcm-citizens-info-tab__count">
              {totalCitizensCount || 0}
            </span>
            {totalCitizensCount === 1
              ? Strings['dashboard.citizens.singular']
              : Strings['dashboard.citizens.plural']}
          </Heading>
          {totalCitizensCount === 1
            ? `${totalCitizensCount} ${Strings['dashboard.citizens.subtitle.singular']}`
            : `${totalCitizensCount || 0} ${
                Strings['dashboard.citizens.subtitle.plural']
              }`}{' '}
          {Strings['dashboard.citizens.subtitle']} {funderName || null}
        </div>

        <div className="mcm-citizen-filters">
          <DashboardFilters filtersChanges={onFiltersChanges} />
        </div>
      </div>

      {/* OFFER CARD */}
      <OfferCard dataList={dashboardData} />
    </>
  );
};

export default CitizenDashboard;

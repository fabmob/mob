import React, { FC, useCallback, useEffect, useState } from 'react';
import { eachYearOfInterval, setYear } from 'date-fns';
import { getCitizenSubscriptions } from '@api/DemandeService';
import FilterSelect, {
  OptionType,
} from '@components/FiltersSelect/FilterSelect';
import Heading from '@components/Heading/Heading';
import { INCENTIVE_TYPE, STATUS, Subscription } from '@utils/demandes';
import CitizenSubscriptionCard from './CitizenSubscriptionCard';
import RenderMoreItems from './RenderMoreItems';
import Strings from '../../locale/fr.json';
import { useUser } from '../../../../../context';
import { useQuery } from 'react-query';
import { matomoPageTracker } from '@utils/matomo';
import { useMatomo } from '@datapunt/matomo-tracker-react';

const MORE_ITEMS = 5;
const BEGIN_YEAR = 2020;

interface SubscriptionsListSectionProps {
  title: string;
  defaultStatus: STATUS[];
  enableFilter?: boolean;
  emptyMessage?: string;
}

const SubscriptionsListSection: FC<SubscriptionsListSectionProps> = ({
  title,
  defaultStatus,
  enableFilter,
  emptyMessage,
}) => {
  const [filterApplied, setFilterApplied] = useState<boolean>(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionsToDisplay, setSubscriptionsToDisplay] = useState<
    Subscription[]
  >([]);
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<
    OptionType[]
  >([]);
  const [yearFilter, setYearFilter] = useState<OptionType[]>([]);
  const [funderTypeFilter, setFunderTypeFilter] = useState<OptionType[]>([]);
  const { citizen } = useUser();

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

  const getFunderTypeOptions = () => {
    return [
      {
        label:
          Strings[
            'dashboard.citizen.subscriptions.funderType.label.collectivity'
          ],
        value: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
      },
      {
        label:
          Strings[
            'dashboard.citizen.subscriptions.funderType.label.enterprise'
          ],
        value: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
      },
      {
        label:
          Strings[
            'dashboard.citizen.subscriptions.funderType.label.national'
          ],
        value: INCENTIVE_TYPE.NATIONAL_INCENTIVE,
      },
    ];
  };

  const getSubscriptionStatusOptions = () => {
    return [
      {
        label: Strings['dashboard.citizen.subscriptions.label.rejected'],
        value: STATUS.REJECTED,
      },
      {
        label: Strings['dashboard.citizen.subscriptions.label.validated'],
        value: STATUS.VALIDATED,
      },
    ];
  };

  const { data } = useQuery<Subscription[]>(
    [
      `getCitizenSubscriptions-${defaultStatus.join('')}`,
      subscriptionStatusFilter,
      yearFilter,
      funderTypeFilter,
    ],
    () =>
      getCitizenSubscriptions({
        citizenId: citizen.id,
        status:
          enableFilter && subscriptionStatusFilter.length > 0
            ? subscriptionStatusFilter.map((status) => status.value)
            : defaultStatus,
        incentiveType: enableFilter
          ? funderTypeFilter.map((incentiveType) => incentiveType.value)
          : undefined,
        year: enableFilter ? yearFilter.map((year) => year.value) : undefined,
      })
  );

  useEffect(() => {
    if (data) {
      setSubscriptions(data);
      setSubscriptionsToDisplay(data.slice(0, MORE_ITEMS));
      setFilterApplied(
        subscriptionStatusFilter?.length > 0 ||
          funderTypeFilter.length > 0 ||
          yearFilter.length > 0
      );
    }
  }, [data]);

  // Tracking page
  const { trackPageView } = useMatomo();
  useEffect(() => {
    matomoPageTracker(trackPageView, 'Tableau de bord citoyen', 2);
    return () => {};
  }, []);

  const onSelectSubscriptionStatus = useCallback((option) => {
    setSubscriptionStatusFilter(option);
  }, []);

  const onSelectFunderType = useCallback((option) => {
    setFunderTypeFilter(option);
  }, []);

  const onSelectYear = useCallback((option) => {
    setYearFilter(option);
  }, []);

  return (
    <section className="page-container">
      <Heading level="h2" className="">
        {title}
      </Heading>
      {enableFilter && (
        <div className="filter-container">
          <div className="mcm-filters__dropdown">
            <FilterSelect
              options={getSubscriptionStatusOptions()}
              isMulti
              onSelectChange={onSelectSubscriptionStatus}
              placeholder={
                Strings[
                  'dashboard.citizen.subscriptions.filter.subscription.status.placeholder'
                ]
              }
            />
          </div>
          <div className="mcm-filters__dropdown">
            <FilterSelect
              options={getFunderTypeOptions()}
              isMulti
              onSelectChange={onSelectFunderType}
              placeholder={
                Strings[
                  'dashboard.citizen.subscriptions.filter.funderType.placeholder'
                ]
              }
            />
          </div>
          <div className="mcm-filters__dropdown">
            <FilterSelect
              options={yearOptionList}
              isMulti
              onSelectChange={onSelectYear}
              placeholder={
                Strings[
                  'dashboard.citizen.subscriptions.filter.subscription.year.placeholder'
                ]
              }
            />
          </div>
        </div>
      )}

      {subscriptions?.length <= 0 && !filterApplied && (
        <div className="empty-list">{emptyMessage}</div>
      )}

      {subscriptionsToDisplay?.length > 0 && (
        <>
          <ul>
            {subscriptionsToDisplay?.map((subscription: Subscription) => (
              <CitizenSubscriptionCard
                key={subscription.id}
                subscription={subscription}
              />
            ))}
          </ul>
          <RenderMoreItems
            subscriptions={subscriptions}
            subscriptionsToDisplay={subscriptionsToDisplay}
            setItemsToDisplay={setSubscriptionsToDisplay}
          />
        </>
      )}
    </section>
  );
};

export default SubscriptionsListSection;

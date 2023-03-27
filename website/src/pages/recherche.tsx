import React, { FC, useCallback, useEffect, useState } from 'react';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import { useQueryParam, StringParam } from 'use-query-params';
import { useQueryClient, useQuery } from 'react-query';
import { useMatomo } from '@datapunt/matomo-tracker-react';

import { AuthorizationRoute } from '@modules/routes';

import Layout from '@components/Layout/Layout';
import FilterSelect, {
  OptionType,
} from '@components/FiltersSelect/FilterSelect';
import ScrollTopButton from '@components/ScrollTopButton/ScrollTopButton';
import AideSearchList from '@components/AideSearch/AideSearchList/AideSearchList';
import SearchForm from '@components/SearchForm/SearchForm';
import SearchResultsTitle from '@components/SearchResultsTitle/SearchResultsTitle';
import Button from '@components/Button/Button';
import Tab from '@components/Tabs/Tabs';

import { searchAide, countIncentives } from '@api/AideService';
import { getTerritories, Territory } from '@api/TerritoryService';
import { Count, IFilter } from '@utils/api';

import { Incentive, transportMapping } from '@utils/aides';
import { INCENTIVE_TYPE } from '@utils/demandes';
import { matomoPageTracker } from '@utils/matomo';
import { sortData } from '@utils/helpers';

import { Roles, AffiliationStatus } from '../constants';
import { useSession, useUser } from '../context';
import Strings from './locale/fr.json';
import { Helmet } from 'react-helmet';

import mobLogo from '../../static/mob-favicon.png';

interface RechercheProps {
  pageContext: { breadcrumb: { crumbs: string } };
}

interface tabsArrayObj {
  id: number;
  tabLabel: string;
  statusState: INCENTIVE_TYPE;
}

interface IncentivesCount {
  allIncentives: number;
  nationalIncentives: number;
  territoryIncentives: number;
  employerIncentives: number;
}

const RechercheComponent: FC<RechercheProps> = ({ pageContext }) => {
  const {
    breadcrumb: { crumbs },
  } = pageContext;

  const { citizen, authenticated } = useUser();

  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [filteredIncentiveList, setFilteredIncentiveList] = useState<
    Incentive[] | undefined
  >([]);
  const [incentivesCount, setIncentivesCount] = useState<IncentivesCount>({
    allIncentives: 0,
    nationalIncentives: 0,
    territoryIncentives: 0,
    employerIncentives: 0,
  });
  const [territoryOptions, setTerritoryOptions] = useState<OptionType[]>([]);
  const [territoryFilter, setTerritoryFilter] = useState<OptionType[]>([]);
  const [transportsFilter, setTransportsFilter] = useState<OptionType[]>([]);
  const [routeSelectedTab] = useQueryParam('tab', StringParam);
  const [selectedTab, setSelectedTab] = useState<string>(
    routeSelectedTab || INCENTIVE_TYPE.ALL_INCENTIVE
  );

  const queryClient = useQueryClient();
  const { keycloak } = useSession();
  const { trackPageView } = useMatomo();
  const [termSearch, setTermSearch] = useQueryParam('search', StringParam);
  const { data: territories } = useQuery<Territory[]>([`getTerritories`], () =>
    getTerritories()
  );

  const STALE_TIME = 3300000; // 55min ==> (55min * (60sec * 1000)) Duration data is considered fresh - once it's stale new calls will be triggered
  const CACHE_TIME = 3600000; // 60min ==> (60min * (60sec * 1000)) Duration React Query stores inactive data before it is deleted from the cache

  /*
   * Get Filters
   */
  const getFilters = () => {
    let where: Record<string, unknown> = {};
    const selectedTerritories: string[] = territoryFilter.map(
      (territoryOption: OptionType) => {
        return territoryOption.value;
      }
    );
    const selectedTransports: string[] = transportsFilter.map(
      (transportOption: OptionType) => {
        return transportOption.value;
      }
    );

    if (selectedTerritories?.length) {
      where = {
        territoryIds: { inq: selectedTerritories },
      };
    }

    if (selectedTransports?.length) {
      where = { ...where, transportList: { inq: selectedTransports } };
    }

    return where;
  };

  const { data: incentives, isSuccess } = useQuery<Incentive[]>(
    [
      `searchAide-${selectedTab}-${termSearch}-${territoryFilter}-${transportsFilter}`,
      [selectedTab, termSearch, territoryFilter, transportsFilter],
    ],
    () => {
      const filter: IFilter<Incentive> = {
        order: ['funderName ASC', 'title ASC'],
        fields: {
          id: true,
          title: true,
          description: true,
          funderName: true,
          funderId: true,
          incentiveType: true,
          transportList: true,
        },
      };

      const params: Record<string, unknown> = getFilters();

      if (Object.keys(params).length) {
        filter.where = {
          ...params,
        };
      }

      if (selectedTab !== INCENTIVE_TYPE.ALL_INCENTIVE) {
        if (selectedTab === INCENTIVE_TYPE.EMPLOYER_INCENTIVE) {
          if (
            authenticated &&
            citizen &&
            citizen.affiliation?.status === AffiliationStatus.AFFILIATED
          ) {
            filter.where = {
              ...params,
              incentiveType: selectedTab,
              funderId: citizen.affiliation?.enterpriseId,
            };
          } else {
            return [];
          }
        } else {
          filter.where = {
            ...params,
            incentiveType: selectedTab,
          };
        }
      }

      return searchAide(termSearch, filter);
    },
    {
      staleTime: STALE_TIME,
      cacheTime: CACHE_TIME,
    }
  );

  useEffect(() => {
    territories && setTerritoryOptions(getTerritoryOptions(territories));
  }, [territories]);

  const tabsArray: tabsArrayObj[] = [
    {
      id: 0,
      tabLabel: Strings['search.incentive.tabs.all.incentives'].replace(
        '{0}',
        `(${incentivesCount.allIncentives})`
      ),
      statusState: INCENTIVE_TYPE.ALL_INCENTIVE,
    },
    {
      id: 1,
      tabLabel: Strings['search.incentive.tabs.nationals.incentives'].replace(
        '{0}',
        `(${incentivesCount.nationalIncentives})`
      ),
      statusState: INCENTIVE_TYPE.NATIONAL_INCENTIVE,
    },
    {
      id: 2,
      tabLabel: Strings['search.incentive.tabs.territory.incentives'].replace(
        '{0}',
        `(${incentivesCount.territoryIncentives})`
      ),
      statusState: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    },
    {
      id: 3,
      tabLabel: Strings['search.incentive.tabs.employees.incentives'].replace(
        '{0}',
        `(${incentivesCount.employerIncentives})`
      ),
      statusState: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
    },
  ];

  /*
   * Set default active Tab
   */
  const setDefaultActiveTab = () => {
    const tab: tabsArrayObj | undefined = tabsArray.find(
      (el: tabsArrayObj) => el.statusState === selectedTab
    );
    return tab?.id;
  };

  /*
   * Get Incentives Count
   */
  const getIncentivesCount = (incentiveTypeParam?: string): Promise<Count> => {
    const params: Record<string, unknown> = getFilters();
    let whereCondition: Record<string, unknown> = { ...params };

    if (termSearch) {
      whereCondition = {
        ...whereCondition,
        $text: { $search: termSearch, $caseSensitive: true },
      };
    }

    if (incentiveTypeParam) {
      whereCondition = {
        ...whereCondition,
        incentiveType: incentiveTypeParam,
      };

      if (incentiveTypeParam === INCENTIVE_TYPE.EMPLOYER_INCENTIVE) {
        whereCondition = {
          ...whereCondition,
          funderId: citizen.affiliation?.enterpriseId,
        };
      }
    } else {
      const isAffiliated: boolean =
        authenticated &&
        citizen &&
        citizen.affiliation?.status === AffiliationStatus.AFFILIATED;
      whereCondition = {
        ...whereCondition,
        and: [
          isAffiliated
            ? {
                or: [
                  {
                    incentiveType: {
                      inq: [
                        INCENTIVE_TYPE.NATIONAL_INCENTIVE,
                        INCENTIVE_TYPE.TERRITORY_INCENTIVE,
                      ],
                    },
                  },
                  {
                    incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
                    funderId: citizen.affiliation?.enterpriseId,
                  },
                ],
              }
            : {
                incentiveType: {
                  neq: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
                },
              },
        ],
      };
    }
    return countIncentives<Count>(whereCondition);
  };

  /*
   * Get All Incentives Count
   */
  const { data: allIncentivesCount } = useQuery<Count>(
    [
      `allIncentivesCount-${termSearch}-${territoryFilter}-${transportsFilter}`,
      [termSearch, territoryFilter, transportsFilter],
    ],
    () => getIncentivesCount(),
    {
      staleTime: STALE_TIME,
      cacheTime: CACHE_TIME,
    }
  );

  /*
   * Get National Incentives Count
   */
  const { data: nationalIncentivesCount } = useQuery<Count>(
    [
      `nationalIncentivesCount-${termSearch}-${territoryFilter}-${transportsFilter}`,
      [termSearch, territoryFilter, transportsFilter],
    ],
    () => getIncentivesCount(INCENTIVE_TYPE.NATIONAL_INCENTIVE),
    {
      staleTime: STALE_TIME,
      cacheTime: CACHE_TIME,
    }
  );

  /*
   * Get Territory Incentives Count
   */
  const { data: territoryIncentivesCount } = useQuery<Count>(
    [
      `territoryIncentivesCount-${termSearch}-${territoryFilter}-${transportsFilter}`,
      [termSearch, territoryFilter, transportsFilter],
    ],
    () => getIncentivesCount(INCENTIVE_TYPE.TERRITORY_INCENTIVE),
    {
      staleTime: STALE_TIME,
      cacheTime: CACHE_TIME,
    }
  );

  /*
   * Get Employer Incentives Count
   */
  const { data: employerIncentivesCount } = useQuery<Count>(
    [
      `employerIncentivesCount-${termSearch}-${territoryFilter}-${transportsFilter}`,
      [termSearch, territoryFilter, transportsFilter],
    ],
    () => getIncentivesCount(INCENTIVE_TYPE.EMPLOYER_INCENTIVE),
    {
      enabled:
        authenticated &&
        citizen &&
        citizen.affiliation?.status === AffiliationStatus.AFFILIATED,
      staleTime: STALE_TIME,
      cacheTime: CACHE_TIME,
    }
  );

  const transportOptions = Object.entries(transportMapping).map(
    ([value, label]) => {
      return { value, label };
    }
  );

  const getTerritoryOptions = (territoriesData: Territory[]): OptionType[] => {
    const formatedTerritories = territoriesData.map((territory: Territory) => {
      return { value: territory.id, label: territory.name };
    });
    return sortData(formatedTerritories, 'label');
  };

  /**
   * callback used by react-select on change
   */
  const onTransportChange = useCallback((option) => {
    setTransportsFilter(option);
  }, []);

  const onTerritoryChange = useCallback((option) => {
    setTerritoryFilter(option);
  }, []);

  /**
   * handle the search submit
   * @param term the search inventive type
   */
  const handleSearchSubmit = (term: string): void => {
    setTermSearch(term);
  };

  useEffect(() => {
    if (allIncentivesCount) {
      setIncentivesCount((previousState) => ({
        ...previousState,
        allIncentives: allIncentivesCount?.count,
      }));
    }
  }, [allIncentivesCount]);

  useEffect(() => {
    if (nationalIncentivesCount) {
      setIncentivesCount((previousState) => ({
        ...previousState,
        nationalIncentives: nationalIncentivesCount?.count,
      }));
    }
  }, [nationalIncentivesCount]);

  useEffect(() => {
    if (territoryIncentivesCount) {
      setIncentivesCount((previousState) => ({
        ...previousState,
        territoryIncentives: territoryIncentivesCount?.count,
      }));
    }
  }, [territoryIncentivesCount]);

  useEffect(() => {
    if (employerIncentivesCount) {
      setIncentivesCount((previousState) => ({
        ...previousState,
        employerIncentives: employerIncentivesCount?.count,
      }));
    }
  }, [employerIncentivesCount]);

  useEffect(() => {
    matomoPageTracker(trackPageView, 'Trouver une aide', 2);
    if (incentives && isSuccess) {
      const data: Incentive[] | undefined = queryClient.getQueryData([
        `searchAide-${selectedTab}-${termSearch}-${territoryFilter}-${transportsFilter}`,
        [selectedTab, termSearch, territoryFilter, transportsFilter],
      ]);
      setFilteredIncentiveList(data);
      setIsLoaded(true);
    }
  }, [
    termSearch,
    incentives?.length,
    selectedTab,
    territoryFilter,
    transportsFilter,
  ]);

  return (
    <Layout
      footer={{
        imageFilename: 'man-riding-bike.jpg',
        isVisibleOnMobile: true,
      }}
      fullWidth
      pageTitle={
        authenticated && citizen
          ? Strings['search.incentive.authenticated.text']
          : Strings['search.incentive.text']
      }
    >
      <Helmet
        title={Strings['search.head.page.title']}
        titleTemplate={`%s ${Strings['search.head.title.separator']} ${Strings['search.head.title.siteName']}`}
      >
        <html lang="fr" />
        <meta name="description" content={Strings['search.head.description']} />
        <meta property="og:image" content={mobLogo}></meta>
        <meta property="og:image:alt" content="logo-mob"></meta>
      </Helmet>

      <div className="page-container">
        <Breadcrumb
          crumbs={crumbs}
          crumbSeparator=" > "
          crumbLabel={
            authenticated && citizen
              ? Strings['search.incentive.authenticated.text']
              : Strings['search.incentive.text']
          }
        />
      </div>

      <div className="mcm-aides">
        <section className="mcm-aides__header o-bg-wrapper m-bg-wrapper">
          <h1 className="mb-s">
            {authenticated && citizen
              ? Strings['search.incentive.authenticated.text']
              : Strings['search.incentive.text']}
          </h1>

          {!authenticated && (
            <p className="mb-s">
              {Strings['search.subtitle.non.authenticated.text']}
              <Button
                classnames="link-in-text"
                basic
                onClick={() =>
                  keycloak.login({
                    redirectUri: `${window.location.origin}/redirection/`,
                  })
                }
              >
                {Strings['search.create.account']}
              </Button>
            </p>
          )}
          <section className="search-section mb-m">
            <div className="search-filters">
              <div className="mcm-filters__dropdown mcm-filter-localisation">
                <FilterSelect
                  options={territoryOptions}
                  isMulti
                  onSelectChange={onTerritoryChange}
                  placeholder={
                    Strings['form.filter.select.localisation.placeholder']
                  }
                  disabled={territoryOptions.length === 0}
                />
              </div>
              <div className="mcm-filters__dropdown mcm-filter-transports">
                <FilterSelect
                  options={transportOptions}
                  isMulti
                  onSelectChange={onTransportChange}
                  placeholder={
                    Strings['form.filter.select.transports.placeholder']
                  }
                />
              </div>
            </div>
            <SearchForm
              onSubmit={handleSearchSubmit}
              searchText={termSearch as string | undefined}
              placeholder={Strings['form.search.incentive.placeholder']}
              buttonText={Strings['form.search.incentive.label']}
            />
          </section>
        </section>
        <section className="mcm-aides__body">
          <div className="page-container">
            <div className="mcm-filters">
              <Tab
                tabs={tabsArray}
                setSelectedIndex={setSelectedTab}
                defaultActiveTab={setDefaultActiveTab}
              />
            </div>
            {isLoaded && (
              <>
                <SearchResultsTitle
                  nbResult={filteredIncentiveList?.length}
                  termSearch={termSearch as string | undefined}
                  filtersSearch={territoryFilter
                    .concat(transportsFilter)
                    .map((filter: OptionType) => {
                      return filter.label;
                    })}
                />
                {selectedTab === INCENTIVE_TYPE.ALL_INCENTIVE && (
                  <AideSearchList
                    items={filteredIncentiveList}
                    greenCard={
                      !authenticated ||
                      citizen.affiliation?.status !==
                        AffiliationStatus.AFFILIATED ||
                      (!citizen.postcode && !citizen.city)
                    }
                  />
                )}
                {selectedTab === INCENTIVE_TYPE.NATIONAL_INCENTIVE && (
                  <AideSearchList
                    items={filteredIncentiveList}
                    greenCard={!authenticated}
                  />
                )}
                {(selectedTab === INCENTIVE_TYPE.TERRITORY_INCENTIVE ||
                  selectedTab === INCENTIVE_TYPE.EMPLOYER_INCENTIVE) && (
                  <AideSearchList items={filteredIncentiveList} />
                )}
              </>
            )}
          </div>
        </section>
      </div>
      <ScrollTopButton />
    </Layout>
  );
};

const Recherche: FC<RechercheProps> = ({ pageContext }) => {
  return (
    <AuthorizationRoute
      component={<RechercheComponent pageContext={pageContext} />}
      forbiddenRoles={[Roles.SUPERVISORS, Roles.MANAGERS]}
    />
  );
};

export default Recherche;

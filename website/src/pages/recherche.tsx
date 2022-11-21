import React, { FC, useCallback, useEffect, useState } from 'react';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import { useQueryParam, StringParam } from 'use-query-params';
import { useQuery } from 'react-query';
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

import { searchAide } from '@api/AideService';
import { getTerritories, Territory } from '@api/TerritoryService';

import { Incentive, transportMapping } from '@utils/aides';
import { INCENTIVE_TYPE } from '@utils/demandes';
import { matomoPageTracker } from '@utils/matomo';
import { sortData } from '@utils/helpers';

import { Roles, AffiliationStatus } from '../constants';
import { useSession, useUser } from '../context';
import Strings from './locale/fr.json';

interface RechercheProps {
  pageContext: { breadcrumb: { crumbs: string } };
}

interface tabsArrayObj {
  id: number;
  tabLabel: string;
  statusState: INCENTIVE_TYPE;
}

const RechercheComponent: FC<RechercheProps> = ({ pageContext }) => {
  const {
    breadcrumb: { crumbs },
  } = pageContext;

  const { citizen, authenticated } = useUser();

  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [incentiveList, setIncentiveList] = useState<Incentive[]>([]);
  const [filteredIncentiveList, setFilteredIncentiveList] = useState<
    Incentive[]
  >([]);
  const [territoryOptions, setTerritoryOptions] = useState<OptionType[]>([]);
  const [territoryFilter, setTerritoryFilter] = useState<OptionType[]>([]);
  const [transportsFilter, setTransportsFilter] = useState<OptionType[]>([]);
  const [routeSelectedTab] = useQueryParam('tab', StringParam);
  const [selectedTab, setSelectedTab] = useState<string>(
    routeSelectedTab || INCENTIVE_TYPE.ALL_INCENTIVE
  );

  const { keycloak } = useSession();
  const { trackPageView } = useMatomo();
  const [termSearch, setTermSearch] = useQueryParam('search', StringParam);
  const { data: territories } = useQuery<Territory[]>([`getTerritories`], () =>
    getTerritories()
  );

  useEffect(() => {
    territories && setTerritoryOptions(getTerritoryOptions(territories));
  }, [territories]);

  const tabsArray: tabsArrayObj[] = [
    {
      id: 0,
      tabLabel: Strings['search.incentive.tabs.all.incentives'].replace(
        '{0}',
        `(${filteredIncentiveList.length})`
      ),
      statusState: INCENTIVE_TYPE.ALL_INCENTIVE,
    },
    {
      id: 1,
      tabLabel: Strings['search.incentive.tabs.territory.incentives'].replace(
        '{0}',
        `(${
          filteredIncentiveList.filter((incentive: Incentive) => {
            return (
              incentive.incentiveType === INCENTIVE_TYPE.TERRITORY_INCENTIVE
            );
          }).length
        })`
      ),
      statusState: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    },
    {
      id: 2,
      tabLabel: Strings['search.incentive.tabs.employees.incentives'].replace(
        '{0}',
        `(${
          filteredIncentiveList.filter((incentive: Incentive) => {
            return (
              incentive.incentiveType === INCENTIVE_TYPE.EMPLOYER_INCENTIVE
            );
          }).length
        })`
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

  const getIncentives = async (term?: string): Promise<void> => {
    try {
      const incentiveType: INCENTIVE_TYPE = [
        INCENTIVE_TYPE.NATIONAL_INCENTIVE,
        INCENTIVE_TYPE.TERRITORY_INCENTIVE,
      ];
      const enterpriseId: string | undefined =
        citizen?.affiliation?.affiliationStatus ===
          AffiliationStatus.AFFILIATED && citizen?.affiliation?.enterpriseId
          ? citizen.affiliation.enterpriseId
          : undefined;
      const incentives = await searchAide<Incentive[]>(
        term,
        incentiveType,
        enterpriseId
      );
      setIncentiveList(incentives as Incentive[]);
      setIsLoaded(true);
    } catch (error) {
      setIsLoaded(true);
    }
  };

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
    const selectedTerritories: string[] = territoryFilter.map(
      (territoryOption: OptionType) => {
        return territoryOption.label;
      }
    );
    const selectedTransports: string[] = transportsFilter.map(
      (transportOption: OptionType) => {
        return transportOption.value;
      }
    );

    const filteredIncentives: Incentive[] = incentiveList.filter(
      (incentive: Incentive) => {
        const incentiveMatchTransport =
          selectedTransports.length === 0 ||
          selectedTransports.some((transport: string) =>
            incentive.transportList.includes(transport)
          );
        const incentiveMatchTerritory =
          selectedTerritories.length === 0 ||
          selectedTerritories.includes(incentive.territory.name);
        return incentiveMatchTransport && incentiveMatchTerritory;
      }
    );
    setFilteredIncentiveList(filteredIncentives);
  }, [territoryFilter, transportsFilter, incentiveList]);

  useEffect(() => {
    matomoPageTracker(trackPageView, 'Trouver une aide', 2);
    getIncentives(termSearch as string | undefined);
  }, [termSearch]);

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
      <div className="page-container">
        <Breadcrumb
          crumbs={crumbs}
          crumbSeparator=" > "
          crumbLabel={authenticated && citizen ? Strings['search.incentive.authenticated.text'] : Strings['search.incentive.text']}
        />
      </div>

      <div className="mcm-aides">
        <section className="mcm-aides__header o-bg-wrapper m-bg-wrapper">
          <h1 className="mb-s">
            {authenticated && citizen
              ? Strings['search.incentive.authenticated.text']
              : Strings['search.incentive.text']}
          </h1>

          {authenticated && citizen ? (
            <p id="search-subtitle-authenticated-text" className="mb-s">
              {Strings['search.subtitle.authenticated.text']}
            </p>
          ) : (
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
                  nbResult={filteredIncentiveList.length}
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
                    greenCard={!authenticated}
                  />
                )}
                {selectedTab === INCENTIVE_TYPE.TERRITORY_INCENTIVE && (
                  <AideSearchList
                    items={filteredIncentiveList.filter(
                      (incentive: Incentive) => {
                        return (
                          incentive.incentiveType ===
                          INCENTIVE_TYPE.TERRITORY_INCENTIVE
                        );
                      }
                    )}
                    greenCard={!authenticated}
                  />
                )}

                {selectedTab === INCENTIVE_TYPE.EMPLOYER_INCENTIVE && (
                  <AideSearchList
                    items={filteredIncentiveList.filter(
                      (incentive: Incentive) => {
                        return (
                          incentive.incentiveType ===
                          INCENTIVE_TYPE.EMPLOYER_INCENTIVE
                        );
                      }
                    )}
                    greenCard={
                      !authenticated ||
                      citizen?.affiliation?.affiliationStatus !==
                        AffiliationStatus.AFFILIATED
                    }
                  />
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

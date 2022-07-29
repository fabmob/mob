import React, { FC, useCallback, useEffect, useState } from 'react';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import { useQueryParam, StringParam } from 'use-query-params';
import { useKeycloak } from '@react-keycloak/web';

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

import { searchAide } from '@api/AideService';

import { Incentive, transportMapping } from '@utils/aides';
import { INCENTIVE_TYPE } from '@utils/demandes';

import { Roles, AffiliationStatus } from '../constants';
import { useUser } from '../context';

import Strings from './locale/fr.json';

/**
 * INTERFACES
 *
 *
 *
 *
 */
interface RechercheProps {
  pageContext: { breadcrumb: { crumbs: string } };
}

const RechercheComponent: FC<RechercheProps> = ({ pageContext }) => {
  const {
    breadcrumb: { crumbs },
  } = pageContext;
  /**
   * APP CONTEXT
   *
   *
   *
   *
   */
  const { citizen, authenticated } = useUser();

  /**
   * COMPONENT STATE
   *
   *
   *
   *
   */
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  // all the items fetched from the API, ordered by updated_date from newest to oldest
  const [dispositifList, setDispositifList] = useState<Incentive[]>([]);
  // only the items filtered by the user
  const [filteredDispositifList, setFilteredDispositifList] = useState<
    Incentive[]
  >([]);
  const [activeFilters, setActiveFilters] = useState<OptionType[]>([]);

  /**
   * VARIABLES
   *
   *
   *
   *
   */
  const { keycloak } = useKeycloak();
  const [termSearch, setTermSearch] = useQueryParam('search', StringParam);

  /**
   * FUNCTIONS
   *
   *
   *
   *
   * handle incentives search
   * @param term search term for the incentives type
   * @returns incentives list
   */
  const searchIncentive = (
    term?: string,
    incentiveType?: string | string[],
    enterpriseId?: string
  ): (() => void) => {
    let mounted = true;
    searchAide<Incentive[]>(term, incentiveType, enterpriseId)
      .then((result: object[]) => {
        if (mounted) {
          setDispositifList(result as Incentive[]);
        }
      })
      .catch((error: object) => {
        setIsLoaded(true);
      });
    return function cleanup() {
      mounted = false;
    };
  };

  /**
   * building options object for select
   */
  const filterOptions = Object.entries(transportMapping).map(
    ([value, label]) => {
      return { value, label };
    }
  );

  /**
   * callback used by react-select on change
   */
  const onSelectChange = useCallback((option) => {
    setActiveFilters(option);
  }, []);

  /**
   * handle the search submit
   * @param term the search inventive type
   */
  const handleSearchSubmit = (term: string): void => {
    setTermSearch(term);
  };

  /**
   * USE EFFECTS
   *
   *
   *
   *
   */
  useEffect(() => {
    if (
      citizen?.affiliation?.affiliationStatus === AffiliationStatus.AFFILIATED
    ) {
      searchIncentive(
        termSearch as string | undefined,
        [INCENTIVE_TYPE.NATIONAL_INCENTIVE, INCENTIVE_TYPE.TERRITORY_INCENTIVE],
        citizen.affiliation.enterpriseId
      );
    } else {
      searchIncentive(termSearch as string | undefined, [
        INCENTIVE_TYPE.NATIONAL_INCENTIVE,
        INCENTIVE_TYPE.TERRITORY_INCENTIVE,
      ]);
    }
  }, [termSearch]);

  /**
   * set the incentive list depend on the active filters
   */
  useEffect(() => {
    const getFilteredList = (): Incentive[] => {
      /**
       *  if there is no filter, display all the items
       */
      if (activeFilters.length === 0) {
        return dispositifList;
      }

      /**
       * get the list of active filters value
       */
      const activeFiltersValues = activeFilters.map((filter) => filter.value);

      /**
       * return the filtered dispositif list
       */
      return dispositifList.filter((aide) => {
        return aide.transportList.some(
          (value: string) => activeFiltersValues.indexOf(value) !== -1
        );
      });
    };
    setFilteredDispositifList(getFilteredList());
  }, [activeFilters, dispositifList]);

  /**
   * control the loaded state of the component
   */
  useEffect(() => {
    setIsLoaded(true);
  }, [filteredDispositifList]);

  /**
   * COMPONENT RENDER
   *
   *
   *
   *
   */
  return (
    <Layout
      footer={{
        imageFilename: 'man-riding-bike.jpg',
        isVisibleOnMobile: true,
      }}
      fullWidth
    >
      <div className="page-container">
        <Breadcrumb crumbs={crumbs} crumbSeparator=" > " />
      </div>

      <div className="mcm-aides">
        <section className="mcm-aides__header">
          <div className="page-container o-bg-wrapper m-bg-wrapper">
            <div className="search-section">
              <h1 className="mb-s">{Strings['search.incentive.text']}</h1>
              {authenticated ? (
                <p className="mb-s">
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

              <SearchForm
                onSubmit={handleSearchSubmit}
                searchText={termSearch as string | undefined}
                placeholder={Strings['form.search.incentive.placeholder']}
                label={Strings['form.search.incentive.label']}
              />
            </div>
          </div>
        </section>
        <section className="mcm-aides__body">
          <div className="page-container">
            {!isLoaded && <h2>{Strings['loading.text']}</h2>}
            {isLoaded && (
              <>
                <div className="mcm-filters">
                  <SearchResultsTitle
                    nbResult={filteredDispositifList.length}
                    termSearch={termSearch as string | undefined}
                    filtersSearch={activeFilters.map((filter: OptionType) => {
                      return filter.label;
                    })}
                  />
                  <div className="mcm-filters__dropdown">
                    <FilterSelect
                      options={filterOptions}
                      isMulti
                      onSelectChange={onSelectChange}
                      placeholder={Strings['form.filter.select.placeholder']}
                    />
                  </div>
                </div>
                <AideSearchList
                  items={filteredDispositifList}
                  greenCard={!authenticated}
                />
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

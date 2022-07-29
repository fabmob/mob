import React, { FC, useCallback, useEffect, useState, ReactNode } from 'react';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import { PageProps } from 'gatsby';
import { useQueryParam, StringParam } from 'use-query-params';
import FileSaver from 'file-saver';

import Layout from '@components/Layout/Layout';
import Tab from '@components/Tabs/Tabs';
import Heading from '@components/Heading/Heading';
import DemandeSearchList from '@components/DemandeSearch/DemandeSearchList/DemandeSearchList';
import FilterSelect from '@components/FiltersSelect/FilterSelect';
import SearchForm from '@components/SearchForm/SearchForm';
import SearchResultsTitle from '@components/SearchResultsTitle/SearchResultsTitle';
import { OptionType } from '@components/FiltersSelect/FilterSelect';
import SVG from '@components/SVG/SVG';

import { listAide } from '@api/AideService';
import { subscriptionList, demandesValideesXlsx } from '@api/DemandeService';
import { getUserFunderCommunities } from '@api/UserFunderService';

import { Subscription, STATUS } from '@utils/demandes';
import { Incentive } from '@utils/aides';
import { useGetFunder } from '@utils/keycloakUtils';
import { formattedDateFile } from '@utils/helpers';
import { Community } from '@utils/funders';

import { useUser } from '../../../context';

import Strings from './locale/fr.json';

import './_administrer-demandes.scss';

const AdministrerDemandes: FC<PageProps> = ({
  pageContext: {
    breadcrumb: { crumbs },
  },
}) => {
  const [aides, setAides] = useState<{ id: string; title: string }[]>([]);
  const [userFunderCommunities, setUserFunderCommunities] = useState<
    Community[]
  >([]);
  const { userFunder } = useUser();

  // only the items filtered by the user
  const [filteredDemandes, setFilteredDemandes] = useState<Subscription[]>([]);
  const [termSearch, setTermSearchs] = useQueryParam('search', StringParam);
  const [activeFiltersAides, setActiveFiltersAides] = useState<OptionType[]>(
    []
  );

  const [activeFiltersCommunities, setActiveFiltersCommunities] = useState<
    OptionType[]
  >([]);

  const { funderType } = useGetFunder();
  const [selectedTab, setSelectedTab] = useState<string>(STATUS.TO_PROCESS);

  const tabsArray = [
    {
      id: 0,
      tabLabel: Strings['dashboard.subscription.tabLabel.toTreat'],
      statusState: STATUS.TO_PROCESS,
    },
    {
      id: 1,
      tabLabel: Strings['dashboard.subscription.tabLabel.valid'],
      statusState: STATUS.VALIDATED,
    },
    {
      id: 2,
      tabLabel: Strings['dashboard.subscription.tabLabel.rejected'],
      statusState: STATUS.REJECTED,
    },
  ];

  useEffect(() => {
    if (selectedTab && activeFiltersAides && activeFiltersCommunities) {
      const activeIncentiveIds = activeFiltersAides.map(({ id }) => id);
      const activeCommunitiesId = activeFiltersCommunities.map(
        ({ value }) => value
      );

      subscriptionList<Incentive[]>(
        selectedTab,
        activeIncentiveIds,
        activeCommunitiesId,
        termSearch
      )
        .then((result: any) => {
          setFilteredDemandes(result);
        })
        .catch((err: string) => console.log(err));
    } else {
      setFilteredDemandes([]);
    }
  }, [selectedTab, activeFiltersAides, termSearch, activeFiltersCommunities]);

  useEffect(() => {
    listAide<{ id: string; title: string }[]>()
      .then((result: { id: string; title: string }[]) => {
        if (result && result.length > 0) {
          setAides(result);
        }
      })
      .catch((err: string) => console.log(err));
    getUserFunderCommunities(userFunder).then((communities: Community[]) => {
      setUserFunderCommunities(communities);
    });
  }, []);

  // Callback used by react-select on change
  const onSelectChangeAides = useCallback((option) => {
    setActiveFiltersAides(option);
  }, []);

  const onSelectChangeCommunities = useCallback((option) => {
    setActiveFiltersCommunities(option);
  }, []);

  const filterOptions = aides.map(({ title, id }) => ({
    value: title,
    label: title,
    id,
  }));

  const uniqueArray = filterOptions.filter((thing, index) => {
    return (
      index ===
      filterOptions.findIndex((obj) => {
        return obj.label === thing.label;
      })
    );
  });

  const communityOptions: OptionType[] = userFunderCommunities.map(
    (community: Community) => {
      return { label: community.name, value: community.id };
    }
  );

  const handleSearchSubmit = (term: string): void => {
    setTermSearchs(term);
  };

  const renderDemandesByStatus = (): ReactNode => {
    switch (selectedTab) {
      case STATUS.TO_PROCESS:
        return Strings['dashboard.subscription.pending.plural'];
      case STATUS.VALIDATED:
        return Strings['dashboard.subscription.validated.plural'];
      case STATUS.REJECTED:
        return Strings['dashboard.subscription.rejected.plural'];
      default:
        return '';
    }
  };

  const downlodFileXlsx = async () => {
    try {
      const today = new Date();
      const fileName = formattedDateFile(today) + '-AidesValideesMOB.xlsx';
      // Prepare file for download
      const file = await demandesValideesXlsx();
      const blob = new Blob([file.data]);
      FileSaver.saveAs(blob, fileName);
    } catch (err) {
      console.log(err);
    }
  };

  const renderExplicitDemandes = (): string => {
    return filteredDemandes.length === 1
      ? `${filteredDemandes.length} demande ${
          selectedTab === 'A_TRAITER'
            ? Strings['dashboard.subscription.filter.toTreat']
            : '' || selectedTab === 'VALIDEE'
            ? Strings['dashboard.subscription.filter.valid']
            : '' || selectedTab === 'REJETEE'
            ? Strings['dashboard.subscription.filter.rejected']
            : ''
        }`
      : `${filteredDemandes.length} demandes ${
          selectedTab === 'A_TRAITER'
            ? Strings['dashboard.subscription.filter.plural.toTreat']
            : '' || selectedTab === 'VALIDEE'
            ? Strings['dashboard.subscription.filter.plural.valid']
            : '' || selectedTab === 'REJETEE'
            ? Strings['dashboard.subscription.filter.plural.rejected']
            : ''
        }`;
  };

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
      {/* TODO: supprimer mcm-aides sans regression design */}
      <div className="mcm-administrer-demandes mcm-aides">
        <section className="page-container">
          <div className="m-yellow-bg-wrapper">
            <Heading level="h1" className="">
              {Strings['dashboard.subscription.title.manage']}
            </Heading>
          </div>
        </section>
        <div className="mcm-home">
          <div className="mcm-tabs">
            <Tab
              tabs={tabsArray}
              setSelectedIndex={setSelectedTab}
              funderType={funderType}
            />

            <div className="mcm-tabs__content has-info">
              <div
                className="page-container__list-section"
                style={{ display: '' }}
              >
                <Heading level="h1" className="mb-s">
                  {renderDemandesByStatus()}
                </Heading>
                <div className="dashboard-group-first">
                  {selectedTab === 'VALIDEE' && filteredDemandes.length > 0 && (
                    <div className="mcm-download-validee">
                      <a
                        id="downlodFileXlsx"
                        href="#"
                        onClick={downlodFileXlsx}
                      >
                        <SVG
                          icon="download-xlsx"
                          className="svg-download"
                          size={45}
                        />
                        <span>
                          {Strings['dashboard.subscription.download']}
                        </span>
                      </a>
                    </div>
                  )}
                  <div className="dashboard-group-second">
                    <SearchForm
                      onSubmit={handleSearchSubmit}
                      searchText={undefined}
                      label= {Strings['search.form.label']}
                      placeholder= {Strings['search.form.placeholder']}
                    />
                    <div className="bloc-sections">
                      <div className="mcm-filters">
                        <SearchResultsTitle
                          defaultInitText={renderExplicitDemandes()}
                          nbResult={filteredDemandes.length}
                          filtersSearch={
                            activeFiltersCommunities
                              ? activeFiltersAides
                                  .concat(activeFiltersCommunities)
                                  .map((filter: OptionType) => {
                                    return filter.label;
                                  })
                              : []
                          }
                          termSearch={termSearch as string}
                        />
                      </div>
                      <div className="mcm-filters__dropdown">
                        <FilterSelect
                          options={communityOptions}
                          isMulti
                          onSelectChange={onSelectChangeCommunities}
                          placeholder={Strings['filter.select.placeholder.community']}
                        />
                      </div>
                      <div className="mcm-filters__dropdown">
                        <FilterSelect
                          options={uniqueArray}
                          isMulti
                          onSelectChange={onSelectChangeAides}
                          placeholder={Strings['filter.select.placeholder.name']}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {filteredDemandes.length >= 200 && (
                  <p className="mcm-info-length">
                    {Strings['filter.select.infos.lenght']}
                  </p>
                )}

                <DemandeSearchList items={filteredDemandes} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdministrerDemandes;

import React, { FC, ReactNode, useState, useEffect } from 'react';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb';
import { useQueryParam, StringParam } from 'use-query-params';
import toast from 'react-hot-toast';
import { Link } from 'gatsby';

import Layout from '@components/Layout/Layout';
import Heading from '@components/Heading/Heading';
import SearchForm from '@components/SearchForm/SearchForm';
import CardLine from '@components/CardLine/CardLine';
import CardLineColumn from '@components/CardLine/CardLineColumn';
import CardLineContent from '@components/CardLine/CardLineContent';
import Button from '@components/Button/Button';
import ModalComponent, { ParamsModal } from '@components/Modal/Modal';
import Tab from '@components/Tabs/Tabs';

import {
  searchSalaries,
  Citizen,
  putCitizenDesaffiliation,
} from '@api/CitizenService';

import { useRoleAccepted } from '@utils/keycloakUtils';
import { AFFILIATION_STATUS } from '@utils/citoyens';
import { capitalize } from '@utils/helpers';

import { Roles } from '../../../../constants';
import { useUser } from '../../../../context';

import Strings from './locale/fr.json';

import './_gerer-salaries.scss';

interface GestionSalarierProps {
  pageContext: { breadcrumb: { crumbs: string; crumbLabel: string } };
  location: Location;
  isGestionnaireBtn?: boolean;
}

/**
 * @name GererSalaries
 * @description This component is for either managers or supervisors to see their employees
 * @type [Business Controller]
 */
const GererSalaries: FC<GestionSalarierProps> = ({ location, pageContext }) => {
  const {
    breadcrumb: { crumbs, crumbLabel },
  } = pageContext;

  const SKIPNORECORDS = 0;

  const [root, setRoot] = useState<boolean>(false);
  const [isShowModal, setShowModal] = useState<boolean>(false);
  const [citizenId, setCitizenId] = useState<string>();
  const [salarieName, setSalarieName] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>(
    AFFILIATION_STATUS.AFFILIATED
  );

  const [totalSalaries, setTotalSalaries] = useState<number>(0);

  const [skip, setSkip] = useState<number>(SKIPNORECORDS);
  const [salaries, setSalaries] = useState<Citizen[]>([]);

  const [termSearch, setTermSearch] = useQueryParam('search', StringParam);
  const isManager: boolean = useRoleAccepted(Roles.MANAGERS);
  const isSupervisor: boolean = useRoleAccepted(Roles.SUPERVISORS);

  const tabsArray = [
    {
      id: 0,
      tabLabel: Strings['dashboard.management.employees.tabs.affiliated'],
      statusState: AFFILIATION_STATUS.AFFILIATED,
    },
    {
      id: 1,
      tabLabel: Strings['dashboard.management.employees.tabs.to.affiliate'],
      statusState: AFFILIATION_STATUS.TO_AFFILIATE,
    },
    {
      id: 2,
      tabLabel: Strings['dashboard.management.employees.tabs.disaffiliated'],
      statusState: AFFILIATION_STATUS.DISAFFILIATED,
    },
  ];

  /**
   * FUNCTIONS
   *
   *
   *
   *
   * Get Affiliated/Disaffiliated/ToAffiliate Salaries based on selected Tab and number of skipped elements
   */
  const getMatchedSalaries = async (
    skipRecords: number,
    lastName?: string
  ): Promise<any> => {
    // This mounted boolean will fix and eliminate memory leaks
    let isMounted = true;

    setSkip(skipRecords);
    await searchSalaries<Citizen[]>(selectedTab, lastName, skipRecords)
      .then((res: { employees: Citizen[]; employeesCount: number }) => {
        if (isMounted) {
          // check skip number and set employees array
          skipRecords === SKIPNORECORDS
            ? setSalaries([...(res.employees as Citizen[])])
            : setSalaries([...salaries, ...(res.employees as Citizen[])]);
          setTotalSalaries(res.employeesCount);
        }
      })
      .catch((err: any) => {});
    return function cleanup() {
      isMounted = false;
    };
  };

  /*
   * Get More Affiliated/Disaffiliated/ToAffiliate Salaries based on previous skip number
   */
  const loadMore = () => {
    setSkip(skip + 10);
  };

  /*
   * Get Salaries by lastname
   */
  const handleSearchSalariesSubmit = (lastName: string): void => {
    setTermSearch(lastName);
  };

  /*
   * Render Salaries based on active Tab
   */
  const renderSalaries = (): ReactNode => {
    if (salaries && salaries.length) {
      return salaries.map(({ id, firstName, lastName }) => {
        return (
          <CardLine key={id} classnames="salaries-card">
            <CardLineContent classnames="salaries-card__name span">
              <CardLineColumn>
                <span>{`${lastName.toUpperCase()} ${capitalize(
                  firstName
                )} `}</span>
              </CardLineColumn>
              {isSupervisor &&
              !isManager &&
              selectedTab === AFFILIATION_STATUS.AFFILIATED ? (
                <CardLineColumn classnames="salaries-card__first-btn">
                  <div className="supression-superviseur">
                    <Button
                      onClick={() => {
                        openModal(id, lastName, firstName);
                      }}
                      secondary
                    >
                      {
                        Strings[
                          'dashboard.management.employees.button.deletion.supervisor'
                        ]
                      }
                    </Button>
                  </div>
                </CardLineColumn>
              ) : null}

              {isManager && selectedTab !== AFFILIATION_STATUS.TO_AFFILIATE ? (
                <>
                  <CardLineColumn classnames="salaries-card__gestionnaire-btn">
                    <div className="gestion-btn">
                      <Link
                        to={`/gerer-salaries/${id}`}
                        state={{ firstName, lastName }}
                      >
                        <Button secondary>
                          {
                            Strings[
                              'dashboard.management.employees.button.check.subscriptions'
                            ]
                          }
                        </Button>
                      </Link>
                    </div>
                    {selectedTab === AFFILIATION_STATUS.AFFILIATED && (
                      <div className="supression-btn">
                        <Button
                          secondary
                          onClick={() => {
                            openModal(id, lastName, firstName);
                          }}
                        >
                          {
                            Strings[
                              'dashboard.management.employees.button.deletion.supervisor'
                            ]
                          }
                        </Button>
                      </div>
                    )}
                  </CardLineColumn>
                </>
              ) : null}
            </CardLineContent>
          </CardLine>
        );
      });
    }
    return (
      <p className="salaries-card__no-result">
        {Strings['dashboard.management.employees.no.result']}
      </p>
    );
  };

  /*
   * Display load button based on salaries number
   */
  const renderLoadButton = () => {
    if (salaries?.length < totalSalaries) {
      return (
        <div className="load-more-btn">
          <Button data-testid="add-more-button" secondary onClick={loadMore}>
            {Strings['dashboard.management.employees.button.load.more']}
          </Button>
        </div>
      );
    }
  };

  /**
   * MODAL SETUP
   *
   *
   *
   *
   * Call putCitizenDesaffiliation service
   */
  const onSubmit = () => {
    putCitizenDesaffiliation(citizenId)
      .then(() => {
        toast.success(
          Strings['dashboard.management.employees.delete.modal.title']
        );
        setShowModal(false);
        const newSalaries = salaries.filter(
          (salarie) => salarie.id !== citizenId
        );
        setSalaries(newSalaries);
        setTotalSalaries(totalSalaries - 1);
      })
      .catch((err: string) => { });
  };

  /*
   * Modal disaffiliation Params
   */
  const params: ParamsModal = {
    title: Strings['dashboard.management.employees.delete.modal.title'],
    submitBtn: {
      label:
        Strings['dashboard.management.employees.delete.modal.button.submit'],
      onClick: onSubmit,
    },
    cancelBtn: {
      label:
        Strings['dashboard.management.employees.delete.modal.button.cancel'],
      onClick: '',
    },
  };

  /*
   * Open Modal Delete Affiliation
   */
  const openModal = (citizen: string, lastName: string, firstName: string) => {
    setShowModal(true);
    const name = `${lastName.toUpperCase()} ${firstName} `;
    setSalarieName(name);
    setCitizenId(citizen);
  };

  /*
   * Close Modal Delete Affiliation
   */
  const closeModal = () => {
    setShowModal(false);
  };

  /**
   * USE EFFECTS
   *
   *
   *
   *
   *
   */
  useEffect(() => {
    if (location?.pathname === '/') setRoot(true);
  }, []);

  useEffect(() => {
    getMatchedSalaries(SKIPNORECORDS, termSearch as string | undefined);
  }, [selectedTab, termSearch]);

  useEffect(() => {
    getMatchedSalaries(skip, termSearch as string | undefined);
  }, [skip]);

  return (
    <Layout
      fullWidth
      footer={{
        imageFilename: 'man-riding-bike.jpg',
      }}
    >
      <ModalComponent
        params={params}
        isShowModal={isShowModal}
        closeModal={closeModal}
      >
        <p>
          {Strings['dashboard.management.employees.delete.modal.body'].replace(
            '{0}',
            salarieName
          )}
        </p>
      </ModalComponent>
      <div className="page-container">
        {!root && (
          <Breadcrumb
            crumbLabel={crumbLabel}
            location={location}
            crumbs={crumbs}
            crumbSeparator=" > "
          />
        )}
      </div>
      <div>
        <section className="page-container">
          <div className="m-yellow-bg-wrapper">
            <Heading level="h1">
              {Strings['dashboard.management.employees.title']}
            </Heading>
          </div>
        </section>
        <div className="mcm-home">
          <div className="mcm-tabs">
            <Tab
              tabs={tabsArray}
              setSelectedIndex={setSelectedTab}
              defaultActiveTab={tabsArray[0].id}
            />

            <div className="mcm-tabs__content has-info">
              <div className="page-container__list-section">
                <div>
                  <SearchForm
                    className="search-salaries-input"
                    onSubmit={handleSearchSalariesSubmit}
                    searchText={termSearch as string | undefined}
                    data-testid="search-salaries-input"
                    label={
                      Strings['dashboard.management.employees.search.label']
                    }
                    placeholder={
                      Strings[
                      'dashboard.management.employees.search.placeholder'
                      ]
                    }
                  />
                  <div className="total-employees">
                    {Strings['dashboard.management.employees.all.title']}
                  </div>
                </div>
                <>
                  <div className="salaries-list">{renderSalaries()}</div>
                  {renderLoadButton()}
                </>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GererSalaries;

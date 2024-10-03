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
import ModalComponent from '@components/Modal/Modal';
import Tab from '@components/Tabs/Tabs';
import TooltipInfoIcon from '@components/TooltipInfoIcon/TooltipInfoIcon';
import {
  getCitizensCount,
  searchSalaries,
  requestCitizenDesaffiliation,
  requestCitizenAffiliation,
} from '@api/CitizenService';
import { getFunderById } from '@api/FunderService';

import { useRoleAccepted } from '@utils/keycloakUtils';
import { AFFILIATION_STATUS, PartialCitizen } from '@utils/citoyens';
import {
  capitalizeFirst,
  formattedBirthdate,
  firstCharUpper,
} from '@utils/helpers';
import { Funder } from '@utils/funders';

import { useUser } from '../../../../context';
import { Roles } from '../../../../constants';

import Strings from './locale/fr.json';

import './_gerer-salaries.scss';

interface GestionSalarierProps {
  pageContext: { breadcrumb: { crumbs: string; crumbLabel: string } };
  location: Location;
}

interface CitizensCount {
  count: number;
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

  const { userFunder } = useUser();
  const SKIPNORECORDS = 0;
  const LIMIT = 10;
  const [root, setRoot] = useState<boolean>(false);
  const [isShowModal, setShowModal] = useState<boolean>(false);
  const [citizenId, setCitizenId] = useState<string>();
  const [salarieName, setSalarieName] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [salarieEmail, setSalarieEmail] = useState<string | undefined>('');
  const [salarieBirthDate, setSalarieBirthDate] = useState<string | undefined>(
    ''
  );
  const [userEntreprise, setUserEnterprise] = useState<Funder>({});
  const [routeSelectedTab] = useQueryParam('tab', StringParam);
  const [selectedTab, setSelectedTab] = useState<string>(
    routeSelectedTab || AFFILIATION_STATUS.AFFILIATED
  );
  const [totalSalaries, setTotalSalaries] = useState<number>(0);
  const [skip, setSkip] = useState<number>(SKIPNORECORDS);
  const [salaries, setSalaries] = useState<PartialCitizen[]>([]);
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
   * Get user funder
   */
  const onGetFunderById = (): void => {
    getFunderById<Funder>(userFunder.funderId).then(
      (result: Funder) => {
        setUserEnterprise(result);
      },
      (error: any) => {}
    );
  };

  /**
   * USE EFFECTS
   */
  useEffect(() => {
    onGetFunderById();
  }, []);

  /**
   * FUNCTIONS
   * Get Affiliated/Disaffiliated/ToAffiliate Salaries based on selected Tab and number of skipped elements
   */
  const getMatchedSalaries = async (
    skipRecords: number,
    lastName?: string
  ): Promise<() => void> => {
    // This mounted boolean will fix and eliminate memory leaks
    let isMounted = true;

    setSkip(skipRecords);
    await searchSalaries<PartialCitizen[]>(
      userFunder.funderId,
      selectedTab,
      lastName,
      LIMIT,
      skipRecords
    )
      .then((res: PartialCitizen[]) => {
        if (isMounted) {
          // check skip number and set employees array
          skipRecords === SKIPNORECORDS
            ? setSalaries([...(res as PartialCitizen[])])
            : setSalaries([...salaries, ...(res as PartialCitizen[])]);
        }
      })
      .catch((err: any) => {});
    return function cleanup() {
      isMounted = false;
    };
  };

  /**
   * get citizens count
   * @param funderId funder Id
   * @param lastName citizen lastName
   */
  const getCount = async (): Promise<void> => {
    const result: CitizensCount = await getCitizensCount(
      userFunder.funderId,
      termSearch,
      selectedTab
    );

    setTotalSalaries(result?.count);
  };

  /**
   * triggered on a search or
   *
   */
  useEffect(() => {
    getCount();
  }, [selectedTab, termSearch]);

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
   * Set default active Tab
   */
  const setDefaultActiveTab = () => {
    const tab = tabsArray.find((el) => el.statusState === selectedTab);
    return tab?.id;
  };

  /*
   * Render Salaries based on active Tab
   */
  const renderSalaries = (): ReactNode => {
    if (salaries && salaries.length) {
      return salaries.map(
        ({ id, firstName, lastName, enterpriseEmail, email, birthdate }) => {
          return (
            <CardLine key={id} classnames="salaries-card">
              <CardLineContent classnames="salaries-card__name span">
                <CardLineColumn>
                  <span>{`${firstCharUpper(
                    firstName
                  )} ${lastName.toUpperCase()}`}</span>
                </CardLineColumn>
                {(isSupervisor || isManager) &&
                selectedTab === AFFILIATION_STATUS.TO_AFFILIATE &&
                userEntreprise?.enterpriseDetails?.hasManualAffiliation &&
                !enterpriseEmail ? (
                  <CardLineColumn classnames="card-line__column salaries-card__gestionnaire-btn">
                    <div className="gestion-btn">
                      <Button
                        secondary
                        onClick={() => {
                          openModal(id, lastName, firstName, email, birthdate);
                        }}
                      >
                        {
                          Strings[
                            'dashboard.management.employees.button.manage.affiliation'
                          ]
                        }
                      </Button>
                    </div>
                  </CardLineColumn>
                ) : selectedTab === AFFILIATION_STATUS.TO_AFFILIATE ? (
                  <div className="profile-icon">
                    <span>En cours</span>
                    <TooltipInfoIcon
                      iconName="information"
                      iconSize={20}
                      tooltipContent={
                        Strings['dashboard.management.employees.tip.text']
                      }
                    />
                  </div>
                ) : null}

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

                {isManager &&
                selectedTab !== AFFILIATION_STATUS.TO_AFFILIATE ? (
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
        }
      );
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
   * Call requestCitizenDesaffiliation service
   */
  const onSubmit = () => {
    requestCitizenDesaffiliation(citizenId)
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
      .catch((err: string) => {});
  };

  /**
   * AFFILIATE MODAL SETUP
   * Affiliate a citizen
   */
  const onSubmitAffiliate = () => {
    requestCitizenAffiliation(citizenId)
      .then(() => {
        toast.success(
          Strings['dashboard.management.employees.affiliate.action.success']
        );
        setShowModal(false);
        const newSalaries = salaries.filter(
          (salarie) => salarie.id !== citizenId
        );
        setSalaries(newSalaries);
        setTotalSalaries(totalSalaries - 1);
      })
      .catch((err: string) => {});
  };

  /**
   * MANAGE AFFILIATION MODAL FUNCTION
   */

  const computeParamModal = () => {
    if (selectedTab === AFFILIATION_STATUS.TO_AFFILIATE) {
      return {
        title:
          Strings[
            'dashboard.management.employees.manage.affiliation.modal.title'
          ],
        lastName: {
          name: Strings['dashboard.management.employees.modal.lastName'],
          value: lastName,
        },
        firstName: {
          name: Strings['dashboard.management.employees.modal.firstName'],
          value: firstName,
        },
        email: {
          name: Strings['dashboard.management.employees.modal.email'],
          value: salarieEmail,
        },
        birthdate: {
          name: Strings['dashboard.management.employees.modal.birthdate'],
          value: formattedBirthdate(new Date(salarieBirthDate!)),
        },
        submitBtn: {
          label:
            Strings[
              'dashboard.management.employees.delete.modal.button.submit'
            ],
          onClick: onSubmitAffiliate,
        },
        rejectBtn: {
          label:
            Strings[
              'dashboard.management.employees.manage.affiliation.modal.button.reject'
            ],
          onClick: onSubmit,
        },
        cancelBtn: {
          label:
            Strings[
              'dashboard.management.employees.delete.modal.button.cancel'
            ],
          onClick: '',
        },
      };
    }
    return {
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
  };

  /*
   * Open any Modal 
   */
  const openModal = (
    citizen: string,
    lastName: string,
    firstName: string,
    email?: string,
    birthdate?: string
  ) => {
    setShowModal(true);
    const name = `${capitalizeFirst(firstName)} ${lastName.toUpperCase()}  `;
    setSalarieName(name);
    setFirstName(capitalizeFirst(firstName));
    setLastName(capitalizeFirst(lastName));
    setSalarieBirthDate(birthdate);
    setSalarieEmail(email);
    setCitizenId(citizen);
  };

  /*
   * Close any Modal 
   */
  const closeModal = () => {
    setShowModal(false);
  };

  /**
   * USE EFFECTS
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
      pageTitle={Strings['dashboard.management.employees.title']}
    >
      <ModalComponent
        params={computeParamModal()}
        isShowModal={isShowModal}
        closeModal={closeModal}
      >
        <p>
          {selectedTab !== AFFILIATION_STATUS.TO_AFFILIATE
            ? Strings[
                'dashboard.management.employees.delete.modal.body'
              ].replace('{0}', salarieName)
            : null}
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
              defaultActiveTab={setDefaultActiveTab}
            />

            <div className="mcm-tabs__content has-info">
              <div className="page-container__list-section">
                <div>
                  <SearchForm
                    className="search-salaries-input"
                    onSubmit={handleSearchSalariesSubmit}
                    searchText={termSearch}
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
                    {`${totalSalaries} ${Strings['dashboard.management.employees.title']}`}
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

import React, { FC, useEffect, useState, ReactNode } from 'react';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import { PageProps, navigate } from 'gatsby';

import { subscriptionList } from '@api/DemandeService';
import { getCitizenById } from '@api/CitizenService';

import Layout from '@components/Layout/Layout';
import Heading from '@components/Heading/Heading';
import UserName from '@components/UserName/UserName';
import Button from '@components/Button/Button';
import CardRequest from '@components/CardRequest/CardRequest';
import { Subscription } from '@utils/demandes';
import { firstCharUpper } from '@utils/helpers';
import { Citizen } from '@utils/citoyens';

import { useGetFunder } from '@utils/keycloakUtils';

import { useUser } from '../../context';
import { FunderType } from '../../constants';

import Strings from './locale/fr.json';

import './_citizenSubscriptions.scss';

/**
 * @name CitizenSubscriptions
 * @description This component is for managers to see the employee subscription history
 * @type [Business Controller]
 */

interface Props {
  citizenId?: string;
  pageContext: { breadcrumb: { crumbs: Record<string, unknown>[] } };
  location: PageProps['location'];
}

interface SubscriptionData {
  subscriptions: Subscription[];
  count: number;
}

const CitizenSubscriptions: FC<Props> = ({
  citizenId,
  pageContext,
  location,
}) => {
  const {
    breadcrumb: { crumbs },
  } = pageContext;

  const [citizenName, setCitizenName] = useState<string>('');
  const [citizenDemandes, setCitizenDemandes] = useState<Subscription[]>([]);
  const [countDemandes, setCountDemandes] = useState<number>(0);
  const [pageContent, setPageContent] = useState<ReactNode>();
  const [userCommunitiesId, setUserCommunitiesId] = useState<string[]>([]);
  const [skip, setSkip] = useState<number>(0);
  const [breadCrumbData, setBreadCrumbData] = useState<
    Record<string, unknown>[]
  >([]);

  const { userFunder } = useUser();
  const { funderType } = useGetFunder();

  /**
   * get employees demandes
   * @param skip demandes skipped
   */
  const getEmployeeDemandes = async (
    communitiesId: string[]
  ): Promise<void> => {
    await subscriptionList<Subscription[]>(
      '',
      null,
      communitiesId,
      null,
      citizenId,
      skip
    )
      .then((result: SubscriptionData) => {
        setCitizenDemandes([...citizenDemandes, ...result.subscriptions]);
        setCountDemandes(result.count);
      })
      .catch((err: string) => {});
  };

  /**
   * fetch citizen/employee last
   */
  const fetchCitizenName = async (): Promise<void> => {
    if (citizenId) {
      await getCitizenById(citizenId, { fields: { identity: true } })
        .then((result: Citizen): void =>
          setCitizenName(
            `${firstCharUpper(
              result.identity.firstName
            )} ${result.identity.lastName.toUpperCase()} `
          )
        )
        .catch((err: any) => {
          navigate('/');
        });
    }
  };
  /**
   * set employee/citizen name in the state
   */
  useEffect(() => {
    if (location?.state?.lastName) {
      setCitizenName(
        `${firstCharUpper(
          location?.state?.firstName
        )} ${location?.state?.lastName.toUpperCase()} `
      );
    } else if (funderType === FunderType.ENTERPRISES) {
      fetchCitizenName();
    }
    if (userFunder.communityIds) {
      setUserCommunitiesId(userFunder.communityIds);
      if (citizenDemandes.length === 0) {
        getEmployeeDemandes(userFunder.communityIds);
      }
    }
  }, []);

  useEffect(() => {
    if (citizenDemandes.length > 0 && citizenName === '') {
      setCitizenName(
        `${firstCharUpper(
          citizenDemandes?.[0].firstName
        )} ${citizenDemandes?.[0].lastName.toUpperCase()} `
      );
    }
  }, [citizenDemandes]);

  /**
   * on click btn see more
   */
  const getMoreEmployee = () => {
    setSkip(skip + 10);
  };

  /**
   * triggered after clicking on see more
   */
  useEffect(() => {
    getEmployeeDemandes(userCommunitiesId);
  }, [skip]);

  /**
   * create page content
   */
  useEffect(() => {
    let jsxNode: ReactNode = (
      <div className="mcm-employee-no-demande">
        {location.pathname.includes('gerer-citoyens')
          ? Strings[
              'dashboard.management.citizen.subscriptions.no.subscriptions'
            ]
          : Strings[
              'dashboard.management.employees.subscriptions.no.subscriptions'
            ]}
      </div>
    );
    if (citizenDemandes && citizenDemandes.length) {
      jsxNode = citizenDemandes.map((subscription: Subscription) => (
        <CardRequest
          key={subscription.id}
          request={subscription}
          isSubscriptionHistory
        />
      ));
    }
    setPageContent(jsxNode);
    return () => {
      setPageContent([]);
    };
  }, [citizenDemandes]);

  /**
   * create breadCrumb data
   */
  useEffect(() => {
    if (breadCrumbData && breadCrumbData.length < 3) {
      const breadCrumb = {
        ...location,
        crumbLabel:
          Strings['dashboard.management.employees.subscriptions.title'],
      };
      setBreadCrumbData(crumbs.concat(breadCrumb));
    }
  }, [breadCrumbData]);

  return (
    <>
      {citizenName && (
        <Layout
          fullWidth
          footer={{
            imageFilename: 'man-riding-bike.jpg',
          }}
          pageTitle={
            Strings['dashboard.management.employees.subscriptions.title']
          }
        >
          <div className="page-container">
            <Breadcrumb crumbs={breadCrumbData} crumbSeparator=" > " />
          </div>
          <div className="mcm-gerer-salaries">
            <section className="page-container">
              <div className="m-yellow-bg-wrapper">
                <Heading level="h1">
                  {
                    Strings[
                      'dashboard.management.employees.subscriptions.title'
                    ]
                  }
                </Heading>
              </div>
            </section>
            <div className="mcm-tabs mcm-tabs__content has-info">
              <div className="page-container__list-section">
                <div className="mcm-employeeName">
                  <UserName userName={citizenName} />
                </div>
                <div className="mcm-employeeBlock">
                  <div className="mcm-heading">
                    <h3>
                      {`${countDemandes} `}
                      {
                        Strings[
                          'dashboard.management.employees.subscriptions.number.plural'
                        ]
                      }
                    </h3>
                  </div>
                  <div className="mcm-body">{pageContent}</div>
                  {countDemandes !== citizenDemandes.length && (
                    <div className="mcm-btn-bloc">
                      <Button secondary onClick={() => getMoreEmployee()}>
                        {
                          Strings[
                            'dashboard.management.employees.subscriptions.btn.see.more'
                          ]
                        }
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Layout>
      )}
    </>
  );
};

export default CitizenSubscriptions;

import React, { useEffect, useState } from 'react';
import { PageProps } from 'gatsby';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';

import Layout from '@components/Layout/Layout';
import Button from '@components/Button/Button';
import TabsMenu from '@components/TabsMenu/TabsMenu';
import Image from '@components/Image/Image';

import { StatusCode } from '@utils/https';
import { flattenTransportList } from '@utils/helpers';
import { Incentive, aidesMapping } from '@utils/aides';

import { getAide } from '@api/AideService';

import { AuthorizationRoute } from '@modules/routes';

import { Roles } from '../constants';

import NotFoundPage from './404';

import Strings from './locale/fr.json';

const AidePage = ({ location: { search }, pageContext }: PageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [incentive, setIncentive] = useState<Incentive>();
  const [APIError, setAPIError] = useState<object>();
  const {
    // @ts-ignore
    breadcrumb: { crumbs },
  } = pageContext;

  /**
   * USE EFFECTS
   *
   *
   *
   *
   */
  useEffect(() => {
    let mounted = true;

    // Retrieving id from GET params in URL
    const urlParams = new URLSearchParams(search);
    const incentiveSlug = urlParams.get('id'); // should return '604092ec8e0039001c04b945';

    if (incentiveSlug) {
      getAide(incentiveSlug).then(
        (result) => {
          if (mounted) {
            setIncentive(result);
            setIsLoaded(true);
          }
        },
        (error) => {
          if (mounted) {
            setAPIError(error);
            setIsLoaded(true);
          }
        }
      );
    }
    return function cleanup() {
      mounted = false;
    };
  }, [search]);

  /**
   * set the tabs values
   */
  if (isLoaded && incentive) {
    const {
      allocatedAmount,
      paymentMethod,
      conditions,
      additionalInfos,
      minAmount,
      description,
      funderName,
      incentiveType,
      title,
      transportList,
      subscriptionLink,
      contact,
    } = incentive;
    const tabsArray = [
      {
        id: 1,
        tabLabel: Strings['aide.page.tab.label.amount'],
        tabContent: allocatedAmount,
      },
      {
        id: 2,
        tabLabel: Strings['aide.page.tab.label.conditions'],
        tabContent: conditions,
      },
      {
        id: 3,
        tabLabel: Strings['aide.page.tab.label.payment.method'],
        tabContent: paymentMethod,
      },
    ];

    /**
     * RENDER
     *
     *
     *
     *
     *
     */
    // @ts-ignore
    return (
      <Layout fullWidth pageTitle={title}>
        <div className="page-container">
          <Breadcrumb crumbs={crumbs} crumbSeparator=" > " />
        </div>
        <div className="mcm-aide">
          <div className="page-container">
            <div className="mcm-aide__header o-bg-wrapper">
              <div className="header-body">
                {title && <h1 className="h2-like">{title}</h1>}
                {minAmount && <p className="h1-like">{minAmount}</p>}
                {transportList && (
                  <ul className="mcm-tags">
                    {/* @ts-ignore */}
                    {flattenTransportList(transportList).map(
                      (transport, index) => {
                        const uniqueKey = `tag-${index}`;
                        return (
                          <li key={uniqueKey} className="mcm-tags__item">
                            {transport}
                          </li>
                        );
                      }
                    )}
                    {/* @ts-ignore */}
                    <li className="mcm-tags__item">
                      {aidesMapping[incentiveType]}
                    </li>
                    <li className="mcm-tags__item">{funderName}</li>
                  </ul>
                )}
                <p>{description}</p>
                <a
                  id={`subscriptions-incentive`}
                  rel="noreferrer"
                  target={subscriptionLink && '_blank'}
                  href={
                    subscriptionLink ||
                    `/subscriptions/new?incentiveId=${incentive.id}`
                  }
                >
                  <Button>{Strings['aide.page.button.subscribe']}</Button>
                </a>
              </div>
              <div className="header-img">
                <div className="header-img__wrapper">
                  <Image filename="girl-smiling.jpg" />
                </div>
              </div>
            </div>
          </div>

          <div className="mcm-aide__body">
            <TabsMenu
              tabs={tabsArray}
              info={additionalInfos}
              contact={contact}
            />
          </div>
        </div>
      </Layout>
    );
  }

  /**
   * show 404 page if the incentive not existe
   */
  if (APIError?.data?.error?.statusCode === StatusCode.NotFound) {
    return <NotFoundPage />;
  }

  /**
   * redirect to the search page if the user is not authorized to see the incentive details
   */
  if (APIError?.data?.error?.statusCode === StatusCode.Forbidden) {
    window.location.href = `${window.location.origin}/recherche`;
  }

  /**
   * otherwise show the incentive details page
   */
  return <Layout />;
};

/**
 * high order component to check the page access depending on the user role
 */
const AideDetail = (props: PageProps) => {
  return (
    <AuthorizationRoute
      component={<AidePage {...props} />}
      forbiddenRoles={[Roles.SUPERVISORS, Roles.MANAGERS]}
    />
  );
};

export default AideDetail;

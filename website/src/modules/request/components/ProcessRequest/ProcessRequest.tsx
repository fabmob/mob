import React, { FC, useEffect, useState } from 'react';
import { navigate, PageProps } from 'gatsby';
import { Breadcrumb, useBreadcrumb } from 'gatsby-plugin-breadcrumb';

import Layout from '@components/Layout/Layout';
import RequestBody from '../RequestBody/RequestBody';
import RequestInformation from './RequestInformation/RequestInformation';
import { Subscription, SUBSCRIPTION_STEP, STATUS } from '@utils/demandes';
import { getDemandeById } from '@api/DemandeService';
import {
  CitizenCard,
  IdentityRessourceProps,
} from '../CitizenCard/CitizenCard';
import { useGetFunder } from '@utils/keycloakUtils';
import RequestValidate from './RequestValidate/RequestValidate';
import RequestConfirm from './RequestConfirm/RequestConfirm';
import RequestReject from './RequestReject/RequestReject';
import Strings from './locale/fr.json';
import './_process-request.scss';

interface Props {
  subscriptionId?: string;
  pageContext: { breadcrumb: { crumbs: Crumb[] } };
  location: PageProps['location'];
}

interface Crumb {
  location: string;
  pathname: string;
}

/**
 * @name ProcessRequest
 * @description The main component to process a request.
 * @type [Business Controller]
 */
const ProcessRequest: FC<Props> = ({
  location,
  pageContext,
  subscriptionId,
}) => {
  const [subscription, setSubscription] = useState<Subscription>();
  const [identity, setIdentity] = useState<IdentityRessourceProps>();
  const [isAuthorized, setIsAuthorized] = useState<Boolean>(false);
  const { funderName, incentiveType } = useGetFunder();
  const [step, setStep] = useState<SUBSCRIPTION_STEP>(
    SUBSCRIPTION_STEP.VISUALIZE
  );
  const descriptionByStep = {
    [SUBSCRIPTION_STEP.VISUALIZE]: {
      description: Strings['subscription.processRequest.visualize'],
      useIcon: false,
      iconName: undefined,
    },
    [SUBSCRIPTION_STEP.VALIDATE]: {
      description: Strings['subscription.processRequest.validate'],
      useIcon: true,
      iconName: 'success',
    },
    [SUBSCRIPTION_STEP.REJECT]: {
      description: Strings['subscription.processRequest.reject'],
      useIcon: false,
      iconName: undefined,
    },
    [SUBSCRIPTION_STEP.CONFIRM_VALIDATE]: {
      description: Strings['subscription.processRequest.confirmValidate'],
      useIcon: true,
      iconName: 'success',
    },
    [SUBSCRIPTION_STEP.CONFIRM_REJECT]: {
      description: Strings['subscription.processRequest.confirmReject'],
      useIcon: true,
      iconName: 'success',
    },
  };

  const {
    breadcrumb: { crumbs },
  } = pageContext;

  useEffect(() => {
    if (funderName) {
      retrieveDemandeById();
    }
  }, [funderName, subscriptionId]);

  useEffect(() => {
    if (subscription && !(canAccessPage() && isValidDemandeStatus())) {
      navigate('/');
    }
    if (subscription && canAccessPage() && isValidDemandeStatus()) {
      setIsAuthorized(true);
    }
  }, [subscription]);

  /**
   * Retrieve subscription
   */
  const retrieveDemandeById = async (): Promise<any> => {
    getDemandeById(subscriptionId)
      .then((data: Subscription) => {
        const {
          firstName,
          lastName,
          birthdate,
          city,
          postcode,
          email,
          citizenId,
          enterpriseEmail,
          isCitizenDeleted,
        } = data;
        setSubscription(data as Subscription);
        setIdentity({
          firstName,
          lastName,
          birthdate: new Date(birthdate),
          city,
          postcode,
          email,
          citizenId,
          affiliation: { enterpriseEmail: enterpriseEmail },
          isCitizenDeleted,
        });
      })
      .catch((err: any) => {
        navigate('/');
      });
  };

  /**
   * Check if user can access page based on funderName && incentiveType
   * @returns boolean
   */
  const canAccessPage = (): boolean => {
    return (
      funderName === subscription.funderName &&
      incentiveType === subscription.incentiveType
    );
  };

  /**
   * Check if subscription as A TRAITER status
   * @returns boolean
   */
  const isValidDemandeStatus = (): boolean => {
    return STATUS.TO_PROCESS === subscription.status;
  };

  /**
   * Use to update breadcrumbs path list on dynamic pages.
   * @param location Reach Router location prop passed by Gatsby to every page.
   * @param crumbs Array of current breadcrumbs generate by the breadcrumb plugin.
   * @param crumbLabel Name for the breadcrumb.
   * @see https://www.gatsbyjs.com/plugins/gatsby-plugin-breadcrumb/
   */
  const updateCrumbsParamUrl = (
    location: PageProps['location'],
    crumbs: {
      location: string;
      pathname: string;
    }[],
    crumbLabel: string
  ): {
    location: string;
    pathname: string;
  }[] => {
    return crumbs.concat(
      useBreadcrumb({
        location,
        crumbLabel,
      }).crumbs
    );
  };

  /**
   * Handle steps to reject or validate subscription
   * Possible steps :
   * VISUALIZE => VALIDATE
   * VALIDATE => VISUALIZE
   * VALIDATE => CONFIRM_VALIDATE
   * REJECT => VISUALIZE
   * REJECT => CONFIRM_REJECT
   * @param nextStep
   */
  const handleStep = (nextStep: SUBSCRIPTION_STEP) => {
    if (
      (step === SUBSCRIPTION_STEP.VISUALIZE &&
        nextStep === SUBSCRIPTION_STEP.VALIDATE) ||
      (step === SUBSCRIPTION_STEP.VALIDATE &&
        nextStep === SUBSCRIPTION_STEP.VISUALIZE) ||
      (step === SUBSCRIPTION_STEP.VISUALIZE &&
        nextStep === SUBSCRIPTION_STEP.REJECT) ||
      (step === SUBSCRIPTION_STEP.REJECT &&
        nextStep === SUBSCRIPTION_STEP.VISUALIZE) ||
      (step === SUBSCRIPTION_STEP.VALIDATE &&
        nextStep === SUBSCRIPTION_STEP.CONFIRM_VALIDATE) ||
      (step === SUBSCRIPTION_STEP.REJECT &&
        nextStep === SUBSCRIPTION_STEP.CONFIRM_REJECT)
    ) {
      setStep(nextStep);
    }
  };

  const breadCrumbData = updateCrumbsParamUrl(
    location,
    crumbs,
    Strings['subscription.processRequest.crumb.label.new.request']
  );

  return (
    <>
      {isAuthorized && subscription && (
        <Layout
          footer={{
            imageFilename: 'man-riding-bike.jpg',
            isVisibleOnMobile: true,
          }}
          pageTitle={subscription.incentiveTitle}
        >
          <Breadcrumb crumbs={breadCrumbData} crumbSeparator=" > " />

          <div className="mcm-request">
            <div className="mcm-request__main">
              <RequestBody
                date={new Date(subscription.createdAt)}
                title={subscription.incentiveTitle}
                description={descriptionByStep[step].description}
                useIcon={descriptionByStep[step].useIcon}
                iconName={descriptionByStep[step].iconName}
              >
                {step === SUBSCRIPTION_STEP.VISUALIZE && (
                  <RequestInformation
                    subscription={subscription}
                    handleStep={handleStep}
                  />
                )}
                {step === SUBSCRIPTION_STEP.VALIDATE && (
                  <RequestValidate
                    subscriptionId={subscription.id}
                    handleStep={handleStep}
                  />
                )}
                {step === SUBSCRIPTION_STEP.REJECT && (
                  <RequestReject
                    subscriptionId={subscription.id}
                    handleStep={handleStep}
                  />
                )}
                {(step === SUBSCRIPTION_STEP.CONFIRM_VALIDATE ||
                  step === SUBSCRIPTION_STEP.CONFIRM_REJECT) && (
                  <RequestConfirm />
                )}
              </RequestBody>
            </div>
            <div className="mcm-request__sidebar">
              {identity && <CitizenCard identity={identity} />}
            </div>
          </div>
        </Layout>
      )}
    </>
  );
};

export default ProcessRequest;

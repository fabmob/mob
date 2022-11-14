import React, { FC, useState } from 'react';
import { Link } from 'gatsby';

import Button from '@components/Button/Button';
import CircleProgressBar from '@components/CircleProgressBar/CircleProgressBar';
import { useRoleAccepted } from '@utils/keycloakUtils';
import { STATUS } from '@utils/demandes';

import {
  DemandeAideDashboard,
  getDemandesDashboard,
} from '@api/DashboardService';
import Heading from '@components/Heading/Heading';
import DashboardFilters from '@components/DashboardFilters/DashboardFilters';
import Tippy from '@tippyjs/react';

import { Roles } from '../../../../constants';

import Strings from '../locale/fr.json';

import './_demandes-dashboard.scss';

const DemandesDashboard: FC = () => {
  const [totalSubscriptionsCount, setTotalSubscriptionsCount] =
    useState<number>(0);
  const [pendingSubscriptionsCount, setPendingSubscriptionsCount] =
    useState<number>(0);
  const [validatedSubscriptionsCount, setValidatedSubscriptionsCount] =
    useState<number>(0);
  const [rejectedSubscriptionsCount, setRejectedSubscriptionsCount] =
    useState<number>(0);
  const [subscriptionsToTreat, setSubscriptionsToTreat] = useState<number>(0);

  // allowed personas role
  const isManager: boolean = useRoleAccepted(Roles.MANAGERS);

  // handle the dashboard result with by status and their counts
  const handleDemandesDashboardResult = async (
    yearSelected: string,
    semesterSelected: string
  ) => {
    const data: DemandeAideDashboard = await getDemandesDashboard(
      yearSelected,
      semesterSelected
    );

    /**
     * set the overall total demandes count
     */
    setTotalSubscriptionsCount(data.totalCount);

    /**
     * set the demandes count to be treated by the manager
     */
    setSubscriptionsToTreat(data.totalPending.count);

    /**
     * set the pending demandes count
     */
    setPendingSubscriptionsCount(
      data.result.find(
        (subscription: any) => subscription.status === STATUS.TO_PROCESS
      )?.count ?? 0
    );

    /**
     * set the validated demandes count
     */
    setValidatedSubscriptionsCount(
      data.result.find(
        (subscription: any) => subscription.status === STATUS.VALIDATED
      )?.count ?? 0
    );

    /**
     * set the rejected demandes count
     */
    setRejectedSubscriptionsCount(
      data.result.find(
        (subscription: any) => subscription.status === STATUS.REJECTED
      )?.count ?? 0
    );
  };

  /**
   * trigger on filters changes
   * @param yearSelected the selected year in the filter years field
   * @param semesterSelected the selected semester in the semester fields (all value by default)
   */
  const onFiltersChanges = (yearSelected: string, semesterSelected: string) => {
    handleDemandesDashboardResult(yearSelected, semesterSelected);
  };

  return (
    <>
      <div className="mcm-section-header" data-testid="demandes-total">
        <Heading like="h2">{Strings['dashboard.subscription.title']}</Heading>
      </div>

      <div className="mcm-demandes-container">
        <div className="mcm-demandes-pending">
          <div className="mcm-demandes-info" data-testid="requests-to-process">
            <Heading like="h1">{subscriptionsToTreat}</Heading>
            <p>
              {subscriptionsToTreat !== 1
                ? Strings['dashboard.subscription.pending.plural']
                : Strings['dashboard.subscription.pending.singular']}
            </p>
          </div>

          {isManager ? (
            <Link id="dashboard-admin-demande" to="/administrer-demandes">
              <Button>
                {Strings['dashboard.subscription.pending.button']}
              </Button>
            </Link>
          ) : (
            <Tippy
              content={Strings['dashboard.restriction.supervisor.button.tip']}
              className="form-tooltip"
              trigger="mouseenter focus"
              aria={{ content: 'describedby' }}
              maxWidth={330}
              placement="top"
              offset={[0, 16]}
            >
              <Link to="#">
                <Button disabled={!isManager}>
                  {Strings['dashboard.subscription.pending.button']}
                </Button>
              </Link>
            </Tippy>
          )}
        </div>

        <div className="mcm-demandes-recap-container">
          <div className="mcm-demandes-filters">
            <DashboardFilters filtersChanges={onFiltersChanges} />
          </div>

          <div className="mcm-demandes-recap">
            <CircleProgressBar
              classNames="mcm-blue-petrol"
              value={pendingSubscriptionsCount}
              max={totalSubscriptionsCount}
              text={
                pendingSubscriptionsCount !== 1
                  ? Strings['dashboard.subscription.to.treat.plural']
                  : Strings['dashboard.subscription.to.treat.singular']
              }
            />

            <CircleProgressBar
              classNames="mcm-green-leaf"
              value={validatedSubscriptionsCount}
              max={totalSubscriptionsCount}
              text={
                validatedSubscriptionsCount !== 1
                  ? Strings['dashboard.subscription.validated.plural']
                  : Strings['dashboard.subscription.validated.singular']
              }
            />

            <CircleProgressBar
              classNames="mcm-red"
              value={rejectedSubscriptionsCount}
              max={totalSubscriptionsCount}
              text={
                rejectedSubscriptionsCount !== 1
                  ? Strings['dashboard.subscription.rejected.plural']
                  : Strings['dashboard.subscription.rejected.singular']
              }
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DemandesDashboard;

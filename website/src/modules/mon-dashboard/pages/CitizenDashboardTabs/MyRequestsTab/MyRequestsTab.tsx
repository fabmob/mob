import React, { FC } from 'react';
import { STATUS } from '@utils/demandes';
import SubscriptionsListSection from './SubscriptionListSection';
import Strings from '../../locale/fr.json';

const MyRequestsTab: FC = () => {
  return (
    <>
      <SubscriptionsListSection
        title={Strings['dashboard.citizen.subscriptions.to.process.title']}
        defaultStatus={[STATUS.TO_PROCESS]}
        emptyMessage={
          Strings['dashboard.citizen.subscriptions.to.process.empty']
        }
      />
      <SubscriptionsListSection
        title={Strings['dashboard.citizen.subscriptions.history.title']}
        defaultStatus={[STATUS.VALIDATED, STATUS.REJECTED]}
        emptyMessage={Strings['dashboard.citizen.subscriptions.history.empty']}
        enableFilter
      />
    </>
  );
};

export default MyRequestsTab;

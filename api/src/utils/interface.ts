import {SUBSCRIPTION_STATUS} from '.';

import {EVENT_MESSAGE} from './enum';

/** DASHBOARDS */
export interface IDashboardCitizenIncentiveList {
  incentiveId: string;
  incentiveTitle: string;
  totalSubscriptionsCount: number;
  validatedSubscriptionPercentage: number;
}

export interface IDashboardCitizen {
  incentiveList: IDashboardCitizenIncentiveList[];
  totalCitizensCount: number;
}

export interface IDashboardSubscriptionResult {
  status: SUBSCRIPTION_STATUS;
  count: number;
}

export interface IDashboardSubscription {
  result: IDashboardSubscriptionResult[];
  totalCount: number;
  totalPending: {
    count: number;
  };
}

/** RABBITMQ */
export interface ISubscriptionPublishPayload {
  lastName: string;
  firstName: string;
  birthdate: string;
  citizenId: string;
  incentiveId: string;
  subscriptionId: string;
  email: string | null;
  status: SUBSCRIPTION_STATUS;
  communityName: string;
  specificFields: string;
  attachments: string[];
  error?: ISubscriptionBusError;
}

/** EVENT EMITTER */
export interface IMessage {
  type: EVENT_MESSAGE;
  data?: any;
}

export interface ClientOfConsent {
  clientId?: string;
  name?: string;
}

export interface Consent {
  clientId?: string;
}
export interface IPublishPayload {
  subscription: ISubscriptionPublishPayload;
  enterprise: string;
}

export interface ISubscriptionBusError {
  message?: string;
  property?: string;
  code?: string;
}

import { http } from '@utils/http';
import {
  Subscription,
  STATUS,
  MultiplePayment,
  NoPayment,
  SinglePayment,
  SubscriptionRejection,
} from '@utils/demandes';
import { stringifyParams } from '@utils/helpers';

export type Metadata = {
  incentiveId: string;
  attachmentMetadata: { fileName: string }[];
  citizenId: string;
};

export const subscriptionList = async (
  status: STATUS,
  incentiveIds?: string[],
  communitiesId?: string[],
  lastName?: string,
  citizenId?: string,
  skip?: number
): Promise<Subscription[]> => {
  let params = `status=${status}`;
  params += incentiveIds?.length
    ? `&incentiveId=${incentiveIds.join(',')}`
    : '';
  params += lastName ? `&lastName=${lastName}` : '';
  params += communitiesId?.length
    ? `&idCommunities=${communitiesId.join(',')}`
    : '';
  params += citizenId ? `&citizenId=${citizenId}` : '';
  params += skip ? `&skip=${skip}` : '';

  const { data } = await http.get<Subscription[]>(`v1/subscriptions?${params}`);
  return data;
};
interface GetSubscriptionFilters {
  citizenId: string;
  status: STATUS[];
  year?: string[];
  funderType?: string;
}
export const getCitizenSubscriptions = async (
  filter: GetSubscriptionFilters
): Promise<Subscription[]> => {
  const getSubscriptionsUrl = `v1/subscriptions${stringifyParams(filter)}`;
  const { data } = await http.get<{
    subscriptions: Subscription[];
    count: number;
  }>(getSubscriptionsUrl);
  return data.subscriptions;
};

export const getDemandeById = async (subscriptionId: string): Promise<{}> => {
  const { data } = await http.get<Subscription>(
    `v1/subscriptions/${subscriptionId}`
  );
  return data;
};

export const getDemandeFileByName = async (
  subscriptionId: string,
  filename: string
): Promise<any> => {
  const data = await http.get(
    `v1/subscriptions/${subscriptionId}/attachments/${filename}`
  );
  return data;
};

export const putSubscriptionValidate = async (
  subscriptionId: string,
  demandeValidateData: SinglePayment | MultiplePayment | NoPayment
): Promise<any> => {
  const data = await http.put(
    `v1/subscriptions/${subscriptionId}/validate`,
    JSON.stringify(demandeValidateData)
  );
  return data;
};

export const putSubscriptionReject = async (
  subscriptionId: string,
  demandeRejectData: SubscriptionRejection
): Promise<any> => {
  const data = await http.put(
    `v1/subscriptions/${subscriptionId}/reject`,
    JSON.stringify(demandeRejectData)
  );
  return data;
};

export const demandesValideesXlsx = async (): Promise<any> => {
  const data = await http.get(`v1/subscriptions/export`, {
    responseType: 'blob',
  });

  return data;
};

export const getMetadata = async (id: string): Promise<Metadata> => {
  const { data } = await http.get(`v1/subscriptions/metadata/${id}`);
  return data;
};

export const postV1Subscription = async (subscriptionData: {
  incentiveId: string;
  consent: boolean;
}): Promise<{ subscriptionId: string }> => {
  const { data } = await http.post(
    `v1/maas/subscriptions`,
    JSON.stringify(subscriptionData)
  );
  return data;
};

export const postV1SubscriptionAttachments = async (
  subscriptionId: string,
  attachmentData: FormData
): Promise<{ subscriptionId: string }> => {
  const { data } = await http.post(
    `v1/maas/subscriptions/${subscriptionId}/attachments`,
    attachmentData,
    { config: { headers: { 'Content-Type': 'multipart/form-data' } } }
  );
  return data;
};

export const postV1SubscriptionVerify = async (
  subscriptionId: string
): Promise<{ subscriptionId: string }> => {
  const { data } = await http.post(
    `v1/maas/subscriptions/${subscriptionId}/verify`
  );
  return data;
};

import { https } from '@utils/https';
import { stringifyParams } from '@utils/helpers';

export type AideCreation = {
  title: string;
  description: string;
  territoryName: string; // TODO: REMOVING DEPRECATED territoryName.
  funderName: string;
  incentiveType: string;
  conditions: string;
  paymentMethod: string;
  allocatedAmount: string;
  minAmount: string;
  transportList: string[];
  attachments: string[];
  additionalInfos?: string;
  contact?: string;
  validityDate?: string;
  isMCMStaff: boolean;
};

export const getAide = async (incentiveId: string): Promise<{}> => {
  const { data } = await https.get<any>(`v1/incentives/${incentiveId}`);
  return data;
};

export const searchAide = async (
  searchTerm?: string,
  incentiveType?: string | string[],
  enterpriseId?: string
): Promise<{}> => {
  const params: {
    [key: string]: string[] | string | undefined | number;
  } = {
    _q: searchTerm,
    incentiveType,
    enterpriseId,
  };
  const newUrl = `v1/incentives/search${stringifyParams(params)}`;
  const { data } = await https.get<AideCreation[]>(newUrl);
  return data;
};

/**
 * get the aid list relative to the connected enterprise or collectivity
 * @returns
 */
export const listAide = async (): Promise<{ id: string; title: string }[]> => {
  const newUrl = `v1/incentives`;
  const { data } = await https.get<{ id: string; title: string }[]>(newUrl);
  return data;
};

import { http } from '@utils/http';
import { stringifyParams } from '@utils/helpers';

export type AideCreation = {
  title: string;
  description: string;
  territoryName: string;
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

export const getAide = async (incentiveId: string): Promise<any> => {
  const { data } = await http.get<any>(`v1/incentives/${incentiveId}`);
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
  const { data } = await http.get<AideCreation[]>(newUrl);
  return data;
};

/**
 * get the aid list relative to the connected enterprise or collectivity
 * @returns
 */
export const listAide = async (): Promise<{ id: string; title: string }[]> => {
  const newUrl = `v1/incentives`;
  const { data } = await http.get<{ id: string; title: string }[]>(newUrl);
  return data;
};

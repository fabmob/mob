import { https } from '@utils/https';
import { stringifyParams } from '@utils/api';
import { Incentive } from '@utils/aides';
import { IFilter, Count } from '@utils/api';

export const getAide = async (incentiveId: string): Promise<{}> => {
  const { data } = await https.get<any>(`v1/incentives/${incentiveId}`);
  return data;
};

export const countIncentives = async (
  where?: Record<string, unknown>
): Promise<Count> => {
  const params = { where: JSON.stringify(where) };
  const newUrl = `v1/incentives/count${stringifyParams(params)}`;
  const { data } = await https.get<Count>(newUrl);
  return data;
};

export const searchAide = async (
  searchTerm?: string,
  filter?: Record<string, unknown>
): Promise<{}> => {
  const params: {
    [key: string]: string[] | string | undefined | number | IFilter<Incentive>;
  } = {
    _q: searchTerm,
    filter: JSON.stringify(filter),
  };
  const newUrl = `v1/incentives/search${stringifyParams(params)}`;
  const { data } = await https.get<Partial<Incentive>[]>(newUrl);
  return data;
};

/**
 * get the aid list relative to the connected enterprise or collectivity
 * @returns
 */
export const listAide = async (
  filter?: IFilter<Incentive>
): Promise<{ id: string; title: string }[]> => {
  const params = { filter: JSON.stringify(filter) };
  const newUrl = `v1/incentives${stringifyParams(params)}`;
  const { data } = await https.get<{ id: string; title: string }[]>(newUrl);
  return data;
};

import { https } from '@utils/https';
import { Community, Funder, FUNDER_TYPE } from '@utils/funders';

export const getFunders = async (
  funderTypeList?: FUNDER_TYPE[]
): Promise<Funder[]> => {
  let data: Funder[];
  if (funderTypeList) {
    const filter = { where: { type: { inq: funderTypeList } }, fields: { id: true, name: true }, order: 'name ASC' };
    data = (await https.get<Funder[]>(`/v1/funders?filter=${JSON.stringify(filter)}`)).data;
  } else {
    const filter = {order: 'name ASC'};
    data = (await https.get<Funder[]>(`/v1/funders?filter=${JSON.stringify(filter)}`)).data;
  }

  return data;
};

export const getFunderById = async (
  id: string
): Promise<Funder> => {
  const filter = { fields: { id: true, name: true, enterpriseDetails: true } };
  const data: Funder = (await https.get<Funder[]>(`/v1/funders/${id}?filter=${JSON.stringify(filter)}`)).data;
  return data;
};

export const getFunderCommunities = async (
  funderId: string
): Promise<Community[]> => {
  const { data } = await https.get<Community[]>(
    `/v1/funders/${funderId}/communities`
  );
  return data;
};

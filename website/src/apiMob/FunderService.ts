import { https } from '@utils/https';
import { Community } from '@utils/funders';

export const getFunderCommunities = async (
  funderId: string
): Promise<Community[]> => {
  const { data } = await https.get<Community[]>(
    `/v1/funders/${funderId}/communities`
  );
  return data;
};

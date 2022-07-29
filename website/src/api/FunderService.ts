import { http } from '@utils/http';
import { Community } from '@utils/funders';

export const getFunderCommunities = async (
  funderId: string
): Promise<Community[]> => {
  const { data } = await http.get<Community[]>(
    `/v1/funders/${funderId}/communities`
  );
  return data;
};

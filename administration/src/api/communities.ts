import axios from 'axios';
import { URL_API } from '../utils/constant';
import { getAuthHeader } from '../utils/httpHeaders';

export const getFunderCommunityList = async (
  funderId: string
): Promise<{ id: string; name: string; funderId: string }[]> => {
  const { data } = await axios.get(
    `${await URL_API()}/funders/${funderId}/communities`,
    {
      headers: getAuthHeader(),
    }
  );
  return data;
};

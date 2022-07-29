import axios from 'axios';
import { URL_API } from '../utils/constant';
import { getAuthHeader } from '../utils/httpHeaders';

export const getFunders = async (): Promise<{
  name: string;
  id: string;
  funderType: string;
  emailFormat?: string[];
}> => {
  const { data } = await axios.get(`${await URL_API()}/funders`, {
    headers: getAuthHeader(),
  });
  return data;
};

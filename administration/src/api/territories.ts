import axios from 'axios';
import { URL_API } from '../utils/constant';
import { getAuthHeader } from '../utils/httpHeaders';

export const getTerritories = async (): Promise<{
  name: string;
  id: string;
}> => {
  const { data } = await axios.get(`${await URL_API()}/territories`, {
    headers: getAuthHeader(),
  });
  return data;
};

import axios from 'axios';
import { URL_API } from '../utils/constant';
import { getAuthHeader } from '../utils/httpHeaders';

export const getClients = async (): Promise<{
  clientId: string;
  id: string;
}> => {
  const { data } = await axios.get(`${await URL_API()}/clients`, {
    headers: getAuthHeader(),
  });
  return data;
};

import axios from 'axios';
import { URL_API } from '../utils/constant';
import { getAuthHeader } from '../utils/httpHeaders';

export const getRoles = async (): Promise<string[]> => {
  const { data } = await axios.get(`${await URL_API()}/users/roles`, {
    headers: getAuthHeader(),
  });
  return data;
};

import axios from 'axios';
import { URL_API } from '../utils/constant';
import { getAuthHeader } from '../utils/httpHeaders';
import { Territory } from '../utils/helpers';

export const getTerritories = async (): Promise<Territory[]> => {
  const { data } = await axios.get(`${await URL_API()}/territories`, {
    headers: getAuthHeader(),
  });
  return data;
};

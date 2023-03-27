import axios from 'axios';
import { IFunders, URL_API } from '../utils/constant';
import { getAuthHeader } from '../utils/httpHeaders';

export const getFunders = async (): Promise<IFunders[]> => {
  const filter = { order: 'name ASC' };
  return (
    await axios.get(
      `${await URL_API()}/funders?filter=${JSON.stringify(filter)}`,
      {
        headers: getAuthHeader(),
      }
    )
  ).data;
};

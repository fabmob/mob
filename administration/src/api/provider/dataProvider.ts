/* eslint-disable */

import lb4Provider from 'react-admin-lb4';
import { GET_LIST } from 'react-admin';
import { URL_API } from '../../utils/constant';

import { getAuthHeader } from '../../utils/httpHeaders';

/**
 * @param {string} type Request type, e.g GET_LIST, GET_ONE, DELETE, POST..
 * @param {string} resource Resource name, e.g. "communautes"
 * @param {Object} params Request parameters. Depends on the request type
 */

export default async (type: string, resource: string, params: any) => {
  const data = await URL_API();
  const dataProvider = lb4Provider(data, getAuthHeader);
  const url: string = resourceConverter(type, resource);
  return dataProvider(type, url, params);
};

const resourceConverter = (type: string, resource: string): string => {
  switch (resource) {
    case 'collectivites':
      return 'collectivities';
    case 'entreprises':
      return 'enterprises';
    case 'aides':
      return 'incentives';
    case 'communautes':
      return 'funders/communities';
    case 'utilisateurs':
      if (type === GET_LIST) {
        return 'users/funders';
      }
      return 'users';
    case 'territoires':
      return 'territories';
    default:
      return resource;
  }
};

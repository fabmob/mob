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
  const convertedParams: any = paramConverter(type, params, resource);
  return dataProvider(type, url, convertedParams);
};

const resourceConverter = (type: string, resource: string): string => {
  switch (resource) {
    case 'financeurs':
      return 'funders';
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

const paramConverter = (type: string, params: any, resource: string): any => {

  switch (type) {
    case 'GET_MANY':
      const flattenArray = [].concat(...params.ids);
      return { ids: Array.from(new Set(flattenArray)) };
    case 'GET_LIST':
      if (
        resource === 'territoires' &&
        params?.filter?.name &&
        !params.filter.name.like
      ) {
        return {
          ...params,
          filter: {
            name: { like: params.filter.name, options: 'i' },
          },
        };
      }
      if (
        resource === 'aides' &&
        params?.filter?.title &&
        !params.filter?.title.like
      ) {
        return {
          ...params,
          filter: {
            title: { like: params.filter.title, options: 'i' },
          },
        };
      }
      if (
        resource === 'financeurs' &&
        params?.filter?.name &&
        !params.filter?.name.like
      ) {
        return {
          ...params,
          filter: {
            name: { like: params.filter.name, options: 'i' },
          },
        };
      }
      if (
        resource === 'utilisateurs' &&
        params?.filter?.lastName &&
        !params.filter?.lastName.like
      ) {
        return {
          ...params,
          filter: {
            lastName: { like: params.filter.lastName, options: 'i' },
          },
        };
      }

      return params;
    default:
      return params;
  }
};

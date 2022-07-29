import { http } from '@utils/http';
import { Community } from '@utils/funders';
import { Roles } from '../constants';
import { getFunderCommunities } from './FunderService';

export interface UserFunder {
  email: string;
  firstName: string;
  lastName: string;
  id: string;
  funderId: string;
  communityIds: string[];
  roles: Roles[];
}

export const getUserProfileById = async (
  idUserFunder: string
): Promise<UserFunder> => {
  const { data } = await http.get<{ data: UserFunder }>(
    `v1/users/${idUserFunder}`
  );
  return data;
};

export const getUserFunderCommunities = async (
  userFunder: UserFunder
): Promise<Community> => {
  const { communityIds, funderId } = userFunder;
  const funderCommunities = await getFunderCommunities(funderId);
  const userFunderCommunities = funderCommunities.filter(
    (community: Community) => communityIds.includes(community.id)
  );
  return userFunderCommunities;
};

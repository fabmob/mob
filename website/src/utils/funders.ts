import { UserFunder } from '@api/UserFunderService';
import { Roles } from '../constants';

export interface Community {
  id: string;
  name: string;
  funderId: string;
}

export const isSupervisor = (userFunder: UserFunder): boolean => {
  return userFunder.roles.includes(Roles.SUPERVISORS);
};

export const isManager = (userFunder: UserFunder): boolean => {
  return userFunder.roles.includes(Roles.MANAGERS);
};

export const isSuperManager = (userFunder: UserFunder): boolean => {
  return isSupervisor(userFunder) && isManager(userFunder);
};

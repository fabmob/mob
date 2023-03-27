import {LIMIT_MAX} from '../constants';
import {Fields} from '@loopback/repository';

const canAccessHisSubscriptionData = (tokenUserId: string, subscriptionUserId: string): boolean => {
  return tokenUserId === subscriptionUserId;
};

const canUseLimit = (limit: number): boolean => {
  return limit < LIMIT_MAX;
};

const canAccessHisFunderData = (currentUserFunderId: string, funderId: string): boolean => {
  return currentUserFunderId === funderId;
};

const canRequestFields = (currentFields: Fields, unAuthorizedFields: Fields): boolean => {
  const currentKeys: string[] = Object.keys(currentFields);
  const unAuthorizedKeys: string[] = Object.keys(unAuthorizedFields);

  return currentKeys.filter((key: string) => unAuthorizedKeys.includes(key)).length === 0;
};

export {canAccessHisSubscriptionData, canUseLimit, canAccessHisFunderData, canRequestFields};

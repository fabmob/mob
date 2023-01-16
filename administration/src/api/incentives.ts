import axios from 'axios';
import { URL_API } from '../utils/constant';
import { getAuthHeader } from '../utils/httpHeaders';
import { Incentive, IncentiveEligibilityChecks } from '../utils/helpers';

export const getIncentives = async (): Promise<Incentive[]> => {
  const { data } = await axios.get(`${await URL_API()}/incentives`, {
    headers: getAuthHeader(),
  });
  return data;
};

export const getIncentiveEligibilityChecks = async (): Promise<
  IncentiveEligibilityChecks[]
> => {
  const { data } = await axios.get(
    `${await URL_API()}/incentive_eligibility_checks`,
    {
      headers: getAuthHeader(),
    }
  );
  return data;
};

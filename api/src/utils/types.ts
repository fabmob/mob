import {Filter} from '@loopback/repository';
import {Citizen, Incentive} from '../models';
import {AFFILIATION_STATUS} from './enum';

export type FilterSearchIncentive = Omit<Filter<Incentive>, 'include' | 'offset' | 'skip'>;

export type FilterCitizen = Pick<Filter<Citizen>, 'fields'>;

export type EmployeesQueryParams = {
  funderId: string;
  status?: AFFILIATION_STATUS;
  lastName?: string;
  skip?: number;
  limit?: number;
};

export type CitizensQueryParams = {
  funderId: string;
  lastName?: string;
  skip?: number;
  limit?: number;
};

export type Tab = {
  title: string;
  header: string[];
  rows: string[][];
};

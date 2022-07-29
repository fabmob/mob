import {inject} from '@loopback/core';
import {DefaultCrudRepository, AnyObject} from '@loopback/repository';
import {omit} from 'lodash';

export type EmployeesFind = {
  funderId?: string;
  user?: string;
  lastName?: string;
  firstName?: string;
  status?: string;
  skip?: number;
  limit?: number;
};

import {MongoDsDataSource} from '../datasources';
import {Citizen, CitizenRelations} from '../models';

export class CitizenRepository extends DefaultCrudRepository<
  Citizen,
  typeof Citizen.prototype.id,
  CitizenRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    Citizen.definition.properties = omit(Citizen.definition.properties, ['password']);

    super(Citizen, dataSource);
  }
  /**
   * instrumenting the search in here (personal preferance)
   * @param [searchKey] Search in lastName
   * @param [skip] skip filter omits the specified number of returned records
   * @data [funderId] funderId to match and get the exact firstName & lastName related to the company
   * @param [limit] A limit filter limits the maximum number of records a query returns
   *
   */

  async findByParams({
    status,
    lastName,
    funderId,
    skip,
    limit,
  }: EmployeesFind): Promise<Citizen[] | undefined> {
    const withParams: AnyObject[] = [
      {lastName: lastName ? {regex: new RegExp('.*' + lastName + '.*', 'i')} : undefined},
      {
        'affiliation.enterpriseId': funderId,
        'affiliation.affiliationStatus': status,
      },
    ];
    return this.find({
      where: {and: withParams},
      fields: {firstName: true, lastName: true, affiliation: true, id: true},
      skip: skip,
      limit: limit,
      order: ['lastName ASC'],
    });
  }
}

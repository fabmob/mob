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
}

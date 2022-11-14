import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {omit} from 'lodash';

import {MongoDsDataSource} from '../datasources';
import {User, UserRelations} from '../models';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    User.definition.properties = omit(User.definition.properties, ['password', 'roles']);
    super(User, dataSource);
  }
}

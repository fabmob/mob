import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {IdpDbDataSource} from '../../datasources';
import {UserAttribute, UserAttributeRelations} from '../../models';

export class UserAttributeRepository extends DefaultCrudRepository<
  UserAttribute,
  typeof UserAttribute.prototype.id,
  UserAttributeRelations
> {
  constructor(@inject('datasources.idpdbDS') dataSource: IdpDbDataSource) {
    super(UserAttribute, dataSource);
  }
}

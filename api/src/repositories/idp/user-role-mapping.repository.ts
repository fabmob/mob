import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {IdpDbDataSource} from '../../datasources';
import {UserRoleMapping, UserRoleMappingRelations} from '../../models';

export class UserRoleMappingRepository extends DefaultCrudRepository<
  UserRoleMapping,
  typeof UserRoleMapping.prototype.roleId,
  UserRoleMappingRelations
> {
  constructor(@inject('datasources.idpdbDS') dataSource: IdpDbDataSource) {
    super(UserRoleMapping, dataSource);
  }
}

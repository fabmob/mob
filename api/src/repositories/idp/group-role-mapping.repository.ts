import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {IdpDbDataSource} from '../../datasources';
import {GroupRoleMapping, GroupRoleMappingRelations} from '../../models';

export class GroupRoleMappingRepository extends DefaultCrudRepository<
  GroupRoleMapping,
  typeof GroupRoleMapping.prototype.roleId,
  GroupRoleMappingRelations
> {
  constructor(@inject('datasources.idpdbDS') dataSource: IdpDbDataSource) {
    super(GroupRoleMapping, dataSource);
  }
}

import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {IdpDbDataSource} from '../../datasources';
import {UserGroupMembership, UserGroupMembershipRelations} from '../../models';

export class UserGroupMembershipRepository extends DefaultCrudRepository<
  UserGroupMembership,
  typeof UserGroupMembership.prototype.groupId,
  UserGroupMembershipRelations
> {
  constructor(@inject('datasources.idpdbDS') dataSource: IdpDbDataSource) {
    super(UserGroupMembership, dataSource);
  }
}

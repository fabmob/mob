import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {IdpDbDataSource} from '../../datasources';
import {GroupAttribute, GroupAttributeRelations} from '../../models';

export class GroupAttributeRepository extends DefaultCrudRepository<
  GroupAttribute,
  typeof GroupAttribute.prototype.id,
  GroupAttributeRelations
> {
  constructor(@inject('datasources.idpdbDS') dataSource: IdpDbDataSource) {
    super(GroupAttribute, dataSource);
  }
}

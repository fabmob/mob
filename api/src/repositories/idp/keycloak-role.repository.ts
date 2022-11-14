import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {IdpDbDataSource} from '../../datasources';
import {KeycloakRole, KeycloakRoleRelations} from '../../models';

export class KeycloakRoleRepository extends DefaultCrudRepository<
  KeycloakRole,
  typeof KeycloakRole.prototype.id,
  KeycloakRoleRelations
> {
  constructor(@inject('datasources.idpdbDS') dataSource: IdpDbDataSource) {
    super(KeycloakRole, dataSource);
  }
}

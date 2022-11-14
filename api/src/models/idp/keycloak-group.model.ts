import {Entity, model, property, hasMany} from '@loopback/repository';

import {KeycloakRole} from './keycloak-role.model';
import {GroupRoleMapping} from './group-role-mapping.model';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'idp_db', table: 'keycloak_group'},
  },
})
export class KeycloakGroup extends Entity {
  @property({
    type: 'string',
    required: true,
    length: 36,
    id: 1,
    postgresql: {
      columnName: 'id',
      dataType: 'varchar',
      dataLength: 36,
      dataPrecision: null,
      dataScale: null,
      nullable: 'N',
    },
  })
  id: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'name',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  name?: string;

  @property({
    type: 'string',
    required: false,
    length: 36,
    postgresql: {
      columnName: 'parent_group',
      dataType: 'varchar',
      dataLength: 36,
      dataPrecision: null,
      dataScale: null,
      nullable: 'N',
    },
  })
  parentGroup?: string;

  @property({
    type: 'string',
    length: 36,
    postgresql: {
      columnName: 'realm_id',
      dataType: 'varchar',
      dataLength: 36,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  realmId?: string;

  @hasMany(() => KeycloakRole, {
    through: {model: () => GroupRoleMapping, keyFrom: 'groupId', keyTo: 'roleId'},
  })
  keycloakRoles: KeycloakRole[];

  constructor(data?: Partial<KeycloakGroup>) {
    super(data);
  }
}

export interface KeycloakGroupRelations {
  // describe navigational properties here
}

export type KeycloakGroupWithRelations = KeycloakGroup & KeycloakGroupRelations;

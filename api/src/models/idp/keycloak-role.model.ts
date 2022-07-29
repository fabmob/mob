import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'idp_db', table: 'keycloak_role'},
  },
})
export class KeycloakRole extends Entity {
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
      columnName: 'client_realm_constraint',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  clientRealmConstraint?: string;

  @property({
    type: 'number',
    precision: 1,
    postgresql: {
      columnName: 'client_role',
      dataType: 'bit',
      dataLength: null,
      dataPrecision: 1,
      dataScale: null,
      nullable: 'Y',
    },
  })
  clientRole?: number;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'description',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  description?: string;

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
  name: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'realm_id',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  realmId?: string;

  @property({
    type: 'string',
    length: 36,
    postgresql: {
      columnName: 'client',
      dataType: 'varchar',
      dataLength: 36,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  client?: string;

  @property({
    type: 'string',
    length: 36,
    postgresql: {
      columnName: 'realm',
      dataType: 'varchar',
      dataLength: 36,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  realm?: string;

  constructor(data?: Partial<KeycloakRole>) {
    super(data);
  }
}

export interface KeycloakRoleRelations {
  // describe navigational properties here
}

export type KeycloakRoleWithRelations = KeycloakRole & KeycloakRoleRelations;

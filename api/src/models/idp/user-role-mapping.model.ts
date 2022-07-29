import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'idp_db', table: 'user_role_mapping'},
  },
})
export class UserRoleMapping extends Entity {
  @property({
    type: 'string',
    required: true,
    length: 255,
    id: 1,
    postgresql: {
      columnName: 'role_id',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'N',
    },
  })
  roleId: string;

  @property({
    type: 'string',
    required: true,
    length: 36,
    id: 2,
    postgresql: {
      columnName: 'user_id',
      dataType: 'varchar',
      dataLength: 36,
      dataPrecision: null,
      dataScale: null,
      nullable: 'N',
    },
  })
  userId: string;

  constructor(data?: Partial<UserRoleMapping>) {
    super(data);
  }
}

export interface UserRoleMappingRelations {
  // describe navigational properties here
}

export type UserRoleMappingWithRelations = UserRoleMapping & UserRoleMappingRelations;

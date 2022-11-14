import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'idp_db', table: 'group_role_mapping'},
  },
})
export class GroupRoleMapping extends Entity {
  @property({
    type: 'string',
    required: true,
    length: 36,
    id: 1,
    postgresql: {
      columnName: 'role_id',
      dataType: 'varchar',
      dataLength: 36,
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
      columnName: 'group_id',
      dataType: 'varchar',
      dataLength: 36,
      dataPrecision: null,
      dataScale: null,
      nullable: 'N',
    },
  })
  groupId: string;

  constructor(data?: Partial<GroupRoleMapping>) {
    super(data);
  }
}

export interface GroupRoleMappingRelations {
  // describe navigational properties here
}

export type GroupRoleMappingWithRelations = GroupRoleMapping & GroupRoleMappingRelations;

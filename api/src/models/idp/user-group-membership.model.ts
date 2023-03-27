import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'idp_db', table: 'user_group_membership'},
  },
})
export class UserGroupMembership extends Entity {
  @property({
    type: 'string',
    required: true,
    length: 36,
    id: 1,
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

  constructor(data?: Partial<UserGroupMembership>) {
    super(data);
  }
}

export interface UserGroupMembershipRelations {
  // describe navigational properties here
}

export type UserGroupMembershipWithRelations = UserGroupMembership & UserGroupMembershipRelations;

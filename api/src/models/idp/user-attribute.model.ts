import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {idInjection: false, postgresql: {schema: 'idp_db', table: 'user_attribute'}},
})
export class UserAttribute extends Entity {
  @property({
    type: 'string',
    required: true,
    length: 255,
    postgresql: {
      columnName: 'name',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  name: string;

  @property({
    type: 'string',
    postgresql: {
      columnName: 'value',
      dataType: 'text',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  value?: string;

  @property({
    type: 'string',
    required: true,
    length: 36,
    postgresql: {
      columnName: 'user_id',
      dataType: 'character varying',
      dataLength: 36,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  userId: string;

  @property({
    type: 'string',
    required: true,
    length: 36,
    id: 1,
    postgresql: {
      columnName: 'id',
      dataType: 'character varying',
      dataLength: 36,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  id: string;

  constructor(data?: Partial<UserAttribute>) {
    super(data);
  }
}

export interface UserAttributeRelations {
  // describe navigational properties here
}

export type UserAttributeWithRelations = UserAttribute & UserAttributeRelations;

import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'idp_db', table: 'group_attribute'},
  },
})
export class GroupAttribute extends Entity {
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
      nullable: 'N',
    },
  })
  name?: string;

  @property({
    type: 'text',
    postgresql: {
      columnName: 'value',
      dataType: 'varchar',
      dataPrecision: null,
      dataScale: null,
      nullable: 'N',
    },
  })
  value?: string;

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

  constructor(data?: Partial<GroupAttribute>) {
    super(data);
  }
}

export interface GroupAttributeRelations {
  // describe navigational properties here
}

export type GroupAttributeWithRelations = GroupAttribute & GroupAttributeRelations;

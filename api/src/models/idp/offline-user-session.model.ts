import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'idp_db', table: 'offline_user_session'},
  },
})
export class OfflineUserSession extends Entity {
  @property({
    type: 'string',
    required: true,
    length: 36,
    id: 1,
    postgresql: {
      columnName: 'user_session_id',
      dataType: 'varchar',
      dataLength: 36,
      dataPrecision: null,
      dataScale: null,
      nullable: 'N',
    },
  })
  userSessionId: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'user_id',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  userId?: string;

  @property({
    type: 'string',
    required: true,
    length: 36,
    postgresql: {
      columnName: 'realm_id',
      dataType: 'varchar',
      dataLength: 36,
      dataPrecision: null,
      dataScale: null,
      nullable: 'N',
    },
  })
  realmId: string;

  @property({
    type: 'number',
    required: true,
    precision: 10,
    scale: 0,
    postgresql: {
      columnName: 'created_on',
      dataType: 'int',
      dataLength: null,
      dataPrecision: 10,
      dataScale: 0,
      nullable: 'N',
    },
  })
  createdOn: number;

  @property({
    type: 'string',
    required: true,
    length: 4,
    id: 2,
    postgresql: {
      columnName: 'offline_flag',
      dataType: 'varchar',
      dataLength: 4,
      dataPrecision: null,
      dataScale: null,
      nullable: 'N',
    },
  })
  offlineFlag: string;

  @property({
    type: 'string',
    length: 4294967295,
    postgresql: {
      columnName: 'data',
      dataType: 'longtext',
      dataLength: 4294967295,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  data?: string;

  @property({
    type: 'number',
    required: true,
    precision: 10,
    scale: 0,
    postgresql: {
      columnName: 'last_session_refresh',
      dataType: 'int',
      dataLength: null,
      dataPrecision: 10,
      dataScale: 0,
      nullable: 'N',
    },
  })
  lastSessionRefresh: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // [prop: string]: any;

  constructor(data?: Partial<OfflineUserSession>) {
    super(data);
  }
}

export interface OfflineUserSessionRelations {
  // describe navigational properties here
}

export type OfflineUserSessionWithRelations = OfflineUserSession &
  OfflineUserSessionRelations;

import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'idp_db', table: 'offline_client_session'},
  },
})
export class OfflineClientSession extends Entity {
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
    required: true,
    length: 255,
    id: 2,
    postgresql: {
      columnName: 'client_id',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'N',
    },
  })
  clientId: string;

  @property({
    type: 'string',
    required: true,
    length: 4,
    id: 5,
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
    type: 'number',
    precision: 10,
    scale: 0,
    postgresql: {
      columnName: 'timestamp',
      dataType: 'int',
      dataLength: null,
      dataPrecision: 10,
      dataScale: 0,
      nullable: 'Y',
    },
  })
  timestamp?: number;

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
    type: 'string',
    required: true,
    length: 36,
    id: 3,
    postgresql: {
      columnName: 'client_storage_provider',
      dataType: 'varchar',
      dataLength: 36,
      dataPrecision: null,
      dataScale: null,
      nullable: 'N',
    },
  })
  clientStorageProvider: string;

  @property({
    type: 'string',
    required: true,
    length: 255,
    id: 4,
    postgresql: {
      columnName: 'external_client_id',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'N',
    },
  })
  externalClientId: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // [prop: string]: any;

  constructor(data?: Partial<OfflineClientSession>) {
    super(data);
  }
}

export interface OfflineClientSessionRelations {
  // describe navigational properties here
}

export type OfflineClientSessionWithRelations = OfflineClientSession & OfflineClientSessionRelations;

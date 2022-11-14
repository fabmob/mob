import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'idp_db', table: 'client_scope_client'},
  },
})
export class ClientScopeClient extends Entity {
  @property({
    type: 'string',
    required: true,
    length: 255,
    id: 1,
    postgresql: {
      columnName: 'client_id',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  clientId: string;

  @property({
    type: 'string',
    required: true,
    length: 255,
    id: 2,
    postgresql: {
      columnName: 'scope_id',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  clientScopeId: string;

  @property({
    type: 'boolean',
    required: true,
    postgresql: {
      columnName: 'default_scope',
      dataType: 'boolean',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  defaultScope: boolean;

  constructor(data?: Partial<ClientScopeClient>) {
    super(data);
  }
}

export interface ClientScopeClientRelations {
  // describe navigational properties here
}

export type ClientScopeClientWithRelations = ClientScopeClient &
  ClientScopeClientRelations;

import {Entity, model, property, hasMany} from '@loopback/repository';
import {Client} from './client.model';
import {ClientScopeClient} from './client-scope-client.model';

@model({
  settings: {idInjection: false, postgresql: {schema: 'idp_db', table: 'client_scope'}},
})
export class ClientScope extends Entity {
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

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'name',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  name?: string;

  @property({
    type: 'string',
    length: 36,
    postgresql: {
      columnName: 'realm_id',
      dataType: 'character varying',
      dataLength: 36,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  realmId?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'description',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  description?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'protocol',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  protocol?: string;

  @hasMany(() => Client, {through: {model: () => ClientScopeClient}})
  clients: Client[];

  constructor(data?: Partial<ClientScope>) {
    super(data);
  }
}

export interface ClientScopeRelations {
  // describe navigational properties here
}

export type ClientScopeWithRelations = ClientScope & ClientScopeRelations;

import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'idp_db', table: 'client'},
  },
})
export class Client extends Entity {
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
    type: 'Binary',
    required: true,
    precision: 1,
    postgresql: {
      columnName: 'enabled',
      dataType: 'bit',
      dataLength: null,
      dataPrecision: 1,
      dataScale: null,
      nullable: 'N',
    },
  })
  enabled: Boolean;

  @property({
    type: 'Binary',
    required: true,
    precision: 1,
    postgresql: {
      columnName: 'full_scope_allowed',
      dataType: 'bit',
      dataLength: null,
      dataPrecision: 1,
      dataScale: null,
      nullable: 'N',
    },
  })
  fullScopeAllowed: Boolean;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'client_id',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  clientId?: string;

  @property({
    type: 'number',
    precision: 10,
    scale: 0,
    postgresql: {
      columnName: 'not_before',
      dataType: 'int',
      dataLength: null,
      dataPrecision: 10,
      dataScale: 0,
      nullable: 'Y',
    },
  })
  notBefore?: number;

  @property({
    type: 'Binary',
    required: true,
    precision: 1,
    postgresql: {
      columnName: 'public_client',
      dataType: 'bit',
      dataLength: null,
      dataPrecision: 1,
      dataScale: null,
      nullable: 'N',
    },
  })
  publicClient: Boolean;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'secret',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  secret?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'base_url',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  baseUrl?: string;

  @property({
    type: 'Binary',
    required: true,
    precision: 1,
    postgresql: {
      columnName: 'bearer_only',
      dataType: 'bit',
      dataLength: null,
      dataPrecision: 1,
      dataScale: null,
      nullable: 'N',
    },
  })
  bearerOnly: Boolean;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'management_url',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  managementUrl?: string;

  @property({
    type: 'Binary',
    required: true,
    precision: 1,
    postgresql: {
      columnName: 'surrogate_auth_required',
      dataType: 'bit',
      dataLength: null,
      dataPrecision: 1,
      dataScale: null,
      nullable: 'N',
    },
  })
  surrogateAuthRequired: Boolean;

  @property({
    type: 'string',
    length: 36,
    postgresql: {
      columnName: 'realm_id',
      dataType: 'varchar',
      dataLength: 36,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  realmId?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'protocol',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  protocol?: string;

  @property({
    type: 'number',
    precision: 10,
    scale: 0,
    postgresql: {
      columnName: 'node_rereg_timeout',
      dataType: 'int',
      dataLength: null,
      dataPrecision: 10,
      dataScale: 0,
      nullable: 'Y',
    },
  })
  nodeReregTimeout?: number;

  @property({
    type: 'Binary',
    required: true,
    precision: 1,
    postgresql: {
      columnName: 'frontchannel_logout',
      dataType: 'bit',
      dataLength: null,
      dataPrecision: 1,
      dataScale: null,
      nullable: 'N',
    },
  })
  frontchannelLogout: Boolean;

  @property({
    type: 'Binary',
    required: true,
    precision: 1,
    postgresql: {
      columnName: 'consent_required',
      dataType: 'bit',
      dataLength: null,
      dataPrecision: 1,
      dataScale: null,
      nullable: 'N',
    },
  })
  consentRequired: Boolean;

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
  name?: string;

  @property({
    type: 'Binary',
    required: true,
    precision: 1,
    postgresql: {
      columnName: 'service_accounts_enabled',
      dataType: 'bit',
      dataLength: null,
      dataPrecision: 1,
      dataScale: null,
      nullable: 'N',
    },
  })
  serviceAccountsEnabled: Boolean;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'client_authenticator_type',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  clientAuthenticatorType?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'root_url',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  rootUrl?: string;

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
      columnName: 'registration_token',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  registrationToken?: string;

  @property({
    type: 'Binary',
    required: true,
    precision: 1,
    postgresql: {
      columnName: 'standard_flow_enabled',
      dataType: 'bit',
      dataLength: null,
      dataPrecision: 1,
      dataScale: null,
      nullable: 'N',
    },
  })
  standardFlowEnabled: Boolean;

  @property({
    type: 'Binary',
    required: true,
    precision: 1,
    postgresql: {
      columnName: 'implicit_flow_enabled',
      dataType: 'bit',
      dataLength: null,
      dataPrecision: 1,
      dataScale: null,
      nullable: 'N',
    },
  })
  implicitFlowEnabled: Boolean;

  @property({
    type: 'Binary',
    required: true,
    precision: 1,
    postgresql: {
      columnName: 'direct_access_grants_enabled',
      dataType: 'bit',
      dataLength: null,
      dataPrecision: 1,
      dataScale: null,
      nullable: 'N',
    },
  })
  directAccessGrantsEnabled: Boolean;

  @property({
    type: 'Binary',
    required: true,
    precision: 1,
    postgresql: {
      columnName: 'always_display_in_console',
      dataType: 'bit',
      dataLength: null,
      dataPrecision: 1,
      dataScale: null,
      nullable: 'N',
    },
  })
  alwaysDisplayInConsole: Boolean;

  // Define well-known properties here

  // Indexer property to allow additional data
  // [prop: string]: any;

  constructor(data?: Partial<Client>) {
    super(data);
  }
}

export interface ClientRelations {
  // describe navigational properties here
}

export type ClientWithRelations = Client & ClientRelations;

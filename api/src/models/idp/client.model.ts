import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {idInjection: false, postgresql: {schema: 'idp_db', table: 'client'}},
})
export class Client extends Entity {
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
    type: 'boolean',
    required: true,
    postgresql: {
      columnName: 'enabled',
      dataType: 'boolean',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  enabled: boolean;

  @property({
    type: 'boolean',
    required: true,
    postgresql: {
      columnName: 'full_scope_allowed',
      dataType: 'boolean',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  fullScopeAllowed: boolean;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'client_id',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  clientId?: string;

  @property({
    type: 'number',
    scale: 0,
    postgresql: {
      columnName: 'not_before',
      dataType: 'integer',
      dataLength: null,
      dataPrecision: null,
      dataScale: 0,
      nullable: 'YES',
    },
  })
  notBefore?: number;

  @property({
    type: 'boolean',
    required: true,
    postgresql: {
      columnName: 'public_client',
      dataType: 'boolean',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  publicClient: boolean;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'secret',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  secret?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'base_url',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  baseUrl?: string;

  @property({
    type: 'boolean',
    required: true,
    postgresql: {
      columnName: 'bearer_only',
      dataType: 'boolean',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  bearerOnly: boolean;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'management_url',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  managementUrl?: string;

  @property({
    type: 'boolean',
    required: true,
    postgresql: {
      columnName: 'surrogate_auth_required',
      dataType: 'boolean',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  surrogateAuthRequired: boolean;

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
      columnName: 'protocol',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  protocol?: string;

  @property({
    type: 'number',
    scale: 0,
    postgresql: {
      columnName: 'node_rereg_timeout',
      dataType: 'integer',
      dataLength: null,
      dataPrecision: null,
      dataScale: 0,
      nullable: 'YES',
    },
  })
  nodeReregTimeout?: number;

  @property({
    type: 'boolean',
    required: true,
    postgresql: {
      columnName: 'frontchannel_logout',
      dataType: 'boolean',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  frontchannelLogout: boolean;

  @property({
    type: 'boolean',
    required: true,
    postgresql: {
      columnName: 'consent_required',
      dataType: 'boolean',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  consentRequired: boolean;

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
    type: 'boolean',
    required: true,
    postgresql: {
      columnName: 'service_accounts_enabled',
      dataType: 'boolean',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  serviceAccountsEnabled: boolean;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'client_authenticator_type',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  clientAuthenticatorType?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'root_url',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  rootUrl?: string;

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
      columnName: 'registration_token',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  registrationToken?: string;

  @property({
    type: 'boolean',
    required: true,
    postgresql: {
      columnName: 'standard_flow_enabled',
      dataType: 'boolean',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  standardFlowEnabled: boolean;

  @property({
    type: 'boolean',
    required: true,
    postgresql: {
      columnName: 'implicit_flow_enabled',
      dataType: 'boolean',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  implicitFlowEnabled: boolean;

  @property({
    type: 'boolean',
    required: true,
    postgresql: {
      columnName: 'direct_access_grants_enabled',
      dataType: 'boolean',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  directAccessGrantsEnabled: boolean;

  @property({
    type: 'boolean',
    required: true,
    postgresql: {
      columnName: 'always_display_in_console',
      dataType: 'boolean',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  alwaysDisplayInConsole: boolean;

  constructor(data?: Partial<Client>) {
    super(data);
  }
}

export interface ClientRelations {
  // describe navigational properties here
}

export type ClientWithRelations = Client & ClientRelations;

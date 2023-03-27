import {Entity, model, property, hasMany} from '@loopback/repository';
import {KeycloakGroup, UserGroupMembership, UserAttribute, Citizen} from '..';

@model({
  settings: {idInjection: false, postgresql: {schema: 'idp_db', table: 'user_entity'}},
})
export class UserEntity extends Entity {
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
      columnName: 'email',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  email?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'email_constraint',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  emailConstraint?: string;

  @property({
    type: 'boolean',
    required: true,
    postgresql: {
      columnName: 'email_verified',
      dataType: 'boolean',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',
    },
  })
  emailVerified: boolean;

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
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'federation_link',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  federationLink?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'first_name',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  firstName?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'last_name',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  lastName?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'realm_id',
      dataType: 'character varying',
      dataLength: 255,
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
      columnName: 'username',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  username?: string;

  @property({
    type: 'number',
    scale: 0,
    postgresql: {
      columnName: 'created_timestamp',
      dataType: 'bigint',
      dataLength: null,
      dataPrecision: null,
      dataScale: 0,
      nullable: 'YES',
    },
  })
  createdTimestamp?: number;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'service_account_client_link',
      dataType: 'character varying',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'YES',
    },
  })
  serviceAccountClientLink?: string;

  @property({
    type: 'number',
    required: true,
    scale: 0,
    postgresql: {
      columnName: 'not_before',
      dataType: 'integer',
      dataLength: null,
      dataPrecision: null,
      dataScale: 0,
      nullable: 'NO',
    },
  })
  notBefore: number;

  @hasMany(() => KeycloakGroup, {
    through: {model: () => UserGroupMembership, keyFrom: 'userId', keyTo: 'groupId'},
  })
  keycloakGroups: KeycloakGroup[];

  @hasMany(() => UserAttribute, {keyTo: 'userId'})
  userAttributes: UserAttribute[];

  constructor(data?: Partial<UserEntity>) {
    super(data);
  }

  /**
   * Convert user entity with userAttributes to Citizen
   */
  toCitizen(): Citizen {
    const rawCMSAttributes: {[key: string]: any} = {
      identity: {},
      personalInformation: {},
      dgfipInformation: {},
    };
    const rawCitizenAttributes: {[key: string]: any} = {id: this.id};

    this.userAttributes?.forEach(({name, value}) => {
      // Identify CMS fields with '.' , ex : 'identity.firstName'
      // Used to map with CMS types
      // ex : {name:'identity.firstName', value: 'Bob'} =>  {identity : {firstName: 'Bob'}}
      if (name.includes('.')) {
        // Identity CMS Attributes
        const [cmsName, attribute] = name.split('.');
        if (cmsName in rawCMSAttributes) {
          rawCMSAttributes[cmsName][attribute] = JSON.parse(value!);
        }
      } else {
        // Citizen Attributes to map with name: value, ex : {name:'status', value: 'etudiant'} => status: 'etudiant'
        Object.assign(rawCitizenAttributes, {[name]: value});
      }
    });

    // Delete empty objects
    const cmsAttributes: {[key: string]: any} = Object.fromEntries(
      Object.entries(rawCMSAttributes).filter(([_, attrs]) => Object.keys(attrs).length > 0),
    );

    // Assign CMS object to citizen
    Object.assign(rawCitizenAttributes, cmsAttributes);

    return new Citizen(rawCitizenAttributes);
  }
}

export interface UserEntityRelations {
  // describe navigational properties here
}

export type UserEntityWithRelations = UserEntity & UserEntityRelations;

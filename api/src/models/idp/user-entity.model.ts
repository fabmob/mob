import {Entity, model, property, hasMany} from '@loopback/repository';

import {KeycloakGroup, UserGroupMembership, UserAttribute, Citizen} from '..';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'idp_db', table: 'user_entity'},
  },
})
export class UserEntity extends Entity {
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
      columnName: 'email',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  email?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'email_constraint',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  emailConstraint?: string;

  @property({
    type: 'Binary',
    required: true,
    precision: 1,
    postgresql: {
      columnName: 'email_verified',
      dataType: 'bit',
      dataLength: null,
      dataPrecision: 1,
      dataScale: null,
      nullable: 'N',
    },
  })
  emailVerified: Boolean;

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
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'federation_link',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  federationLink?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'first_name',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  firstName?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'last_name',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  lastName?: string;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'realm_id',
      dataType: 'varchar',
      dataLength: 255,
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
      columnName: 'username',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  username?: string;

  @property({
    type: 'number',
    precision: 19,
    scale: 0,
    postgresql: {
      columnName: 'created_timestamp',
      dataType: 'bigint',
      dataLength: null,
      dataPrecision: 19,
      dataScale: 0,
      nullable: 'Y',
    },
  })
  createdTimestamp?: number;

  @property({
    type: 'string',
    length: 255,
    postgresql: {
      columnName: 'service_account_client_link',
      dataType: 'varchar',
      dataLength: 255,
      dataPrecision: null,
      dataScale: null,
      nullable: 'Y',
    },
  })
  serviceAccountClientLink?: string;

  @property({
    type: 'number',
    required: true,
    precision: 10,
    scale: 0,
    postgresql: {
      columnName: 'not_before',
      dataType: 'int',
      dataLength: null,
      dataPrecision: 10,
      dataScale: 0,
      nullable: 'N',
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

    this.userAttributes.forEach((userAttribute: UserAttribute) => {
      // Identify CMS fields with '.' , ex : 'identity.firstName'
      // Used to map with CMS types
      // ex : {name:'identity.firstName', value: 'Bob'} =>  {identity : {firstName: 'Bob'}}
      if (userAttribute.name.includes('.')) {
        // Identity CMS Attributes
        const splittedUserAttributeName = [...userAttribute.name.split('.')];
        if (userAttribute.name.includes('identity')) {
          Object.assign(rawCMSAttributes.identity, {
            [splittedUserAttributeName[1]]: JSON.parse(userAttribute.value!),
          });
        }
        // PersonalInfo CMS Attributes
        if (userAttribute.name.includes('personalInformation')) {
          Object.assign(rawCMSAttributes.personalInformation, {
            [splittedUserAttributeName[1]]: JSON.parse(userAttribute.value!),
          });
        }
        // DGFIP CMS Attributes
        if (userAttribute.name.includes('dgfipInformation')) {
          Object.assign(rawCMSAttributes.dgfipInformation, {
            [splittedUserAttributeName[1]]: JSON.parse(userAttribute.value!),
          });
        }
      } else {
        // Citizen Attributes to map with name: value, ex : {name:'status', value: 'etudiant'} => status: 'etudiant'
        Object.assign(rawCitizenAttributes, {[userAttribute.name]: userAttribute.value});
      }
    });

    // Assign CMS object to citizen
    Object.assign(rawCitizenAttributes, rawCMSAttributes);

    return new Citizen(rawCitizenAttributes);
  }
}

export interface UserEntityRelations {
  // describe navigational properties here
}

export type UserEntityWithRelations = UserEntity & UserEntityRelations;

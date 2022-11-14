import {Model, model, property} from '@loopback/repository';

@model({settings: {idInjection: false}})
export class PrivateKeyAccess extends Model {
  @property({
    type: 'string',
    description: `URL interne de connexion au Key Manager`,
    jsonSchema: {
      example: `https://keyvault/auth/cert/login`,
      minLength: 1,
    },
  })
  loginURL: string;

  @property({
    type: 'string',
    description: `URL interne d'accès à la clé privée`,
    jsonSchema: {
      example: `https://keyvault/keyname`,
      minLength: 1,
    },
  })
  getKeyURL: string;

  constructor(data?: Partial<PrivateKeyAccess>) {
    super(data);
  }
}

export interface PrivateKeyAccessRelations {
  // describe navigational properties here
}

export type PrivateKeyAccessWithRelations = PrivateKeyAccess & PrivateKeyAccessRelations;

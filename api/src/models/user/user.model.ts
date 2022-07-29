import {model, property} from '@loopback/repository';

import {Keycloak} from '..';

@model()
export class User extends Keycloak {
  @property({
    type: 'string',
    description: `Identifiant de l'utilisateur financeur`,
    id: true,
    generated: false,
    jsonSchema: {
      example: ``,
    },
  })
  id: string;

  @property({
    type: 'string',
    description: `Identifiant du financeur de l'utilisateur`,
    required: true,
    jsonSchema: {
      example: ``,
    },
  })
  funderId: string;

  @property({
    type: 'array',
    description: `Identifiants des communautés du périmètre\
       d'intervention de l'utilisateur financeur si gestionnaire`,
    itemType: 'string',
    jsonSchema: {
      example: ``,
    },
  })
  communityIds: string[];

  @property({
    type: 'array',
    description: `Rôles possibles pour un utilisateur financeur`,
    itemType: 'string',
    required: true,
    jsonSchema: {
      example: ``,
    },
  })
  roles: string[];

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;

import {model, property, belongsTo, referencesMany} from '@loopback/repository';

import {Funder} from '../funder';
import {Community} from '../community';

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

  @belongsTo(
    () => Funder,
    {name: 'funder'},
    {
      type: 'string',
      required: true,
      description: `Identifiant du financeur de l'utilisateur`,
      jsonSchema: {
        example: ``,
      },
    },
  )
  funderId: string;

  @referencesMany(
    () => Community,
    {name: 'community'},
    {
      type: 'array',
      itemType: 'string',
      description: `Identifiants des communautés du périmètre\
      d'intervention de l'utilisateur financeur si gestionnaire`,
      jsonSchema: {
        example: ``,
      },
    },
  )
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

  @property({
    type: 'boolean',
    description: `L'utilisateur reçoit les mails d'affiliation manuelle`,
    jsonSchema: {
      example: true,
    },
  })
  canReceiveAffiliationMail?: boolean;

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;

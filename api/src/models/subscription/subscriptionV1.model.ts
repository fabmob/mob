/* eslint-disable */

import {Model, model, property} from '@loopback/repository';

@model({
  settings: {strict: false},
})
export class CreateSubscription extends Model {
  @property({
    description: `Identifiant de l'aide souscrite`,
    required: true,
    jsonSchema: {
      example: ``,
    },
  })
  incentiveId: string;

  @property({
    description: `Consentement du citoyen au partage des données fournies dans la souscription`,
    required: true,
    jsonSchema: {
      example: true,
    },
  })
  consent: boolean;

  @property({
    description: `Identifiant de la communauté d'appartenance du citoyen`,
    jsonSchema: {
      example: ``,
    },
  })
  communityId?: string;

  // Indexer property to allow additional data
  [prop: string]: any;

  constructor(data?: Partial<CreateSubscription>) {
    super(data);
  }
}

export interface CreateSubscriptionRelations {
  // describe navigational properties here
}

export type CreateSubscriptionWithRelations = CreateSubscription &
  CreateSubscriptionRelations;

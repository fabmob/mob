import {Entity, model, property} from '@loopback/repository';
import {Subscription} from '../subscription/subscription.model';
import {Request} from './request.model';

@model()
export class SubscriptionTimestamp extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    description: `Identifiant de l'horodatage de souscription`,
    jsonSchema: {
      example: ``,
      minLength: 1,
    },
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    description: `Identifiant de la souscription`,
    jsonSchema: {
      example: ``,
      minLength: 1,
    },
  })
  subscriptionId: string;

  @property({
    type: 'string',
    required: true,
    description: `Valeur de hachage des données horodatées`,
    jsonSchema: {
      example: ``,
      minLength: 1,
    },
  })
  hashedSubscription: string;

  @property({
    type: 'string',
    required: true,
    description: `Données horodatées de la souscription (JSON stringifié)`,
    jsonSchema: {
      example: ``,
      minLength: 1,
    },
  })
  timestampedData: string;

  @property()
  subscription: Subscription;

  @property({
    type: 'any',
    required: true,
    description: `Jeton d'horodatage, tel que défini par la [RFC 3161](https://www.ietf.org/rfc/rfc3161.txt)`,
    jsonSchema: {
      example: ``,
      minLength: 1,
    },
  })
  timestampToken: BinaryData;

  @property({
    description: `Date généralisée de création du jeton d'horodatage par l'Autorité d'Horodatage`,
    type: 'date',
    defaultFn: 'now',
    jsonSchema: {
      example: `2022-01-01 00:00:00.000Z`,
    },
  })
  signingTime?: Date;

  @property({
    description: `Objet requête d'horodatage`,
  })
  request: Request;

  @property({
    description: `Date de création de l'horodatage de souscription`,
    type: 'date',
    defaultFn: 'now',
    jsonSchema: {
      example: `2022-01-01 00:00:00.000Z`,
    },
  })
  createdAt?: Date;

  constructor(data?: Partial<SubscriptionTimestamp>) {
    super(data);
  }
}

export interface SubscriptionTimestampRelations {}

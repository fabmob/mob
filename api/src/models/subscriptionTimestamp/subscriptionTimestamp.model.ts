import {Entity, model, property} from '@loopback/repository';
import {Subscription} from '../subscription/subscription.model';

@model()
export class SubscriptionTimestamp extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    description: `Identifiant de l'horodatage`,
    jsonSchema: {
      example: ``,
      minLength: 1,
    },
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    description: `Identifiant de la demande`,
    jsonSchema: {
      example: ``,
      minLength: 1,
    },
  })
  subscriptionId: string;

  @property({
    type: 'string',
    required: true,
    description: `Demande hachée`,
    jsonSchema: {
      example: ``,
      minLength: 1,
    },
  })
  hashedSubscription: string;

  @property()
  subscription: Subscription;

  @property({
    type: 'Binary',
    required: true,
    description: `Réponse de l'horodatage`,
    jsonSchema: {
      example: ``,
      minLength: 1,
    },
  })
  timestampReply: BinaryData;

  @property({
    description: `Date de création de l'horodatage`,
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

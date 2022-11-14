import {Model, model, property} from '@loopback/repository';

import {SUBSCRIPTION_STATUS} from '../../utils';
@model({settings: {idInjection: false}})
export class SubscriptionConsumePayload extends Model {
  @property({
    description: `Identifiant du citoyen ayant souscrit à l'aide`,
    required: true,
    jsonSchema: {
      example: ``,
    },
  })
  citizenId: string;
  @property({
    description: `Identifiant de la souscription`,
    required: true,
    jsonSchema: {
      example: ``,
    },
  })
  subscriptionId: string;

  @property({
    type: 'string',
    description: `Statut de la souscription`,
    required: true,
    jsonSchema: {
      additionalProperties: true,
      example: SUBSCRIPTION_STATUS.TO_PROCESS,
      enum: Object.values(SUBSCRIPTION_STATUS),
    },
  })
  status: SUBSCRIPTION_STATUS;

  constructor(data?: Partial<SubscriptionConsumePayload>) {
    super(data);
  }
}

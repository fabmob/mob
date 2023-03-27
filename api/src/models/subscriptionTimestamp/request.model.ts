import {Model, model, property} from '@loopback/repository';

@model()
export class Request extends Model {
  @property({
    description: `Client OpenID à l'origine de la requête d'horodatage de la souscription`,
    required: true,
    jsonSchema: {
      example: `clientId`,
    },
  })
  client?: string;

  @property({
    type: 'string',
    description: `Appel HTTP à l'origine de la requête d'horodatage de la souscription`,
    jsonSchema: {
      example: `POST v1/maas/subscriptions`,
    },
  })
  endpoint: string;

  constructor(Request: Request) {
    super(Request);
  }
}

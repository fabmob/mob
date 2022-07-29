import {Model, model, property} from '@loopback/repository';
import {HTTP_METHOD} from '../utils';

@model({settings: {idInjection: false}})
export class Link extends Model {
  @property({
    type: 'string',
    description: `Lien de redirection cible`,
    required: true,
    jsonSchema: {
      example:
        'https://website.${env}.moncomptemobilite.fr/subscriptions/new?incentiveId=',
    },
  })
  href: string;

  @property({
    type: 'string',
    description: `Ressource liée à la redirection`,
    required: true,
    jsonSchema: {
      example: `subscribe`,
    },
  })
  rel: string;

  @property({
    type: 'string',
    description: `Méthode HTTP nécessaire pour faire la redirection`,
    required: true,
    jsonSchema: {
      example: HTTP_METHOD.GET,
    },
  })
  method: HTTP_METHOD;

  constructor(data?: Partial<Link>) {
    super(data);
  }
}

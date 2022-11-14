import {Model, model, property} from '@loopback/repository';

import {USERTYPE} from '../../utils';

@model()
export class Contact extends Model {
  @property({
    type: 'string',
    description: `Nom de famille`,
    required: true,
    jsonSchema: {
      example: 'Rasovsky',
      minLength: 1,
    },
  })
  lastName: string;

  @property({
    type: 'string',
    description: `Prénom`,
    required: true,
    jsonSchema: {
      example: 'Bob',
      minLength: 1,
    },
  })
  firstName: string;

  @property({
    type: 'string',
    description: `Type d'utilisateur`,
    required: true,
    jsonSchema: {
      example: USERTYPE.CITIZEN,
      enum: Object.values(USERTYPE),
    },
  })
  userType: string;

  @property({
    type: 'string',
    description: `Email`,
    required: true,
    jsonSchema: {
      example: `bob.rasovsky@example.com`,
      pattern: '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$',
    },
  })
  email: string;

  @property({
    type: 'string',
    description: `Code postal`,
    required: true,
    jsonSchema: {
      example: 31000,
      pattern: '^[0-9]{5}$',
    },
  })
  postcode: string;

  @property({
    type: 'string',
    description: `Message que l'utilisateur souhaite envoyer au service MOB`,
    jsonSchema: {
      example: `Quand sera-t-il possible de souscrire à une aide de Toulouse ?`,
    },
  })
  message?: string;

  @property({
    type: 'boolean',
    description: `Acceptation des CGU et de la politique de protections des données`,
    required: true,
    hidden: true,
    jsonSchema: {
      example: true,
    },
  })
  tos: boolean;

  constructor(data?: Partial<Contact>) {
    super(data);
  }
}

export interface ContactRelations {
  // describe navigational properties here
}

export type ContactWithRelations = Contact & ContactRelations;

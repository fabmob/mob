import {model, property, Entity} from '@loopback/repository';

import {emailRegexp} from '../constants';

@model()
export class Keycloak extends Entity {
  @property({
    type: 'string',
    description: `Email`,
    required: true,
    jsonSchema: {
      example: `bob.rasovsky@example.com`,
      pattern: emailRegexp,
    },
  })
  email: string;

  @property({
    type: 'string',
    description: `Prénom`,
    required: true,
    jsonSchema: {
      example: `Bob`,
      minLength: 2,
    },
  })
  firstName: string;

  @property({
    type: 'string',
    description: `Nom de famille`,
    required: true,
    jsonSchema: {
      example: `Rasovsky`,
      minLength: 2,
    },
  })
  lastName: string;

  constructor(data?: Partial<Keycloak>) {
    super(data);
  }
}

import {model, property} from '@loopback/repository';

import {Keycloak} from '../keycloak.model';
import {Affiliation} from './affiliation.model';
import {CITIZEN_STATUS} from '../../utils';

@model()
export class Citizen extends Keycloak {
  @property({
    type: 'string',
    description: `Identifiant du citoyen`,
    id: true,
    generated: false,
    jsonSchema: {
      example: ``,
    },
  })
  id: string;

  @property({
    type: 'string',
    description: `Mot de passe`,
    required: true,
    hidden: true,
    jsonSchema: {
      example: ``,
    },
  })
  password: string;

  @property({
    type: 'date',
    description: `Date de naissance du citoyen`,
    required: true,
    jsonSchema: {
      example: `1970-01-01`,
      format: 'date',
    },
  })
  birthdate: string;

  @property({
    type: 'string',
    description: `Ville du citoyen`,
    required: true,
    jsonSchema: {
      example: `Toulouse`,
      minLength: 2,
    },
  })
  city: string;

  @property({
    type: 'string',
    description: `Code postal du citoyen`,
    required: true,
    jsonSchema: {
      example: `31000`,
      pattern: '[0-9]{5}',
    },
  })
  postcode: string;

  @property({
    type: 'string',
    description: `Statut professionnel du citoyen`,
    required: true,
    jsonSchema: {
      example: CITIZEN_STATUS.STUDENT,
      enum: Object.values(CITIZEN_STATUS),
    },
  })
  status: CITIZEN_STATUS;

  @property({
    type: 'boolean',
    description: `Acceptation des CGU`,
    required: true,
    hidden: true,
    jsonSchema: {
      example: true,
    },
  })
  tos1: boolean;

  @property({
    type: 'boolean',
    description: `Acceptation de la politique de protections des données`,
    required: true,
    hidden: true,
    jsonSchema: {
      example: true,
    },
  })
  tos2: boolean;

  @property({
    description: `Objet d'affiliation du citoyen à une entreprise`,
  })
  affiliation: Affiliation;

  constructor(data?: Partial<Citizen>) {
    super(data);
  }
}

export interface CitizenRelations {}

export type CitizenWithRelations = Citizen & CitizenRelations;

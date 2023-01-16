import {Entity, model, property} from '@loopback/repository';
import {CITIZEN_STATUS} from '../../utils';
import {AffiliationMigration} from './affiliationMigration.model';
import {Identity} from './identity.model';
import {PersonalInformation} from './personalInformation.model';

@model({
  settings: {
    strict: false,
    mongodb: {collection: 'Citizen'},
  },
})
export class CitizenMigration extends Entity {
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
    description: `Statut professionnel du citoyen`,
    required: true,
    jsonSchema: {
      example: CITIZEN_STATUS.STUDENT,
      enum: Object.values(CITIZEN_STATUS),
    },
  })
  status: CITIZEN_STATUS;

  @property({
    type: 'string',
    description: `Code postal du citoyen`,
    required: true,
    jsonSchema: {
      example: `31000`,
      pattern: '^[0-9]{5}$',
    },
  })
  postcode: string;

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
    description: `Objet Personal information`,
    required: true,
  })
  personalInformation: PersonalInformation;

  @property({
    description: `Objet identité`,
    required: true,
  })
  identity: Identity;

  @property({
    description: `Objet d'affiliation du citoyen à une entreprise`,
  })
  affiliation: AffiliationMigration;

  constructor(data?: CitizenMigration) {
    super(data);
  }
}

export interface CitizenMigrationRelations {}

export type CitizenMigrationWithRelations = CitizenMigration & CitizenMigrationRelations;

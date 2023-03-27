import {model, property, Entity} from '@loopback/repository';

import {Affiliation} from './affiliation.model';
import {Identity} from './identity.model';
import {PersonalInformation} from './personalInformation.model';
import {CITIZEN_STATUS} from '../../utils';
import {DgfipInformation} from './dgfipInformation.model';

@model()
export class CitizenFilter extends Entity {
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
    description: `Code postal du citoyen`,
    required: true,
    jsonSchema: {
      example: `31000`,
      pattern: '^[0-9]{5}$',
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
    description: `Objet d'affiliation du citoyen à une entreprise`,
  })
  affiliation: Affiliation;

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
    type: DgfipInformation,
    description: `Les données French DGFIP d'un citoyen`,
    required: false,
  })
  dgfipInformation: DgfipInformation;

  constructor(data?: Partial<CitizenFilter>) {
    super(data);
  }
}

export interface CitizenFilterRelations {}

export type CitizenFilterWithRelations = CitizenFilter & CitizenFilterRelations;

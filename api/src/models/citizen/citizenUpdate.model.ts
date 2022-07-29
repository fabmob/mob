import {Model, model, property} from '@loopback/repository';
import {Affiliation} from './affiliation.model';
import {CITIZEN_STATUS} from '../../utils';

@model({settings: {idInjection: false}})
export class CitizenUpdate extends Model {
  @property({
    type: 'string',
    description: `Ville`,
    required: true,
    jsonSchema: {
      example: `Paris`,
      minLength: 2,
    },
  })
  city: string;

  @property({
    type: 'string',
    description: `Code postal`,
    required: true,
    jsonSchema: {
      example: `75000`,
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
    description: `Objet d'affiliation du citoyen à une entreprise`,
  })
  affiliation: Affiliation;

  constructor(data?: Partial<CitizenUpdate>) {
    super(data);
  }
}

export interface CitizenUpdateRelations {}

export type CitizenUpdateWithRelations = CitizenUpdate & CitizenUpdateRelations;

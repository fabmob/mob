import {model, property} from '@loopback/repository';
import {EnterpriseDetails} from '.';
import {FunderBase} from './funderBase.model';

@model()
export class Enterprise extends FunderBase {
  @property({
    type: 'number',
    description: `Numéro SIRET du financeur`,
    jsonSchema: {
      example: 33070384400036,
    },
  })
  siretNumber?: number;

  @property({
    type: 'number',
    description: `Nombre de citoyens`,
    nullable: true,
    jsonSchema: {
      example: 110000,
    },
  })
  citizensCount?: number;

  @property({
    type: 'number',
    description: `Budget total alloué à la mobilité`,
    nullable: true,
    jsonSchema: {
      example: 100000,
    },
  })
  mobilityBudget?: number;

  @property({
    required: true,
  })
  enterpriseDetails: EnterpriseDetails;

  constructor(data?: Partial<Enterprise>) {
    super(data);
  }
}

export interface EnterpriseRelations {
  // describe navigational properties here
}

export type EnterpriseWithRelations = Enterprise & EnterpriseRelations;

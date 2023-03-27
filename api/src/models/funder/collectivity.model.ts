import {model, property} from '@loopback/repository';
import {FunderBase} from './funderBase.model';

@model()
export class Collectivity extends FunderBase {
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

  constructor(data?: Partial<Collectivity>) {
    super(data);
  }
}

export interface CollectivityRelations {
  // describe navigational properties here
}

export type CollectivityWithRelations = Collectivity & CollectivityRelations;

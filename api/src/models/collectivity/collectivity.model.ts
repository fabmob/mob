import {model, property, Entity} from '@loopback/repository';
import {EncryptionKey} from '../funder';

@model()
export class Collectivity extends Entity {
  @property({
    type: 'string',
    id: true,
    description: `Identifiant de la collectivité`,
    generated: false,
    jsonSchema: {
      example: ``,
    },
  })
  id: string;

  @property({
    type: 'string',
    description: `Nom de la collectivité`,
    required: true,
    jsonSchema: {
      example: `Mulhouse`,
    },
  })
  name: string;

  @property({
    type: 'number',
    description: `Nombre de citoyens de la collectivité`,
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

  @property()
  encryptionKey?: EncryptionKey;

  constructor(data?: Partial<Collectivity>) {
    super(data);
  }
}

export interface CollectivityRelations {
  // describe navigational properties here
}

export type CollectivityWithRelations = Collectivity & CollectivityRelations;

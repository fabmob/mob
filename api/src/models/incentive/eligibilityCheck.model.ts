import {Entity, model, property} from '@loopback/repository';

@model()
export class EligibilityCheck extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
    description: `Identifiant du contrôle`,
    generated: false,
    jsonSchema: {
      example: ``,
    },
  })
  id: string;

  @property.array(String)
  value: string[];

  @property({
    type: 'boolean',
    required: true,
    description: `Activation du contrôle`,
    jsonSchema: {
      example: true,
    },
  })
  active: boolean;

  constructor(data?: Partial<EligibilityCheck>) {
    super(data);
  }
}

export interface EligibilityCheckRelations {
  // describe navigational properties here
}

export type EligibilityCheckWithRelations = EligibilityCheck & EligibilityCheckRelations;

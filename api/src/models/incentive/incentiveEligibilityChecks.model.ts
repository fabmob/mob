import {Entity, model, property} from '@loopback/repository';
import {ELIGIBILITY_CHECKS_LABEL} from '../../utils';

@model()
export class IncentiveEligibilityChecks extends Entity {
  @property({
    type: 'string',
    id: true,
    description: `Identifiant du contrôle`,
    generated: true,
    jsonSchema: {
      example: ``,
    },
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    description: `Nom du contrôle`,
    jsonSchema: {
      example: `Offre à caractère exclusive, non cumulable`,
    },
  })
  name: string;

  @property({
    type: 'string',
    required: true,
    description: `Label du contrôle`,
    jsonSchema: {
      example: ELIGIBILITY_CHECKS_LABEL.EXCLUSION,
      enum: Object.values(ELIGIBILITY_CHECKS_LABEL),
    },
  })
  label: ELIGIBILITY_CHECKS_LABEL;

  @property({
    type: 'string',
    required: true,
    description: `Description du contrôle`,
    jsonSchema: {
      example: `1 souscription valide pour un ensemble d'aides mutuellement exclusives`,
    },
  })
  description: string;

  @property({
    type: 'string',
    required: true,
    description: `Type de la valeur du contrôle`,
    jsonSchema: {
      example: 'array',
    },
  })
  type: string;

  @property({
    type: 'string',
    required: true,
    description: `Motif du rejet`,
    jsonSchema: {
      example: `SouscriptionValideeExistante`,
    },
  })
  motifRejet: string;

  constructor(data?: Partial<IncentiveEligibilityChecks>) {
    super(data);
  }
}

export interface IncentiveEligibilityChecksRelations {
  // describe navigational properties here
}

export type IncentiveEligibilityChecksWithRelations = IncentiveEligibilityChecks &
  IncentiveEligibilityChecksRelations;

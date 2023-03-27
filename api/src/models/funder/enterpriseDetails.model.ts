import {model, property, Model} from '@loopback/repository';

@model()
export class EnterpriseDetails extends Model {
  @property({
    type: 'array',
    description: `Modèles d'email de l'entreprise`,
    itemType: 'string',
    required: true,
    jsonSchema: {
      example: `@professional.com`,
    },
  })
  emailDomainNames: string[];

  @property({
    type: 'boolean',
    description: `Intégration dans le processus SIRH de l'entreprise`,
    required: true,
    jsonSchema: {
      example: true,
    },
  })
  isHris: boolean;

  @property({
    type: 'boolean',
    description: `L'entreprise accepte l'affiliation manuelle`,
    required: true,
    jsonSchema: {
      example: true,
    },
  })
  hasManualAffiliation: boolean;

  constructor(data?: Partial<EnterpriseDetails>) {
    super(data);
  }
}

export interface EnterpriseDetailsRelations {
  // describe navigational properties here
}

export type EnterpriseDetailsWithRelations = EnterpriseDetails & EnterpriseDetailsRelations;

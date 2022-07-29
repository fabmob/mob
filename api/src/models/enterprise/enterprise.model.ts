import {model, property, Entity} from '@loopback/repository';

@model()
export class Enterprise extends Entity {
  @property({
    type: 'string',
    description: `Identifiant du l'entreprise`,
    id: true,
    generated: false,
    jsonSchema: {
      example: ``,
    },
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    description: `Nom de l'entreprise`,
    jsonSchema: {
      example: `Capgemini`,
    },
  })
  name: string;

  @property({
    type: 'number',
    description: `Numéro SIRET de l'entreprise`,
    jsonSchema: {
      example: 33070384400036,
    },
  })
  siretNumber?: number;

  @property({
    type: 'array',
    description: `Modèles d'email de l'entreprise`,
    itemType: 'string',
    required: true,
    jsonSchema: {
      example: `@professional.com`,
    },
  })
  emailFormat: string[];

  @property({
    type: 'number',
    description: `Nombre d'employés de l'entreprise`,
    nullable: true,
    jsonSchema: {
      example: 200000,
    },
  })
  employeesCount?: number;

  @property({
    type: 'number',
    description: `Bugdet total alloué à la mobilité`,
    nullable: true,
    jsonSchema: {
      example: 300000,
    },
  })
  budgetAmount?: number;

  @property({
    type: 'boolean',
    description: `Séléction du processus SIRH`,
    required: true,
    jsonSchema: {
      example: true,
    },
  })
  isHris: boolean;

  constructor(data?: Partial<Enterprise>) {
    super(data);
  }
}

export interface EnterpriseRelations {}

export type EnterpriseWithRelations = Enterprise & EnterpriseRelations;

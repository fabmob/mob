import {Entity, model, property} from '@loopback/repository';

import {SpecificField} from '../subscription/specificField.model';
import {INCENTIVE_TYPE, TRANSPORTS} from '../../utils';
import {Link} from '../links.model';
import {Territory} from '../territory';

@model({
  settings: {
    mongodb: {allowExtendedOperators: true},
  },
})
export class Incentive extends Entity {
  @property({
    type: 'string',
    id: true,
    description: `Identifiant de l'aide`,
    generated: true,
    jsonSchema: {
      example: ``,
    },
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    description: `Titre de l'aide`,
    jsonSchema: {
      example: `Le vélo électrique arrive à Mulhouse !`,
    },
  })
  title: string;

  @property({
    type: 'string',
    required: true,
    description: `Description de l'aide`,
    jsonSchema: {
      example: `Sous conditions d'éligibilité,\
      Mulhouse met à disposition une aide au financement d'un vélo électrique`,
    },
  })
  description: string;

  // TODO: REMOVING DEPRECATED territoryName.
  @property({
    type: 'string',
    required: false,
    description: `Territoire de l'aide`,
    jsonSchema: {
      example: `Mulhouse`,
    },
  })
  territoryName: string;

  @property({type: Territory, required: true})
  territory: Territory;

  @property({
    type: 'string',
    required: true,
    description: `Financeur de l'aide`,
    jsonSchema: {
      example: `Mulhouse`,
    },
  })
  funderName: string;

  @property({
    type: 'string',
    required: true,
    description: `Type de l'aide`,
    jsonSchema: {
      example: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
      enum: Object.values(INCENTIVE_TYPE),
    },
  })
  incentiveType: string;

  @property({
    type: 'string',
    required: true,
    description: `Conditions d'octroi de l'aide`,
    jsonSchema: {
      example: `Fournir une preuve d'achat d'un vélo électrique`,
    },
  })
  conditions: string;

  @property({
    type: 'string',
    required: true,
    description: 'Méthode du paiement',
    jsonSchema: {
      example: `Remboursement par virement`,
    },
  })
  paymentMethod: string;

  @property({
    type: 'string',
    required: true,
    description: `Montant alloué à l'aide par le financeur`,
    jsonSchema: {
      example: `500 €`,
    },
  })
  allocatedAmount: string;

  @property({
    type: 'string',
    required: true,
    description: 'Montant minimal attribué aux bénéficiaires',
    jsonSchema: {
      example: `50 €`,
    },
  })
  minAmount: string;

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
    description: `Catégories de transport de l'aide`,
    jsonSchema: {
      example: TRANSPORTS.ELECTRIC,
      enum: Object.values(TRANSPORTS),
    },
  })
  transportList: string[];

  @property({
    type: 'array',
    itemType: 'string',
    description: `Justificatifs demandés pour l'octroi de l'aide`,
    jsonSchema: {
      example: `Justificatif de domicile`,
    },
  })
  attachments?: string[];

  @property({
    type: 'string',
    description: 'Informations supplémentaires',
    jsonSchema: {
      example: `Aide mise à disposition uniquement pour les habitants de Mulhouse`,
    },
  })
  additionalInfos?: string;

  @property({
    type: 'string',
    description: 'Coordonnées de contact',
    jsonSchema: {
      example: `Contactez le numéro vert au 05 206 308`,
    },
  })
  contact?: string;

  @property({
    type: 'string',
    description: `Durée de validité de l'aide`,
    jsonSchema: {
      example: `12 mois`,
    },
  })
  validityDuration?: string;

  @property({
    type: 'date',
    description: `Date de fin de validité de l'aide`,
    jsonSchema: {
      example: `2024-07-31`,
      format: 'date',
    },
  })
  validityDate?: string;

  @property({
    type: 'boolean',
    description: 'Souscription possible à une aide via MCM',
    default: false,
    jsonSchema: {
      example: true,
    },
  })
  isMCMStaff: boolean;

  @property.array(SpecificField)
  specificFields?: SpecificField[];

  @property({
    type: 'object',
    description: 'Équivalent des champs spécifiques au format JsonSchema',
    hidden: true,
    jsonSchema: {
      example: {
        properties: {
          'Statut marital': {
            type: 'array',
            maxItems: 1,
            items: {
              enum: ['Marié', 'Célibataire'],
            },
          },
        },
        title: 'Le vélo électrique arrive à Mulhouse !',
        type: 'object',
        required: ['Statut marital'],
        additionalProperties: false,
      },
    },
  })
  jsonSchema?: object;

  @property({
    type: 'string',
    description: `Lien externe de souscription si non possible via MCM`,
    jsonSchema: {
      example: `https://www.mulhouse.fr`,
      pattern:
        "^(?:http(s)?:\\/\\/)[\\w.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\._~:%/?#[\\]@!\\$&'\\(\\)*\\+,;=.]+$",
    },
  })
  subscriptionLink?: string;

  @property({
    description: `Date de création de l'aide`,
    type: 'date',
    defaultFn: 'now',
    jsonSchema: {
      example: `2022-01-01 00:00:00.000Z`,
    },
  })
  createdAt?: Date;

  @property({
    description: `Date de modification de l'aide`,
    type: 'date',
    defaultFn: 'now',
    jsonSchema: {
      example: `2022-01-02 00:00:00.000Z`,
    },
  })
  updatedAt?: Date;

  @property({
    description: `L'identifiant du financeur de l'aide présent ou non en fonction de isMCMStaff`,
    type: 'string',
    jsonSchema: {
      example: ``,
    },
  })
  funderId?: string;

  @property.array(Link)
  links?: Link[];

  constructor(data?: Partial<Incentive>) {
    super(data);
  }
}

export interface IncentiveRelations {
  // describe navigational properties here
}

export type IncentiveWithRelations = Incentive & IncentiveRelations;

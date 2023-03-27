import {Entity, model, property} from '@loopback/repository';

import {emailRegexp} from '../../constants';
import {SUBSCRIPTION_STATUS, INCENTIVE_TYPE, TRANSPORTS} from '../../utils';
import {SubscriptionValidation} from './subscriptionValidation.model';
import {SubscriptionRejection} from './subscriptionRejection.model';
import {PrivateKeyAccess} from '../funder';

export interface AttachmentType {
  originalName: string;
  uploadDate: Date;
  proofType: string;
  mimeType: string;
}

@model()
export class Subscription extends Entity {
  @property({
    description: `Identifiant de la souscription`,
    id: true,
    generated: true,
    jsonSchema: {
      example: ``,
    },
  })
  id: string;

  @property({
    description: `Identifiant de l'aide souscrite`,
    required: true,
    jsonSchema: {
      example: ``,
    },
  })
  incentiveId: string;

  @property({
    description: `Nom du financeur de l'aide souscrite`,
    required: true,
    jsonSchema: {
      example: `Mulhouse`,
    },
  })
  funderName: string;

  @property({
    type: 'string',
    description: `Type de l'aide souscrite`,
    required: true,
    jsonSchema: {
      example: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
      enum: Object.values(INCENTIVE_TYPE),
    },
  })
  incentiveType: string;

  @property({
    description: `Titre de l'aide souscrite`,
    required: true,
    jsonSchema: {
      example: `Le vélo électrique arrive à Mulhouse !`,
    },
  })
  incentiveTitle: string;

  @property({
    type: 'array',
    itemType: 'string',
    description: `Catégories de transport de l'aide`,
    required: true,
    jsonSchema: {
      example: TRANSPORTS.ELECTRIC,
      enum: Object.values(TRANSPORTS),
    },
  })
  incentiveTransportList: string[];

  @property({
    description: `Identifiant du citoyen ayant souscrit à l'aide`,
    required: true,
    jsonSchema: {
      example: ``,
    },
  })
  citizenId: string;

  @property({
    description: `Nom de famille du citoyen ayant souscrit à l'aide`,
    required: true,
    jsonSchema: {
      example: `Rasovsky`,
    },
  })
  lastName: string;

  @property({
    description: `Prénom du citoyen ayant souscrit à l'aide`,
    required: true,
    jsonSchema: {
      example: `Bob`,
    },
  })
  firstName: string;

  @property({
    required: true,
    description: `Email du citoyen ayant souscrit à l'aide`,
    jsonSchema: {
      example: `bob.rasovsky@example.com`,
      format: 'email',
      pattern: emailRegexp,
    },
  })
  email: string;

  @property({
    type: 'string',
    description: `Ville du citoyen`,
    jsonSchema: {
      example: `Mulhouse`,
    },
  })
  city?: string;

  @property({
    type: 'string',
    description: `Code postal du citoyen`,
    jsonSchema: {
      example: `68100`,
      pattern: '[0-9]{5}',
    },
  })
  postcode?: string;

  @property({
    type: 'date',
    description: `Date de naissance du citoyen`,
    required: true,
    jsonSchema: {
      example: `1970-01-01`,
      format: 'date',
    },
  })
  birthdate: string;

  @property({
    description: `Identifiant de la communauté d'appartenance du citoyen`,
    jsonSchema: {
      example: ``,
    },
  })
  communityId?: string;

  @property({
    description: `Consentement du citoyen au partage des données fournies dans la souscription`,
    required: true,
    hidden: true,
    jsonSchema: {
      example: true,
    },
  })
  consent: boolean;

  @property({
    type: 'string',
    description: `Statut de la souscription`,
    required: true,
    jsonSchema: {
      example: SUBSCRIPTION_STATUS.TO_PROCESS,
      enum: Object.values(SUBSCRIPTION_STATUS),
    },
  })
  status: SUBSCRIPTION_STATUS;

  @property({
    type: 'array',
    description: `Justificatifs attachés à la souscription`,
    itemType: 'object',
    jsonSchema: {
      example: {
        originalName: 'uploadedAttachment.pdf',
        uploadDate: '2022-01-01 00:00:00.000Z',
        proofType: 'Passport',
        mimeType: 'application/pdf',
      },
    },
  })
  attachments?: Array<AttachmentType>;

  @property({
    type: 'string',
    description: `Clé de chiffrement symétrique chiffrée`,
    jsonSchema: {
      example: 'eFH6RizbEMmRV9QPrtHxjNXArDuPCLjl1BMQknX1erANNRLENCx',
    },
  })
  encryptedAESKey: string;

  @property({
    type: 'string',
    description: `Vecteur d'initialisation chiffré`,
    jsonSchema: {
      example: 'MjhvU1ZieHPvsxikp8Bxaz9KxrPHjkOZkPP2KGSiRkuA6+//aZ+2KIO',
    },
  })
  encryptedIV: string;

  @property({
    type: 'string',
    description: `Identifiant de la clé de chiffrement du financeur`,
    jsonSchema: {
      example: 'encryptionKeyId',
      minLength: 1,
    },
  })
  encryptionKeyId: string;

  @property({
    type: 'number',
    description: `Version de la clé de chiffrement`,
    jsonSchema: {
      example: 1,
    },
  })
  encryptionKeyVersion: number;

  @property()
  privateKeyAccess?: PrivateKeyAccess;

  @property({
    type: 'date',
    description: `Date de création de la souscription`,
    defaultFn: 'now',
    jsonSchema: {
      example: `2022-01-01 00:00:00.000Z`,
    },
  })
  createdAt: Date;

  @property({
    type: 'date',
    description: `Date de modification de la souscription`,
    defaultFn: 'now',
    jsonSchema: {
      example: `2022-01-02 00:00:00.000Z`,
    },
  })
  updatedAt: Date;

  @property({
    type: 'string',
    description: `Identifiant du financeur`,
    jsonSchema: {
      example: ``,
    },
  })
  funderId: string;

  @property()
  subscriptionValidation?: SubscriptionValidation;

  @property()
  subscriptionRejection?: SubscriptionRejection;

  @property({
    type: 'object',
    description: `Champs spécifiques liés à une aide remplis lors de la souscription`,
  })
  specificFields?: {[prop: string]: any};

  @property({
    type: 'boolean',
    description: `Statut du compte citoyen`,
    required: true,
    jsonSchema: {
      example: true,
    },
  })
  isCitizenDeleted: boolean;

  @property({
    description: `Email professionnel du salarié ayant souscrit à l'aide`,
    jsonSchema: {
      example: `bob.rasovsky.pro@example.com`,
      format: 'email',
      pattern: emailRegexp,
    },
  })
  enterpriseEmail?: string;

  constructor(data?: Partial<Subscription>) {
    super(data);
  }
}

export interface SubscriptionRelations {
  // describe navigational properties here
}

export type SubscriptionWithRelations = Subscription & SubscriptionRelations;

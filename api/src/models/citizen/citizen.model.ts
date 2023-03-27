import {model, property, Entity} from '@loopback/repository';

import {Affiliation} from './affiliation.model';
import {Identity} from './identity.model';
import {PersonalInformation} from './personalInformation.model';
import {CITIZEN_STATUS, GENDER, IDP_EMAIL_TEMPLATE} from '../../utils';
import {DgfipInformation} from './dgfipInformation.model';

import UserRepresentation from 'keycloak-admin/lib/defs/userRepresentation';

@model()
export class Citizen extends Entity {
  @property({
    type: 'string',
    description: `Identifiant du citoyen`,
    id: true,
    generated: false,
    jsonSchema: {
      example: ``,
    },
  })
  id: string;

  @property({
    type: 'string',
    description: `Mot de passe`,
    required: true,
    hidden: true,
    jsonSchema: {
      example: ``,
    },
  })
  password: string;

  @property({
    type: 'string',
    description: `Ville du citoyen`,
    required: true,
    jsonSchema: {
      example: `Toulouse`,
      minLength: 2,
    },
  })
  city: string;

  @property({
    type: 'string',
    description: `Code postal du citoyen`,
    required: true,
    jsonSchema: {
      example: `31000`,
      pattern: '^[0-9]{5}$',
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
    type: 'boolean',
    description: `Acceptation des CGU`,
    required: true,
    hidden: true,
    jsonSchema: {
      example: true,
    },
  })
  tos1: boolean;

  @property({
    type: 'boolean',
    description: `Acceptation de la politique de protections des données`,
    required: true,
    hidden: true,
    jsonSchema: {
      example: true,
    },
  })
  tos2: boolean;

  @property({
    type: 'number',
    description: `Timestamp de la date d'acceptation des consentements`,
    hidden: true,
    jsonSchema: {
      example: 1670504459406,
    },
  })
  terms_and_conditions: number;

  @property({
    type: 'number',
    description: `Timestamp de la dernière date de modification`,
    hidden: true,
    jsonSchema: {
      example: 1670504459406,
    },
  })
  updatedAt: number;

  @property({
    type: 'number',
    description: `Timestamp de la dernière date de connexion`,
    hidden: true,
    jsonSchema: {
      example: 1670504459406,
    },
  })
  lastLoginAt: number;

  @property({
    type: 'boolean',
    description: `Notification de suppression de compte envoyée`,
    hidden: true,
    jsonSchema: {
      example: false,
    },
  })
  isInactivityNotificationSent?: boolean;

  @property({
    description: `Objet d'affiliation du citoyen à une entreprise`,
  })
  affiliation: Affiliation;

  @property({
    description: `Objet Personal information`,
    required: true,
  })
  personalInformation: PersonalInformation;

  @property({
    description: `Objet identité`,
    required: true,
  })
  identity: Identity;

  @property({
    type: DgfipInformation,
    description: `Les données French DGFIP d'un citoyen`,
    required: false,
  })
  dgfipInformation: DgfipInformation;

  constructor(data?: Partial<Citizen>) {
    super(data);
  }

  /**
   * Convert Citizen to user entity with userAttributes
   */
  toUserRepresentation(): UserRepresentation {
    const gender: GENDER = this.identity.gender.value === 1 ? GENDER.MALE : GENDER.FEMALE;

    const userEntity: UserRepresentation = {
      username: this.personalInformation.email.value,
      email: this.personalInformation.email.value,
      firstName: this.identity.firstName.value,
      lastName: this.identity.lastName.value,
      attributes: {
        emailTemplate: IDP_EMAIL_TEMPLATE.CITIZEN,
        birthdate: this.identity.birthDate.value,
        gender: gender,
        'identity.gender': JSON.stringify(this.identity.gender),
        'identity.lastName': JSON.stringify(this.identity.lastName),
        'identity.firstName': JSON.stringify(this.identity.firstName),
        'identity.birthDate': JSON.stringify(this.identity.birthDate),
        'identity.birthPlace': JSON.stringify(this.identity.birthPlace),
        'identity.birthCountry': JSON.stringify(this.identity.birthCountry),
        'personalInformation.email': JSON.stringify(this.personalInformation.email),
        'personalInformation.primaryPhoneNumber': JSON.stringify(this.personalInformation.primaryPhoneNumber),
        'personalInformation.secondaryPhoneNumber': JSON.stringify(
          this.personalInformation.secondaryPhoneNumber,
        ),
        'personalInformation.primaryPostalAddress': JSON.stringify(
          this.personalInformation.primaryPostalAddress,
        ),
        'personalInformation.secondaryPostalAddress': JSON.stringify(
          this.personalInformation.secondaryPostalAddress,
        ),
        city: this.city,
        postcode: this.postcode,
        status: this.status,
        terms_and_conditions: this.terms_and_conditions || Date.now(),
        tos1: this.tos1,
        tos2: this.tos2,
        updatedAt: Date.now(),
        lastLoginAt: this.lastLoginAt,
        isInactivityNotificationSent: this.isInactivityNotificationSent,
      },
    };

    return userEntity;
  }
}

export interface CitizenRelations {}

export type CitizenWithRelations = Citizen & CitizenRelations;

export interface Subscription {
  id: string;
  incentiveId: string;
  incentiveTitle: string;
  citizenId: string;
  lastName: string;
  firstName: string;
  birthdate: string;
  city: string;
  email: string;
  postcode: string;
  funderName: string;
  incentiveType: INCENTIVE_TYPE;
  consent: boolean;
  status: STATUS;
  createdAt: string;
  updatedAt?: string;
  attachments?: AttachmentType[];
  incentiveTransportList: string[];
  specificFields?: any;
  encryptedAESKey?: string;
  encryptedIV?: string;
  encryptionKeyVersion?: number;
  encryptionKeyId?: string;
  privateKeyAccess?: PrivateKeyAccess;

  /** Properties populates when request is validate or refused. */
  subscriptionValidation?: SinglePayment | MultiplePayment | NoPayment;
  subscriptionRejection?: SubscriptionRejection;
}
export interface AttachmentType {
  originalName: string;
  uploadDate: Date;
  proofType: string;
  mimeType: string;
}

export interface SubscriptionRejection {
  type: REASON_REJECT_VALUE;
  other?: string;
  comments?: string;
}

export interface SinglePayment {
  mode: PAYMENT_VALUE.SINGLE;
  amount: string;
  comments?: string;
}
export interface MultiplePayment {
  mode: PAYMENT_VALUE.MULTIPLE;
  frequency: FREQUENCY_VALUE;
  amount: string;
  lastPayment: string;
  comments?: string;
}
export interface NoPayment {
  mode: PAYMENT_VALUE.NONE;
  comments?: string;
}
export interface PrivateKeyAccess {
  loginURL: string;
  getKeyURL?: string;
}

export enum STATUS {
  TO_PROCESS = 'A_TRAITER',
  VALIDATED = 'VALIDEE',
  REJECTED = 'REJETEE',
}

export enum INCENTIVE_TYPE {
  NATIONAL_INCENTIVE = 'AideNationale',
  TERRITORY_INCENTIVE = 'AideTerritoire',
  EMPLOYER_INCENTIVE = 'AideEmployeur',
  ALL_INCENTIVE = 'All',
}

export enum SUBSCRIPTION_STEP {
  VISUALIZE,
  VALIDATE,
  REJECT,
  CONFIRM_REJECT,
  CONFIRM_VALIDATE,
}

export enum PAYMENT_VALUE {
  SINGLE = 'unique',
  MULTIPLE = 'multiple',
  NONE = 'aucun',
}

export enum FREQUENCY_VALUE {
  MONTHLY = 'mensuelle',
  QUARTERLY = 'trimestrielle',
}

export enum REASON_REJECT_VALUE {
  CONDITION = 'ConditionsNonRespectees',
  MISSING_PROOF = 'JustificatifManquant',
  INVALID_PROOF = 'JustificatifInvalide',
  OTHER = 'Autre',
}

export enum REASON_REJECT_LABEL {
  'ConditionsNonRespectees' = "Conditions d'éligibilité non respectées",
  'JustificatifManquant' = 'Justificatif manquant',
  'JustificatifInvalide' = 'Justificatif invalide ou non lisible',
  'Autre' = 'Autre',
}

import {Model, model, property} from '@loopback/repository';
import {PAYMENT_FREQ, PAYMENT_MODE} from '../../utils';

@model({
  settings: {idInjection: false},
})
export class CommonValidation extends Model {
  @property({
    type: 'string',
    description: `Modalité du financement de l'aide`,
    required: true,
    jsonSchema: {
      example: PAYMENT_MODE.UNIQUE,
      enum: Object.values(PAYMENT_MODE),
    },
  })
  mode: string;

  @property({
    description: `Message indiquant un commentaire relatif au traitement de la demande`,
    jsonSchema: {
      example: `Le montant de paiement est à titre indicatif et vous sera transmis plus tard`,
    },
  })
  comments?: string;
  constructor(data?: Partial<CommonValidation>) {
    super(data);
  }
}

@model({
  settings: {idInjection: false},
})
export class ValidationSinglePayment extends CommonValidation {
  @property({
    type: 'number',
    description: `Montant en euros alloué à la demande`,
    minimum: 0,
    exclusiveMinimum: true,
    jsonSchema: {
      example: 50,
    },
  })
  amount?: number;

  constructor(data?: Partial<ValidationSinglePayment>) {
    super(data);
  }
}

@model({
  settings: {idInjection: false},
})
export class ValidationNoPayment extends CommonValidation {
  constructor(data?: Partial<ValidationNoPayment>) {
    super(data);
  }
}

@model({
  settings: {idInjection: false},
})
export class ValidationMultiplePayment extends CommonValidation {
  @property({
    type: 'string',
    description: `Fréquence du versement`,
    required: true,
    jsonSchema: {
      example: PAYMENT_FREQ.MONTHLY,
      enum: Object.values(PAYMENT_FREQ),
    },
  })
  frequency: string;

  @property({
    type: 'number',
    description: `Montant en euros alloué à la demande`,
    minimum: 0,
    exclusiveMinimum: true,
    jsonSchema: {
      example: 50,
    },
  })
  amount?: number;

  @property({
    type: 'date',
    description: `Date du dernier versement`,
    required: true,
    jsonSchema: {
      example: '2023-01-01',
      format: 'date',
    },
  })
  lastPayment: string;

  constructor(data?: Partial<ValidationMultiplePayment>) {
    super(data);
  }
}

export type SubscriptionValidation =
  | ValidationMultiplePayment
  | ValidationSinglePayment
  | ValidationNoPayment;

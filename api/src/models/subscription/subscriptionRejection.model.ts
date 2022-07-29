import {Model, model, property} from '@loopback/repository';

import {REJECTION_REASON} from '../../utils';

@model({settings: {idInjection: false}})
export class CommonRejection extends Model {
  @property({
    type: 'string',
    description: `Motif du rejet de la demande`,
    required: true,
    jsonSchema: {
      example: REJECTION_REASON.OTHER,
      enum: Object.values(REJECTION_REASON),
    },
  })
  type: string;

  @property({
    description: `Message indiquant un commentaire relatif au traitement de la demande`,
    jsonSchema: {
      example: `Le justificatif demandé pour la souscription de l'aide est obligatoire`,
    },
  })
  comments?: string;

  constructor(data?: CommonRejection) {
    super(data);
  }
}

@model({
  settings: {idInjection: false},
})
export class NoReason extends CommonRejection {
  constructor(data: NoReason) {
    super(data);
  }
}
@model({
  settings: {idInjection: false},
})
export class OtherReason extends CommonRejection {
  @property({
    description: `Message indiquant une raison autre que les motifs de rejet`,
    required: true,
    jsonSchema: {
      maxLength: 80,
      example: `Mauvaise communauté d'appartenance`,
    },
  })
  other: string;

  constructor(data: OtherReason) {
    super(data);
  }
}

export type SubscriptionRejection = OtherReason | NoReason;

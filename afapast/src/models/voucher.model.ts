import {Entity, model, property} from '@loopback/repository';
export enum VoucherStatus {
  UNUSED = "UNUSED",
  USED = "USED",
  REVOKED = "REVOKED"
}

@model()
export class Voucher extends Entity {
  @property({
    type: 'number',
    id: true,
    description: 'Auto generated id',
    generated: true,
  })
  id: number;

  @property({
    type: 'string',
    description: 'Code of the voucher, will be sent to the citizen, example: "4A2NN3ES"',
    required: true,
    index: {
      unique: true
    }
  })
  value: string;
  
  @property({
    type: 'string',
    description: 'Status of the voucher, UNUSED marks availability for distribution',
    default: VoucherStatus.UNUSED,
    jsonSchema: {
      enum: Object.values(VoucherStatus),
    },
  })
  status: VoucherStatus;

  @property({
    type: 'string',
    description: 'Precision on the amount, unused for now',
    default: ''
  })
  amount?: string;

  @property({
    type: 'string',
    description: 'Automatically filled Id of the subscription the voucher was used for',
    default: ''
  })
  subscriptionId?: string;

  @property({
    type: 'string',
    description: 'Automatically filled Id of the citizen the voucher was distributed to',
    default: ''
  })
  citizenId?: string;

  @property({
    type: 'string',
    description: 'Automatically filled Id of the incentive the voucher was used for',
    default: ''
  })
  incentiveId?: string;


  constructor(data?: Partial<Voucher>) {
    super(data);
  }
}

export interface VoucherRelations {
  // describe navigational properties here
}

export type VoucherWithRelations = Voucher & VoucherRelations;

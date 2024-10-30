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
    generated: true,
  })
  id: number;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true
    }
  })
  value: string;
  
  @property({
    type: 'string',
    default: VoucherStatus.UNUSED,
    jsonSchema: {
      enum: Object.values(VoucherStatus),
    },
  })
  status: VoucherStatus;

  @property({
    type: 'string',
    default: ''
  })
  amount?: string;

  @property({
    type: 'string',
    default: ''
  })
  subscriptionId?: string;

  @property({
    type: 'string',
    default: ''
  })
  citizenId?: string;

  @property({
    type: 'string',
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

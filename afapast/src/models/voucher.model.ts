import {Entity, model, property} from '@loopback/repository';
export enum VOUCHER_STATUS {
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
    default: VOUCHER_STATUS.UNUSED,
    jsonSchema: {
      enum: Object.values(VOUCHER_STATUS),
    },
  })
  status: VOUCHER_STATUS;

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

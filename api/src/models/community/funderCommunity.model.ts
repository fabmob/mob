import {model, property} from '@loopback/repository';

import {Community} from '.';
import {FUNDER_TYPE} from '../../utils';

@model()
export class FunderCommunity extends Community {
  @property({
    type: 'string',
    description: `Nom du financeur attaché à la communauté`,
    required: true,
    jsonSchema: {
      example: `Mulhouse`,
    },
  })
  funderName: string;

  @property({
    type: 'string',
    description: `Type du financeur attaché à la communauté`,
    required: true,
    jsonSchema: {
      example: FUNDER_TYPE.COLLECTIVITY,
      enum: Object.values(FUNDER_TYPE),
    },
  })
  funderType: FUNDER_TYPE;

  constructor(data?: Partial<FunderCommunity>) {
    super(data);
  }
}

export interface FunderCommunityRelations {
  // describe navigational properties here
}

export type FunderCommunityWithRelations = FunderCommunity & FunderCommunityRelations;

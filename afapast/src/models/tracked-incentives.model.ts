import {Entity, model, property} from '@loopback/repository';

@model()
export class TrackedIncentives extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  incentiveId: string;

  @property({
    type: 'date',
  })
  lastReadTime?: string;

  @property({
    type: 'number',
    default: 0,
  })
  lastNbSubs?: number;

  @property({
    type: 'number',
    default: 0,
  })
  nbSubsHandled?: number;
  
  @property({
    type: 'string',
    description: 'Contacts that will also receive the emails, alongside the employee. Comma separated list of emails',
    default: '',
  })
  ccContacts?: string;

  constructor(data?: Partial<TrackedIncentives>) {
    super(data);
  }
}

export interface TrackedIncentivesRelations {
  // describe navigational properties here
}

export type TrackedIncentivesWithRelations = TrackedIncentives & TrackedIncentivesRelations;

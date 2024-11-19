import {Entity, model, property} from '@loopback/repository';

@model()
export class TrackedIncentives extends Entity {
  @property({
    type: 'number',
    description: 'Auto generated id',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    description: 'Id of the incentive to track, should match an id in moB, example: 67378718fce6b98d279a0f27',
    required: true,
  })
  incentiveId: string;

  @property({
    type: 'date',
    description: 'Last time the subscriptions were checked for this incentive',
  })
  lastReadTime?: string;

  @property({
    type: 'number',
    description: 'Total number of VALIDEE subscriptions during the last check',
    default: 0,
  })
  lastNbSubs?: number;

  @property({
    type: 'number',
    description: 'Total number of subscriptions handled',
    default: 0,
  })
  nbSubsHandled?: number;
  
  @property({
    type: 'string',
    description: 'Contacts that will also receive the emails, alongside the employee. Comma separated list of emails. Example: "hello@test.com,hello2@test.com"',
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

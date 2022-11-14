import {model, property, Entity} from '@loopback/repository';

@model()
export class CronJob extends Entity {
  @property({
    type: 'string',
    description: `Identifiant du cron job`,
    id: true,
    generated: true,
    jsonSchema: {
      example: ``,
    },
  })
  id: string;

  @property({
    type: 'string',
    description: `Type du cron job`,
    required: true,
    index: {
      unique: true,
    },
    jsonSchema: {
      example: `cron_type`,
    },
  })
  type: string;

  @property({
    description: `Date de création du cron`,
    type: 'date',
    defaultFn: 'now',
    jsonSchema: {
      example: `2022-01-01 00:00:00.000Z`,
    },
  })
  createdAt?: Date;

  constructor(data?: Partial<CronJob>) {
    super(data);
  }
}

export interface CronJobRelations {}

export type CronJobWithRelations = CronJob & CronJobRelations;

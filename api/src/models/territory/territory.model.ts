import {Entity, model, property} from '@loopback/repository';

@model()
export class Territory extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    description: `Identifiant du territoire`,
    jsonSchema: {
      example: ``,
      minLength: 1,
    },
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    description: `Nom du territoire`,
    index: {
      unique: true,
    },
    jsonSchema: {
      example: `Mulhouse Aglomération`,
      minLength: 2,
    },
  })
  name: string;

  constructor(data?: Partial<Territory>) {
    super(data);
  }
}

export interface TerritoryRelations {}

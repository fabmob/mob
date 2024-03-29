import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Funder} from '../funder';

@model()
export class Community extends Entity {
  @property({
    type: 'string',
    description: `Identifiant de la communauté`,
    id: true,
    generated: true,
    jsonSchema: {
      example: ``,
    },
  })
  id: string;

  @property({
    type: 'string',
    description: `Nom de la communauté`,
    required: true,
    jsonSchema: {
      example: `Communauté A de Mulhouse`,
    },
  })
  name: string;

  @belongsTo(
    () => Funder,
    {name: 'funder'},
    {
      type: 'string',
      required: true,
      description: `Identifiant du financeur à laquelle la communauté est attachée`,
      jsonSchema: {
        example: ``,
      },
    },
  )
  funderId: string;

  constructor(data?: Partial<Community>) {
    super(data);
  }
}

export interface CommunityRelations {
  // describe navigational properties here
}

export type CommunityWithRelations = Community & CommunityRelations;

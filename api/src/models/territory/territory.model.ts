import {Entity, model, property} from '@loopback/repository';
import {SCALE} from '../../utils';

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
      example: `Mulhouse Alsace Agglomération`,
      minLength: 2,
    },
  })
  name: string;

  @property({
    type: 'string',
    required: true,
    description: `Échelle du territoire`,
    jsonSchema: {
      example: SCALE.MUNICIPALITY,
      enum: Object.values(SCALE),
    },
  })
  scale: string;

  @property({
    type: 'array',
    itemType: 'string',
    description: `Liste des codes INSEE associés au territoire`,
    jsonSchema: {
      example: '68224',
    },
  })
  inseeValueList?: string[];

  constructor(data?: Partial<Territory>) {
    super(data);
  }
}

export interface TerritoryRelations {}

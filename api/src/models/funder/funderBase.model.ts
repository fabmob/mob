import {Entity, model, property} from '@loopback/repository';
import {FUNDER_TYPE} from '../../utils';
import {EncryptionKey} from './encryptionKey.model';

@model()
export class FunderBase extends Entity {
  @property({
    type: 'string',
    id: true,
    description: `Identifiant du financeur`,
    generated: false,
    jsonSchema: {
      example: ``,
    },
  })
  id: string;

  @property({
    type: 'string',
    description: `Nom du financeur`,
    required: true,
    jsonSchema: {
      example: `Etat Français`,
    },
  })
  name: string;

  @property({
    type: 'string',
    description: `Type de financeur`,
    required: true,
    jsonSchema: {
      example: FUNDER_TYPE.NATIONAL,
      enum: Object.values(FUNDER_TYPE),
    },
  })
  type: string;

  @property({
    type: 'string',
    description: `Nom du client`,
    jsonSchema: {
      example: `client-backend`,
    },
  })
  clientId?: string;

  @property()
  encryptionKey?: EncryptionKey;

  constructor(data?: Partial<FunderBase>) {
    super(data);
  }
}

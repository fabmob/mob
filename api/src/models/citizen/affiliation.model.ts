import {belongsTo, Entity, model, property} from '@loopback/repository';

import {AFFILIATION_STATUS} from '../../utils';
import {UserEntity} from '../idp';

@model()
export class Affiliation extends Entity {
  @property({
    type: 'string',
    description: `Identifiant de l'affiliation`,
    id: true,
    generated: true,
    jsonSchema: {
      example: ``,
    },
  })
  id: string;

  @belongsTo(
    () => UserEntity,
    {name: 'user'},
    {
      description: `Identifiant du citoyen affilié`,
      required: true,
      jsonSchema: {
        example: ``,
      },
    },
  )
  citizenId: string;

  @property({
    type: 'string',
    description: `Identifiant de l'entreprise professionnelle du citoyen`,
    jsonSchema: {
      example: ``,
    },
  })
  enterpriseId: string | null;

  @property({
    type: 'string',
    description: `Email professionnel du citoyen`,
    jsonSchema: {
      example: `bob.rasovsky@professional.com`,
    },
  })
  enterpriseEmail: string | null;

  @property({
    type: 'string',
    description: `Statut de l'affiliation`,
    jsonSchema: {
      example: AFFILIATION_STATUS.TO_AFFILIATE,
    },
  })
  status: AFFILIATION_STATUS;

  constructor(affiliation: Affiliation) {
    super(affiliation);
  }
}

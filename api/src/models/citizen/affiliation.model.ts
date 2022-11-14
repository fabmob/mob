import {Model, model, property} from '@loopback/repository';

import {AFFILIATION_STATUS} from '../../utils';

@model({settings: {idInjection: false}})
export class Affiliation extends Model {
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
  affiliationStatus: AFFILIATION_STATUS;

  constructor(affiliation: Affiliation) {
    super(affiliation);
    this.affiliationStatus = AFFILIATION_STATUS.TO_AFFILIATE;
  }
}

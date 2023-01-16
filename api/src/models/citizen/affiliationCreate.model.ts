import {Model, model, property} from '@loopback/repository';

@model()
export class AffiliationCreate extends Model {
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

  constructor(affiliationCreate: AffiliationCreate) {
    super(affiliationCreate);
  }
}

import {Model, model, property} from '@loopback/repository';
import {IntegerType, NumberType} from '../cmsTypes.model';

@model({settings: {idInjection: false}})
export class TaxNotice extends Model {
  @property({
    type: IntegerType,
    description: 'Année de déclaration',
  })
  declarationYear: IntegerType;

  @property({
    type: IntegerType,
    description: `Nombre d'actions`,
  })
  numberOfShares: IntegerType;

  @property({
    type: NumberType,
    description: 'Revenu brut global',
  })
  grossIncome: NumberType;

  @property({
    type: NumberType,
    description: 'Revenu fiscal',
  })
  taxableIncome: NumberType;

  @property({
    type: NumberType,
    description: 'Revenu fiscal de référence',
  })
  referenceTaxIncome: NumberType;

  @property({
    type: NumberType,
    description: `Montant de l'impôt`,
  })
  taxAmount: NumberType;

  constructor(data: TaxNotice) {
    super(data);
  }
}

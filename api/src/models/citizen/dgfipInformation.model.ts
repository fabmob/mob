import {Model, model, property} from '@loopback/repository';
import {Declarant} from './declarant.model';
import {TaxNotice} from './taxNotice.model';

@model({settings: {idInjection: false}})
export class DgfipInformation extends Model {
  @property({
    type: Declarant,
    description: `Les informations du premier déclarant`,
  })
  declarant1: Declarant;

  @property({
    type: Declarant,
    description: 'Les informations du deuxième déclarant',
  })
  declarant2: Declarant;

  @property.array(TaxNotice)
  taxNotices: TaxNotice[];

  constructor(data: DgfipInformation) {
    super(data);
  }
}

import {model} from '@loopback/repository';
import {FunderBase} from './funderBase.model';

@model()
export class NationalAdministration extends FunderBase {
  constructor(data?: Partial<NationalAdministration>) {
    super(data);
  }
}

export interface NationalAdministrationRelations {
  // describe navigational properties here
}

export type NationalAdministrationWithRelations = NationalAdministration & NationalAdministrationRelations;

import {model, Entity} from '@loopback/repository';
import {EnterpriseMixin, CollectivityMixin, NationalAdministrationMixin} from '../../mixins';

@model()
export class Funder extends EnterpriseMixin(CollectivityMixin(NationalAdministrationMixin(Entity))) {
  constructor(data?: Partial<Funder>) {
    super(data);
  }
}

export interface FunderRelations {
  // describe navigational properties here
}

export type FunderWithRelations = Funder & FunderRelations;

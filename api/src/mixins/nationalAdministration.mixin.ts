import {MixinTarget} from '@loopback/core';
import {Model} from '@loopback/repository';
import {NationalAdministration} from '../models/funder/nationalAdministration.model';

/**
 * A mixin factory to add `National Administration` properties
 *
 * @param superClass - Base Class
 * @typeParam T - Model class
 */
export function NationalAdministrationMixin<T extends MixinTarget<Model>>(superClass: T) {
  class MixedModel extends NationalAdministration {}
  return MixedModel;
}

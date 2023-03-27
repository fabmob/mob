import {MixinTarget} from '@loopback/core';
import {Model} from '@loopback/repository';
import {Collectivity} from '../models/funder/collectivity.model';

/**
 * A mixin factory to add `Collectivity` properties
 *
 * @param superClass - Base Class
 * @typeParam T - Model class
 */
export function CollectivityMixin<T extends MixinTarget<Model>>(superClass: T) {
  class MixedModel extends Collectivity {}
  return MixedModel;
}

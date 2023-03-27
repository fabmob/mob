import {MixinTarget} from '@loopback/core';
import {Model, property} from '@loopback/repository';
import {EnterpriseDetails} from '../models';
import {Enterprise} from '../models/funder/enterprise.model';

/**
 * A mixin factory to add `Enterprise` property
 *
 * @param superClass - Base Class
 * @typeParam T - Model class
 */
export function EnterpriseMixin<T extends MixinTarget<Model>>(superClass: T) {
  class MixedModel extends Enterprise {
    @property({
      required: false,
    })
    enterpriseDetails: EnterpriseDetails;
  }
  return MixedModel;
}

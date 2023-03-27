import {injectable, BindingScope} from '@loopback/core';
import {getJsonSchema} from '@loopback/rest';
import {Schema, ValidationError, Validator, ValidatorResult} from 'jsonschema';

import {Collectivity, EncryptionKey, Enterprise, Funder, NationalAdministration} from '../models';
import {FUNDER_TYPE} from '../utils';

const FUNDER_TYPE_MODEL_VALIDATION = {
  [FUNDER_TYPE.NATIONAL]: getJsonSchema(NationalAdministration),
  [FUNDER_TYPE.ENTERPRISE]: getJsonSchema(Enterprise),
  [FUNDER_TYPE.COLLECTIVITY]: getJsonSchema(Collectivity),
};
@injectable({scope: BindingScope.TRANSIENT})
export class FunderService {
  constructor() {}

  /**
   * Validate funder against jsonSchema according to FUNDER_TYPE
   * @param funderToValidate Funder
   * @param funderType FUNDER_TYPE
   * @returns ValidationError[]
   */
  validateSchema(funderToValidate: Funder, funderType: FUNDER_TYPE): ValidationError[] {
    const validator = new Validator();
    validator.addSchema(getJsonSchema(EncryptionKey) as Schema);
    const resultCompare: ValidatorResult = validator.validate(funderToValidate, {
      ...FUNDER_TYPE_MODEL_VALIDATION[funderType],
      additionalProperties: false,
    } as Schema);

    return resultCompare.errors.length ? resultCompare.errors : [];
  }
}

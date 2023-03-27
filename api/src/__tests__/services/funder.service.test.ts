import {expect} from '@loopback/testlab';
import {ValidationError} from 'jsonschema';
import {Funder} from '../../models';

import {FunderService} from '../../services';
import {FUNDER_TYPE} from '../../utils';

describe('Funder services', () => {
  let funderService: FunderService;

  beforeEach(() => {
    funderService = new FunderService();
    process.env.NODE_ENV = 'test';
  });

  it('should validateSchema: OK', () => {
    const funderToValidate: Funder = new Funder({id: '', name: 'funderName', type: FUNDER_TYPE.NATIONAL});
    const validationResult: ValidationError[] = funderService.validateSchema(
      funderToValidate,
      FUNDER_TYPE.NATIONAL,
    );
    expect(validationResult).to.deepEqual([]);
  });

  it('should validateSchema: KO', () => {
    const funderToValidate: Funder = new Funder({id: '', name: 'funderName', type: FUNDER_TYPE.ENTERPRISE});
    const validationError: ValidationError[] = funderService.validateSchema(
      funderToValidate,
      FUNDER_TYPE.ENTERPRISE,
    );
    expect(validationError[0].message).to.equal('requires property "enterpriseDetails"');
  });
});

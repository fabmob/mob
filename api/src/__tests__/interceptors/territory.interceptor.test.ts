import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';

import {TerritoryInterceptor} from '../../interceptors';
import {TerritoryService} from '../../services';
import {SCALE, StatusCode} from '../../utils';

describe('TerritoryInterceptor', () => {
  let territoryInterceptor: any = null;
  let territoryService: StubbedInstanceWithSinonAccessor<TerritoryService>;

  beforeEach(() => {
    territoryService = createStubInstance(TerritoryService);
    territoryInterceptor = new TerritoryInterceptor(territoryService);
  });

  it('TerritoryInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(territoryInterceptor.intercept, 'bind').resolves(res);
    const result = await territoryInterceptor.value();

    expect(result).to.equal(res);
  });

  it('TerritoryInterceptor create scale and no inseeValueList - ERROR', async () => {
    try {
      const invocationContext = {
        ...invocationContextCreateTerritory,
        ...argsErrorScaleInseeValueListEmpty,
      };
      await territoryInterceptor.intercept(invocationContext);
    } catch (err) {
      expect(err.message).to.equal('InseeValueList must be provided');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('TerritoryInterceptor create isValidInseeCodePattern - ERROR', async () => {
    try {
      const invocationContext = {
        ...invocationContextCreateTerritory,
        ...argsErrorInvalidInseeCodePattern,
      };
      territoryService.stubs.isValidInseeCodePattern.returns(false);
      await territoryInterceptor.intercept(invocationContext);
    } catch (err) {
      expect(err.message).to.equal('InseeValueList does not have a valid pattern');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('TerritoryInterceptor create hasDuplicatedValues - ERROR', async () => {
    try {
      const invocationContext = {
        ...invocationContextCreateTerritory,
        ...argsErrorDuplicatedValues,
      };
      territoryService.stubs.isValidInseeCodePattern.returns(true);
      territoryService.stubs.hasDuplicatedValues.returns(true);
      await territoryInterceptor.intercept(invocationContext);
    } catch (err) {
      expect(err.message).to.equal('InseeValueList has duplicated values');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('TerritoryInterceptor create isValidScaleInseeCodeValidation - ERROR', async () => {
    try {
      const invocationContext = {
        ...invocationContextCreateTerritory,
        ...argsErrorScaleInseeValidation,
      };
      territoryService.stubs.isValidInseeCodePattern.returns(true);
      territoryService.stubs.hasDuplicatedValues.returns(false);
      territoryService.stubs.isValidScaleInseeCodeValidation.returns(false);
      await territoryInterceptor.intercept(invocationContext);
    } catch (err) {
      expect(err.message).to.equal('Scale and InseeCodeList do not match');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('TerritoryInterceptor create - SUCCESS', async () => {
    const invocationContext = {...invocationContextCreateTerritory, ...argsSuccess};
    territoryService.stubs.isValidInseeCodePattern.returns(true);
    territoryService.stubs.hasDuplicatedValues.returns(false);
    territoryService.stubs.isValidScaleInseeCodeValidation.returns(true);
    const result = await territoryInterceptor.intercept(invocationContext, () => {});
    expect(result).to.Null;
  });

  it('TerritoryInterceptor edit scale and no inseeValueList - ERROR', async () => {
    try {
      const invocationContext = {
        ...invocationContextEditTerritory,
        args: ['territoryId', ...argsErrorScaleInseeValueListEmpty.args],
      };
      await territoryInterceptor.intercept(invocationContext);
    } catch (err) {
      expect(err.message).to.equal('InseeValueList must be provided');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('TerritoryInterceptor edit isValidInseeCodePattern - ERROR', async () => {
    try {
      const invocationContext = {
        ...invocationContextEditTerritory,
        args: ['territoryId', ...argsErrorInvalidInseeCodePattern.args],
      };
      territoryService.stubs.isValidInseeCodePattern.returns(false);
      await territoryInterceptor.intercept(invocationContext);
    } catch (err) {
      expect(err.message).to.equal('InseeValueList does not have a valid pattern');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('TerritoryInterceptor edit hasDuplicatedValues - ERROR', async () => {
    try {
      const invocationContext = {
        ...invocationContextEditTerritory,
        args: ['territoryId', ...argsErrorDuplicatedValues.args],
      };
      territoryService.stubs.isValidInseeCodePattern.returns(true);
      territoryService.stubs.hasDuplicatedValues.returns(true);
      await territoryInterceptor.intercept(invocationContext);
    } catch (err) {
      expect(err.message).to.equal('InseeValueList has duplicated values');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('TerritoryInterceptor edit isValidScaleInseeCodeValidation - ERROR', async () => {
    try {
      const invocationContext = {
        ...invocationContextEditTerritory,
        args: ['territoryId', ...argsErrorScaleInseeValidation.args],
      };
      territoryService.stubs.isValidInseeCodePattern.returns(true);
      territoryService.stubs.hasDuplicatedValues.returns(false);
      territoryService.stubs.isValidScaleInseeCodeValidation.returns(false);
      await territoryInterceptor.intercept(invocationContext);
    } catch (err) {
      expect(err.message).to.equal('Scale and InseeCodeList do not match');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('TerritoryInterceptor edit - SUCCESS', async () => {
    const invocationContext = {
      ...invocationContextEditTerritory,
      args: ['territoryId', ...argsSuccess.args],
    };
    territoryService.stubs.isValidInseeCodePattern.returns(true);
    territoryService.stubs.hasDuplicatedValues.returns(false);
    territoryService.stubs.isValidScaleInseeCodeValidation.returns(true);
    const result = await territoryInterceptor.intercept(invocationContext, () => {});
    expect(result).to.Null;
  });
});

const invocationContextCreateTerritory = {
  target: {},
  methodName: 'create',
};

const invocationContextEditTerritory = {
  target: {},
  methodName: 'updateById',
};

const argsErrorScaleInseeValueListEmpty = {
  args: [
    {
      name: 'Territory',
      scale: SCALE.AGGLOMERATION,
    },
  ],
};

const argsErrorInvalidInseeCodePattern = {
  args: [
    {
      name: 'Territory',
      scale: SCALE.AGGLOMERATION,
      inseeValueList: ['test'],
    },
  ],
};

const argsErrorDuplicatedValues = {
  args: [
    {
      name: 'Territory',
      scale: SCALE.AGGLOMERATION,
      inseeValueList: ['11111', '11111'],
    },
  ],
};

const argsErrorScaleInseeValidation = {
  args: [
    {
      name: 'Territory',
      scale: SCALE.AGGLOMERATION,
      inseeValueList: ['11'],
    },
  ],
};

const argsSuccess = {
  args: [
    {
      name: 'Territory',
      scale: SCALE.AGGLOMERATION,
      inseeValueList: ['11111', '12222'],
    },
  ],
};

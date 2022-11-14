import {expect, sinon} from '@loopback/testlab';

import {ValidationError} from '../../validationError';
import {StatusCode} from '../../utils';
import {EnterpriseInterceptor} from '../../interceptors';

describe('Enterprise Interceptor', () => {
  let interceptor: any = null;

  beforeEach(() => {
    interceptor = new EnterpriseInterceptor();
  });

  it('EnterpriseInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });

  it('EnterpriseInterceptor create : success', async () => {
    const result = await interceptor.intercept(
      invocationContextCreateEnterprise,
      () => {},
    );
    expect(result).to.Null;
  });

  it('EnterpriseInterceptor create : error 422 when bad email format provided', async () => {
    try {
      await interceptor.intercept(invocationContextCreateEnterpriseBadFormat);
    } catch (err) {
      expect(err).to.deepEqual(errorBadEmailFormat);
    }
  });
});

const errorBadEmailFormat: any = new ValidationError(
  'Enterprise email formats are not valid',
  '/enterpriseEmailBadFormat',
  StatusCode.UnprocessableEntity,
);

const invocationContextCreateEnterprise = {
  target: {},
  methodName: 'create',
  args: [
    {
      name: 'Capgemini',
      siretNumber: 33070384400036,
      emailFormat: ['@professional.com'],
      employeesCount: 200000,
      budgetAmount: 300000,
      isHris: false,
    },
  ],
};

const invocationContextCreateEnterpriseBadFormat = {
  target: {},
  methodName: 'create',
  args: [
    {
      name: 'Capgemini',
      siretNumber: 33070384400036,
      emailFormat: ['bademailformat'],
      employeesCount: 200000,
      budgetAmount: 300000,
      isHris: false,
    },
  ],
};

import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import {ValidationError} from 'jsonschema';
import {securityId} from '@loopback/security';

import {FunderInterceptor} from '../../interceptors';
import {Enterprise, EnterpriseDetails, Funder, PrivateKeyAccess} from '../../models';
import {FunderRepository} from '../../repositories';
import {FunderService} from '../../services';
import {FUNDER_TYPE, IUser, StatusCode} from '../../utils';

describe('FunderInterceptor', () => {
  let interceptor: any = null;
  let funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>,
    funderService: StubbedInstanceWithSinonAccessor<FunderService>,
    currentUser: IUser;

  beforeEach(() => {
    givenStubbed();
    interceptor = new FunderInterceptor(funderRepository, funderService, currentUser);
  });

  function givenStubbed() {
    funderRepository = createStubInstance(FunderRepository);
    funderService = createStubInstance(FunderService);
    currentUser = {
      id: 'citizenId',
      groups: ['funder'],
      roles: ['financeurs'],
      clientName: 'funder-backend',
      emailVerified: true,
      [securityId]: 'citizenId',
    };
  }

  it('FunderInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });

  it('FunderInterceptor create: KO already exists', async () => {
    try {
      const invocationContextCreateKO = {
        target: {},
        methodName: 'create',
        args: [funderEnterpriseKOOptions],
      };
      funderRepository.stubs.findOne.resolves(funderEnterprise);
      await interceptor.intercept(invocationContextCreateKO);
    } catch (err) {
      expect(err.message).to.equal('funder.name.error.unique');
      expect(err.statusCode).to.equal(StatusCode.Conflict);
    }
  });

  it('FunderInterceptor create: KO validation schema', async () => {
    try {
      const invocationContextCreateKO = {
        target: {},
        methodName: 'create',
        args: [funderEnterpriseKOOptions],
      };
      funderRepository.stubs.findOne.resolves(undefined);
      funderService.stubs.validateSchema.returns([
        new ValidationError('error.schema', '', undefined, ['error.schema']),
      ]);
      await interceptor.intercept(invocationContextCreateKO);
    } catch (err) {
      expect(err.message).to.equal('error.schema');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('FunderInterceptor create: KO isHris and hasManualAffiliation', async () => {
    try {
      const invocationContextCreateKO = {
        target: {},
        methodName: 'create',
        args: [funderEnterpriseKOOptions],
      };
      funderRepository.stubs.findOne.resolves(undefined);
      funderService.stubs.validateSchema.returns([]);
      await interceptor.intercept(invocationContextCreateKO);
    } catch (err) {
      expect(err.message).to.equal('enterprise.options.invalid');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('FunderInterceptor create: KO email invalid', async () => {
    try {
      const invocationContextCreateKO = {
        target: {},
        methodName: 'create',
        args: [funderEnterpriseKOEmail],
      };
      funderRepository.stubs.findOne.resolves(undefined);
      funderService.stubs.validateSchema.returns([]);
      await interceptor.intercept(invocationContextCreateKO);
    } catch (err) {
      expect(err.message).to.equal('Enterprise email formats are not valid');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('FunderInterceptor create: OK', async () => {
    const invocationContextCreateOK = {
      target: {},
      methodName: 'create',
      args: [funderEnterprise],
    };
    funderRepository.stubs.findOne.resolves(undefined);
    funderService.stubs.validateSchema.returns([]);
    const result = await interceptor.intercept(invocationContextCreateOK, () => {});
    expect(result).to.Null;
  });

  it('FunderInterceptor storeEncryptionKey : asserts error happens when no funder found', async () => {
    try {
      funderRepository.stubs.findById.resolves(undefined);
      await interceptor.intercept(invocationContextStoreEncryptionKey);
    } catch (err) {
      expect(err.message).to.equal('Funder not found');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('FunderInterceptor storeEncryptionKey : access denied other funder', async () => {
    try {
      funderRepository.stubs.findById.resolves(funderEnterpriseKOClient);
      await interceptor.intercept(invocationContextStoreEncryptionKey);
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('FunderInterceptor encryption_key : error no privateKeyAccess provided', async () => {
    try {
      funderRepository.stubs.findById.resolves(funderEnterprise);
      await interceptor.intercept(invocationContextStoreEncryptionKeyNoPrivateKeyAccess);
    } catch (error) {
      expect(error.message).to.equal('encryptionKey.error.privateKeyAccess.missing');
      expect(error.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('FunderInterceptor encryption_key : error not Hris and no privateKeyAccess provided', async () => {
    try {
      funderRepository.stubs.findById.resolves(funderEnterprise);
      await interceptor.intercept(invocationContextStoreEncryptionKeyNoPrivateKeyAccess);
    } catch (error) {
      expect(error.message).to.equal('encryptionKey.error.privateKeyAccess.missing');
      expect(error.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('FunderInterceptor encryption_key : asserts encryption key has been stored for funder', async () => {
    funderRepository.stubs.findById.resolves(funderEnterprise);
    const result = await interceptor.intercept(invocationContextStoreEncryptionKey, () => {});
    expect(result).to.Null;
  });

  it('FunderInterceptor storeEncryptionKey : key stored hris without privateKeyAccess', async () => {
    funderRepository.stubs.findById.resolves(funderEnterpriseSIRH);
    const result = await interceptor.intercept(
      invocationContextStoreEncryptionKeyNoPrivateKeyAccess,
      () => {},
    );
    expect(result).to.Null;
  });

  it('FunderInterceptor encryption_key : encryption key stored for enterprise hris', async () => {
    funderRepository.stubs.findById.resolves(funderEnterpriseSIRH);
    const result = await interceptor.intercept(invocationContextStoreEncryptionKey, () => {});
    expect(result).to.Null;
  });

  it('FunderInterceptor find : request fields error ', async () => {
    try {
      await interceptor.intercept(invocationContextFindKORequestFields);
    } catch (err) {
      expect(err.message).to.equal('find.error.requested.fields');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('FunderInterceptor find : OK ', async () => {
    const result = await interceptor.intercept(invocationContextFindOK, () => {});
    expect(result).to.Null;
  });

  it('FunderInterceptor findById : not found ', async () => {
    try {
      funderRepository.stubs.findOne.resolves(undefined);
      await interceptor.intercept(invocationContextFindById);
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('FunderInterceptor getCitizens : funder not found ', async () => {
    try {
      funderRepository.stubs.getFunderByNameAndType.resolves(null);
      await interceptor.intercept(invocationContextGetCitizens);
    } catch (err) {
      expect(err.message).to.equal('Funder not found');
      expect(err.statusCode).to.equal(StatusCode.NotFound);
    }
  });

  it('FunderInterceptor getCitizens : funder ID is not matched', async () => {
    const funder: Funder = {
      id: 'funderId',
      type: FUNDER_TYPE.ENTERPRISE,
      name: 'funder',
    } as Funder;

    try {
      funderRepository.stubs.getFunderByNameAndType.resolves(funder);
      await interceptor.intercept(invocationContextGetCitizensDifferentId);
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('FunderInterceptor getCitizens : OK', async () => {
    const funder: Funder = {
      id: 'funderId',
      type: FUNDER_TYPE.ENTERPRISE,
      name: 'funder',
    } as Funder;
    funderRepository.stubs.getFunderByNameAndType.resolves(funder);

    const result = await interceptor.intercept(invocationContextGetCitizens, () => {});

    expect(result).to.not.be.null();
  });
});

const funderEnterprise: Funder = new Enterprise({
  id: 'funderEnterpriseId',
  type: FUNDER_TYPE.ENTERPRISE,
  name: 'funder',
  mobilityBudget: 1110000,
  clientId: 'funder-backend',

  enterpriseDetails: new EnterpriseDetails({
    isHris: false,
    hasManualAffiliation: false,
    emailDomainNames: ['@example.com'],
  }),
}) as Funder;

const funderEnterpriseKOClient: Funder = new Enterprise({
  id: 'funderEnterpriseId',
  type: FUNDER_TYPE.ENTERPRISE,
  name: 'Capgemini',
  mobilityBudget: 1110000,
  enterpriseDetails: new EnterpriseDetails({
    isHris: false,
    hasManualAffiliation: false,
    emailDomainNames: ['@example.com'],
  }),
}) as Funder;

const funderEnterpriseSIRH: Funder = new Enterprise({
  id: 'funderEnterpriseId',
  type: FUNDER_TYPE.ENTERPRISE,
  name: 'funder',
  mobilityBudget: 1110000,
  clientId: 'enterprise-client',

  enterpriseDetails: new EnterpriseDetails({
    isHris: true,
    hasManualAffiliation: false,
    emailDomainNames: ['@example.com'],
  }),
}) as Funder;

const funderEnterpriseKOOptions: Funder = new Enterprise({
  id: 'funderEnterpriseId',
  type: FUNDER_TYPE.ENTERPRISE,
  name: 'Capgemini',
  mobilityBudget: 1110000,
  clientId: 'enterprise-client',

  enterpriseDetails: new EnterpriseDetails({
    isHris: true,
    hasManualAffiliation: true,
    emailDomainNames: ['@example.com'],
  }),
}) as Funder;

const funderEnterpriseKOEmail: Funder = new Enterprise({
  id: 'funderEnterpriseId',
  type: FUNDER_TYPE.ENTERPRISE,
  name: 'Capgemini',
  mobilityBudget: 1110000,
  clientId: 'enterprise-client',

  enterpriseDetails: new EnterpriseDetails({
    isHris: false,
    hasManualAffiliation: false,
    emailDomainNames: ['erreurEmail'],
  }),
}) as Funder;

const today = new Date();
const expirationDate = new Date(today.setMonth(today.getMonth() + 7));
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApkUKTww771tjeFsYFCZq
n76SSpOzolmtf9VntGlPfbP5j1dEr6jAuTthQPoIDaEed6P44yyL3/1GqWJMgRbf
n8qqvnu8dH8xB+c9+er0tNezafK9eK37RqzsTj7FNW2Dpk70nUYncTiXxjf+ofLq
sokEIlp2zHPEZce2o6jAIoFOV90MRhJ4XcCik2w3IljxdJSIfBYX2/rDgEVN0T85
OOd9ChaYpKCPKKfnpvhjEw+KdmzUFP1u8aao2BNKyI2C+MHuRb1wSIu2ZAYfHgoG
X6FQc/nXeb1cAY8W5aUXOP7ITU1EtIuCD8WuxXMflS446vyfCmJWt+OFyveqgJ4n
owIDAQAB
-----END PUBLIC KEY-----
`;

const invocationContextStoreEncryptionKey = {
  target: {},
  methodName: 'storeEncryptionKey',
  args: [
    'id',
    {
      id: '62977dc80929474f84c403de',
      publicKey,
      expirationDate,
      lastUpdateDate: new Date(),
      privateKeyAccess: new PrivateKeyAccess({
        loginURL: 'loginURL',
        getKeyURL: 'getKeyURL',
      }),
    },
  ],
};

const invocationContextStoreEncryptionKeyNoPrivateKeyAccess = {
  target: {},
  methodName: 'storeEncryptionKey',
  args: [
    'id',
    {
      id: '62977dc80929474f84c403de',
      publicKey,
      expirationDate,
      lastUpdateDate: new Date(),
    },
  ],
};

const invocationContextFindKORequestFields = {
  target: {},
  methodName: 'find',
  args: [
    {
      fields: {enterpriseDetails: true},
    },
  ],
};

const invocationContextFindOK = {
  target: {},
  methodName: 'find',
  args: [
    {
      fields: {name: true},
    },
  ],
};

const invocationContextFindById = {
  target: {},
  methodName: 'findById',
  args: ['id'],
};

const invocationContextGetCitizens = {
  target: {},
  methodName: 'getCitizens',
  args: ['funderId'],
};

const invocationContextGetCitizensDifferentId = {
  target: {},
  methodName: 'getCitizens',
  args: ['differentFunderId'],
};

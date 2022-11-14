import {
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
  createStubInstance,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {CollectivityRepository, EnterpriseRepository} from '../../repositories';
import {ValidationError} from '../../validationError';
import {IUser, ResourceName, StatusCode} from '../../utils';
import {FunderInterceptor} from '../../interceptors/funder.interceptor';
import {Collectivity, EncryptionKey, Enterprise, PrivateKeyAccess} from '../../models';

describe('FunderInterceptor', () => {
  let interceptor: any = null;
  let collectivityRepository: StubbedInstanceWithSinonAccessor<CollectivityRepository>,
    currentUser: IUser,
    enterpriseRepository: StubbedInstanceWithSinonAccessor<EnterpriseRepository>;

  beforeEach(() => {
    givenStubbedService();
    interceptor = new FunderInterceptor(
      collectivityRepository,
      enterpriseRepository,
      currentUser,
    );
  });

  it('FunderInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });
  it('storeEncryptionKey : asserts error happens when no funder found', async () => {
    const error = new ValidationError(
      `Funder not found`,
      `/Funder`,
      StatusCode.NotFound,
      ResourceName.Funder,
    );
    try {
      enterpriseRepository.stubs.findOne.resolves(undefined);
      collectivityRepository.stubs.findOne.resolves(undefined);
      await interceptor.intercept(invocationContextStoreEncryptionKey);
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('storeEncryptionKey : access denied when saving encryption_key for an other funder', async () => {
    const error = new ValidationError(
      'Access denied',
      '/authorization',
      StatusCode.Forbidden,
    );
    try {
      enterpriseRepository.stubs.findOne.resolves(undefined);
      collectivityRepository.stubs.findOne.resolves(mockOtherEnterpise);
      await interceptor.intercept(invocationContextStoreEncryptionKey);
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
  });

  it('encryption_key : error when collectivity and no privateKeyAccess provided', async () => {
    const privateKeyAccessmissingError = new ValidationError(
      `encryptionKey.error.privateKeyAccess.missing`,
      '/EncryptionKey',
      StatusCode.UnprocessableEntity,
    );
    try {
      enterpriseRepository.stubs.findOne.resolves(undefined);
      collectivityRepository.stubs.findOne.resolves(mockCollectivity);
      await interceptor.intercept(invocationContextStoreEncryptionKeyNoPrivateKeyAccess);
    } catch (error) {
      expect(error).to.deepEqual(privateKeyAccessmissingError);
    }
  });

  it('encryption_key : error when enterprise not Hris and no privateKeyAccess provided', async () => {
    const privateKeyAccessmissingError = new ValidationError(
      `encryptionKey.error.privateKeyAccess.missing`,
      '/EncryptionKey',
      StatusCode.UnprocessableEntity,
    );
    try {
      enterpriseRepository.stubs.findOne.resolves(mockEnterprise);
      collectivityRepository.stubs.findOne.resolves(undefined);
      await interceptor.intercept(invocationContextStoreEncryptionKeyNoPrivateKeyAccess);
    } catch (error) {
      expect(error).to.deepEqual(privateKeyAccessmissingError);
    }
  });

  it('encryption_key : asserts encryption key has been stored for collectivity', async () => {
    collectivityRepository.stubs.findOne.resolves(mockCollectivity2);
    enterpriseRepository.stubs.create.resolves(undefined);
    const result = await interceptor.intercept(
      invocationContextStoreEncryptionKey,
      () => {},
    );
    expect(result).to.Null;
  });

  it('encryption_key : asserts encryption key has been stored for enterprise', async () => {
    collectivityRepository.stubs.findOne.resolves(undefined);
    enterpriseRepository.stubs.findOne.resolves(mockEnterprise);
    const result = await interceptor.intercept(
      invocationContextStoreEncryptionKey,
      () => {},
    );
    expect(result).to.Null;
  });

  it('storeEncryptionKey : encryption key stored for enterprise hris without privateKeyAccess', async () => {
    collectivityRepository.stubs.findOne.resolves(undefined);
    enterpriseRepository.stubs.findOne.resolves(mockEnterpriseHris);
    const result = await interceptor.intercept(
      invocationContextStoreEncryptionKeyNoPrivateKeyAccess,
      () => {},
    );
    expect(result).to.Null;
  });

  it('encryption_key : asserts encryption key has been stored for enterprise hris', async () => {
    collectivityRepository.stubs.findOne.resolves(undefined);
    enterpriseRepository.stubs.findOne.resolves(mockEnterpriseHris);
    const result = await interceptor.intercept(
      invocationContextStoreEncryptionKey,
      () => {},
    );
    expect(result).to.Null;
  });

  function givenStubbedService() {
    collectivityRepository = createStubInstance(CollectivityRepository);
    enterpriseRepository = createStubInstance(EnterpriseRepository);
    currentUser = {
      id: 'citizenId',
      groups: ['funder'],
      clientName: 'funder-backend',
      emailVerified: true,
      [securityId]: 'citizenId',
    };
  }

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

  const mockencryptionKeyValid = new EncryptionKey({
    id: '62977dc80929474f84c403de',
    version: 1,
    publicKey,
    expirationDate,
    lastUpdateDate: new Date(),
    privateKeyAccess: new PrivateKeyAccess({
      loginURL: 'loginURL',
      getKeyURL: 'getKeyURL',
    }),
  });

  const mockCollectivity2 = new Collectivity({
    id: '2b6ee373-4c5b-403b-afe5-3bf3cbd2473c',
    name: 'funder',
    citizensCount: 1,
    mobilityBudget: 1,
    encryptionKey: mockencryptionKeyValid,
  });

  const mockCollectivity = new Collectivity({
    id: 'randomInputIdCollectivity',
    name: 'funder',
    citizensCount: 10,
    mobilityBudget: 12,
    encryptionKey: mockencryptionKeyValid,
  });
  const mockEnterprise = new Enterprise({
    id: 'randomInputIdEnterprise',
    emailFormat: ['test@outlook.com', 'test@outlook.fr', 'test@outlook.xxx'],
    name: 'funder',
    siretNumber: 50,
    employeesCount: 2345,
    budgetAmount: 102,
  });

  const mockEnterpriseHris = new Enterprise({
    id: 'randomInputIdEnterprise',
    emailFormat: ['test@outlook.com', 'test@outlook.fr', 'test@outlook.xxx'],
    name: 'funder',
    siretNumber: 50,
    employeesCount: 2345,
    budgetAmount: 102,
    isHris: true,
  });

  const mockOtherEnterpise = new Enterprise({
    id: 'randomInputIdEnterprise',
    emailFormat: ['test@outlook.com', 'test@outlook.fr', 'test@outlook.xxx'],
    name: 'funder-other',
    siretNumber: 50,
    employeesCount: 2345,
    budgetAmount: 102,
    isHris: false,
  });

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
});

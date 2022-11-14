import {
  createStubInstance,
  expect,
  StubbedInstanceWithSinonAccessor,
  sinon,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {AffiliationPublicInterceptor} from '../../interceptors';
import {ValidationError} from '../../validationError';
import {IncentiveRepository} from '../../repositories';
import {Incentive, Territory} from '../../models';
import {IUser, ResourceName, StatusCode} from '../../utils';

describe('affiliation Interceptor', () => {
  let interceptor: any = null;
  let interceptor2: any = null;
  let currentUserProfile: IUser,
    otherUser: IUser,
    incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>;

  beforeEach(() => {
    givenStubbedRepository();
    givenStubbedRepository2();
    interceptor = new AffiliationPublicInterceptor(
      incentiveRepository,
      currentUserProfile,
    );
    interceptor2 = new AffiliationPublicInterceptor(incentiveRepository, otherUser);
  });
  const error = new ValidationError(
    'Access denied',
    '/authorization',
    StatusCode.Forbidden,
  );

  const errorNotFound = new ValidationError(
    `Incentive not found`,
    '/incentiveNotFound',
    StatusCode.NotFound,
    ResourceName.Incentive,
  );

  it('AffiliationInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });

  it('AffiliationInterceptor find id incentive territoire"', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(mockPublicIncentive);

      await interceptor.intercept(invocationCtxFindId, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
    incentiveRepository.stubs.findOne.restore();
  });

  it('AffiliationInterceptor find id incentive error"', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(mockPrivateIncentive);

      await interceptor.intercept(invocationCtxFindId, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
    incentiveRepository.stubs.findOne.restore();
  });

  it('AffiliationInterceptor find id incentive error2"', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(mockPrivateIncentive);

      await interceptor2.intercept(invocationCtxFindId2, () => {});
    } catch (err) {
      expect(err).to.deepEqual(error);
    }
    incentiveRepository.stubs.findOne.restore();
  });

  it('AffiliationInterceptor find id incentive not found"', async () => {
    try {
      incentiveRepository.stubs.findOne.resolves(null);

      await interceptor2.intercept(invocationCtxFindId2, () => {});
    } catch (err) {
      expect(err).to.deepEqual(errorNotFound);
    }
    incentiveRepository.stubs.findOne.restore();
  });

  function givenStubbedRepository() {
    incentiveRepository = createStubInstance(IncentiveRepository);
    currentUserProfile = {
      id: 'testId',
      clientName: 'testName-client',
      emailVerified: true,
      [securityId]: 'testId',
      roles: ['maas', 'service_maas'],
    };
  }
  function givenStubbedRepository2() {
    incentiveRepository = createStubInstance(IncentiveRepository);
    otherUser = {
      id: 'testId',
      clientName: 'testName-client',
      emailVerified: true,
      [securityId]: 'testId',
      roles: ['maas'],
    };
  }
});

const invocationCtxFindId = {
  methodName: 'findIncentiveById',
  args: ['606c236a624cec2becdef277'],
};

const invocationCtxFindId2 = {
  methodName: 'findIncentiveById',
  args: ['1111111'],
};

const mockPublicIncentive = new Incentive({
  territory: {name: 'Toulouse', id: 'randomTerritoryId'} as Territory,
  additionalInfos: 'test',
  funderName: 'Mairie',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'incentive pour acheter vélo électrique',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef277',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
});

const mockPrivateIncentive = new Incentive({
  territory: {name: 'Toulouse', id: 'randomTerritoryId'} as Territory,
  additionalInfos: 'test',
  funderName: 'Mairie',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'incentive pour acheter vélo électrique',
  incentiveType: 'AideEmployeur',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef277',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
  funderId: 'funderId',
});

import {createStubInstance, expect, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import {AnyObject} from '@loopback/repository';
import {securityId} from '@loopback/security';

import {DashboardController} from '../../controllers';
import {FunderRepository, SubscriptionRepository, UserRepository} from '../../repositories';
import {Enterprise, Funder, Subscription, User} from '../../models';
import {FUNDER_TYPE, IUser, SUBSCRIPTION_STATUS} from '../../utils';

describe('Dashboard Controller', () => {
  let subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>;

  beforeEach(() => {
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    userRepository = createStubInstance(UserRepository);
    funderRepository = createStubInstance(FunderRepository);
  });

  it('get(/v1/dashboards/citizens) success', done => {
    const controller = new DashboardController(
      subscriptionRepository,
      userRepository,
      funderRepository,
      currentUser,
    );

    userRepository.stubs.findOne.resolves(mockUser);
    funderRepository.stubs.getFunderByNameAndType.resolves(mockFunder);

    subscriptionRepository.stubs.find.resolves([mockSubscriptions1, mockSubscriptions2, mockSubscriptions3]);

    const citizenDashboardService = controller
      .findCitizen('2020', 'all')
      .then(res => res)
      .catch(err => err);

    expect(citizenDashboardService).to.deepEqual(mockSubscriptionDashboardResult);
    done();
  });

  it('get(/v1/dashboards/citizens) error', done => {
    const controller = new DashboardController(
      subscriptionRepository,
      userRepository,
      funderRepository,
      currentUser,
    );
    funderRepository.stubs.getFunderByNameAndType.resolves(mockFunder);

    subscriptionRepository.stubs.find.rejects(mockSubscriptionDashboardError);

    const citizenDashboardService = controller
      .findCitizen('2020', 'all')
      .then(res => res)
      .catch(err => err);

    expect(citizenDashboardService).to.deepEqual(mockSubscriptionDashboardError);
    done();
  });

  it('get(/v1/dashboards/subscriptions) no semester success', done => {
    const controller = new DashboardController(
      subscriptionRepository,
      userRepository,
      funderRepository,
      currentUser,
    );

    userRepository.stubs.findOne.resolves(mockUser);
    funderRepository.stubs.getFunderByNameAndType.resolves(mockFunder);

    subscriptionRepository.stubs.find.resolves([mockSubscriptions1, mockSubscriptions2, mockSubscriptions3]);

    const subscriptionDashboardResult = controller
      .find('2019', 'all')
      .then(res => res)
      .catch(err => err);

    expect(subscriptionDashboardResult).to.deepEqual(mockSubscriptionDashboardResult);
    done();
  });

  it('get(/v1/dashboards/subscriptions) semester 1 success', done => {
    const controller = new DashboardController(
      subscriptionRepository,
      userRepository,
      funderRepository,
      currentUser,
    );

    userRepository.stubs.findOne.resolves(mockUser);
    funderRepository.stubs.getFunderByNameAndType.resolves(mockFunder);

    subscriptionRepository.stubs.find.resolves([mockSubscriptions1, mockSubscriptions2, mockSubscriptions3]);

    const subscriptionDashboardResult = controller
      .find('2019', '1')
      .then(res => res)
      .catch(err => err);

    expect(subscriptionDashboardResult).to.deepEqual(mockSubscriptionDashboardResult);
    done();
  });

  it('get(/v1/dashboards/subscriptions) semester 2 success', done => {
    const controller = new DashboardController(
      subscriptionRepository,
      userRepository,
      funderRepository,
      currentUser,
    );

    userRepository.stubs.findOne.resolves(mockUser);
    funderRepository.stubs.getFunderByNameAndType.resolves(mockFunder);

    subscriptionRepository.stubs.find.resolves([mockSubscriptions1, mockSubscriptions2, mockSubscriptions3]);

    const subscriptionDashboardResult = controller
      .find('2019', '2')
      .then(res => res)
      .catch(err => err);

    expect(subscriptionDashboardResult).to.deepEqual(mockSubscriptionDashboardResult);
    done();
  });

  it('get(/v1/dashboards/subscriptions) Brouillon success', done => {
    const controller = new DashboardController(
      subscriptionRepository,
      userRepository,
      funderRepository,
      currentUser,
    );

    userRepository.stubs.findOne.resolves(mockUser);
    funderRepository.stubs.getFunderByNameAndType.resolves(mockFunder);

    subscriptionRepository.stubs.find.resolves([mockSubscriptions1, mockSubscriptions2, mockSubscriptions3]);

    const subscriptionDashboardResult = controller
      .find('2019', '2')
      .then(res => res)
      .catch(err => err);

    expect(subscriptionDashboardResult).to.deepEqual(mockSubscriptionDashboardResult);
    done();
  });

  it('get(/v1/dashboards/subscriptions) error', done => {
    const controller = new DashboardController(
      subscriptionRepository,
      userRepository,
      funderRepository,
      currentUser,
    );

    userRepository.stubs.findOne.resolves(mockUser);
    funderRepository.stubs.getFunderByNameAndType.resolves(mockFunder);

    subscriptionRepository.stubs.find.resolves([mockSubscriptions1, mockSubscriptions2, mockSubscriptions3]);

    const subscriptionDashboardResult = controller.find('2019', '2');

    expect(subscriptionDashboardResult).to.deepEqual(mockSubscriptionDashboardError);
    done();
  });

  it('get(/v1/dashboards/subscriptions) ERROR', async () => {
    const controller = new DashboardController(
      subscriptionRepository,
      userRepository,
      funderRepository,
      currentUser,
    );

    try {
      userRepository.stubs.findOne.rejects(new Error('Error'));
      await controller.find('2019', '2');
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
  });
});

const mockSubscriptionDashboardResult: Promise<AnyObject> = new Promise(() => {
  return [
    {
      status: '0',
      count: '3',
    },
    {
      status: '1',
      count: '2',
    },
  ];
});

const mockSubscriptionDashboardError: Promise<AnyObject> = new Promise(() => {
  throw new Error('error');
});

const mockSubscriptions1 = new Subscription({
  id: 'randomInputId1',
  incentiveId: 'incentiveId1',
  funderId: 'randomFunderId',
  incentiveType: 'AideEmployeur',
  incentiveTitle: 'incentiveTitle',
  citizenId: '7654321',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  consent: true,
  incentiveTransportList: ['velo'],
  status: SUBSCRIPTION_STATUS.TO_PROCESS,
  communityId: 'id1',
  createdAt: new Date('2021-04-06T09:01:30.778Z'),
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
});

const mockSubscriptions2 = new Subscription({
  id: 'randomInputId2',
  incentiveId: 'incentiveId1',
  funderId: 'randomFunderId',
  incentiveType: 'AideEmployeur',
  incentiveTitle: 'incentiveTitle',
  citizenId: '1234567',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  consent: true,
  incentiveTransportList: ['velo'],
  status: SUBSCRIPTION_STATUS.TO_PROCESS,
  communityId: 'id1',
  createdAt: new Date('2021-04-06T09:01:30.778Z'),
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
});

const mockSubscriptions3 = new Subscription({
  id: 'randomInputId3',
  incentiveId: 'incentiveId2',
  funderId: 'randomFunderId',
  incentiveType: 'AideEmployeur',
  incentiveTitle: 'incentiveTitle',
  citizenId: '1234567',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  consent: true,
  incentiveTransportList: ['velo'],
  status: SUBSCRIPTION_STATUS.TO_PROCESS,
  communityId: 'id1',
  createdAt: new Date('2021-04-06T09:01:30.778Z'),
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
});

const currentUser: IUser = {
  id: 'idEnterprise',
  emailVerified: true,
  maas: undefined,
  membership: ['/entreprises/Capgemini'],
  roles: ['gestionnaires'],
  [securityId]: 'idEnterprise',
};

const mockUser = new User({
  id: 'idUser',
  email: 'random@random.fr',
  firstName: 'firstName',
  lastName: 'lastName',
  funderId: 'randomFunderId',
  roles: ['gestionnaires'],
  communityIds: ['id1', 'id2'],
});

const mockFunder = new Enterprise({
  id: 'randomFunderId',
  name: 'funderName',
  type: FUNDER_TYPE.ENTERPRISE,
}) as Funder;

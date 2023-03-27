import {createStubInstance, expect, StubbedInstanceWithSinonAccessor, sinon} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {AffiliationInterceptor} from '../../interceptors';
import {FunderRepository, IncentiveRepository, SubscriptionRepository} from '../../repositories';
import {CitizenService} from '../../services';
import {Affiliation, Incentive, Citizen, Subscription, Funder} from '../../models';
import {AFFILIATION_STATUS, FUNDER_TYPE, IUser, Roles, StatusCode} from '../../utils';

describe('affiliation Interceptor', () => {
  let interceptor: any = null;
  let incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>,
    currentUserProfile: IUser,
    citizenService: StubbedInstanceWithSinonAccessor<CitizenService>,
    subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>;

  beforeEach(() => {
    givenStubbedRepository();
    interceptor = new AffiliationInterceptor(
      incentiveRepository,
      subscriptionRepository,
      funderRepository,
      citizenService,
      currentUserProfile,
    );
  });

  it('AffiliationInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });
  it('AffiliationInterceptor: error"', async () => {
    try {
      funderRepository.stubs.findById.resolves(
        new Funder({type: FUNDER_TYPE.COLLECTIVITY, name: 'maasName'}),
      );

      citizenService.stubs.getCitizenWithAffiliationById.resolves(undefined);

      await interceptor.intercept(invocationCtx, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }

    funderRepository.stubs.findById.restore();
    citizenService.stubs.getCitizenWithAffiliationById.restore();
  });

  it('AffiliationInterceptor Create Subscription: error"', async () => {
    try {
      const incentive = new Incentive({id: '78952215', funderId: 'someFunderId'});
      funderRepository.stubs.findById.resolves(
        new Funder({type: FUNDER_TYPE.COLLECTIVITY, name: 'maasName'}),
      );

      incentiveRepository.stubs.findOne.resolves(incentive);

      citizenService.stubs.getCitizenWithAffiliationById.resolves(undefined);

      await interceptor.intercept(invocationCtxCreateSubscription, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }

    funderRepository.stubs.findById.restore();
    citizenService.stubs.getCitizenWithAffiliationById.restore();
    incentiveRepository.stubs.findOne.restore();
  });

  it('AffiliationInterceptor Create Subscription: error 2"', async () => {
    try {
      funderRepository.stubs.findById.resolves(
        new Funder({type: FUNDER_TYPE.COLLECTIVITY, name: 'maasName'}),
      );

      incentiveRepository.stubs.findOne.resolves(null);

      citizenService.stubs.getCitizenWithAffiliationById.resolves(undefined);

      await interceptor.intercept(invocationCtxCreateSubscription2, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }

    funderRepository.stubs.findById.restore();
    citizenService.stubs.getCitizenWithAffiliationById.restore();
    incentiveRepository.stubs.findOne.restore();
  });

  it('AffiliationInterceptor add files: error"', async () => {
    try {
      const subscription = new Subscription({id: '5654555', incentiveId: '5854235'});
      const incentive = new Incentive({id: '78952215', funderId: 'someFunderId'});

      funderRepository.stubs.findById.resolves(
        new Funder({type: FUNDER_TYPE.COLLECTIVITY, name: 'maasName'}),
      );

      incentiveRepository.stubs.findOne.resolves(incentive);
      subscriptionRepository.stubs.findOne.resolves(subscription);

      citizenService.stubs.getCitizenWithAffiliationById.resolves(undefined);

      await interceptor.intercept(invocationCtxAddFiles, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }

    funderRepository.stubs.findById.restore();
    citizenService.stubs.getCitizenWithAffiliationById.restore();
    incentiveRepository.stubs.findOne.restore();
    subscriptionRepository.stubs.findOne.restore();
  });

  it('AffiliationInterceptor add files: error 2"', async () => {
    try {
      const subscription = new Subscription({id: '5654555'});
      const incentive = new Incentive({id: '78952215'});

      funderRepository.stubs.findById.resolves(
        new Funder({type: FUNDER_TYPE.COLLECTIVITY, name: 'maasName'}),
      );

      incentiveRepository.stubs.findOne.resolves(incentive);
      subscriptionRepository.stubs.findOne.resolves(subscription);

      citizenService.stubs.getCitizenWithAffiliationById.resolves(undefined);

      await interceptor.intercept(invocationCtxAddFiles, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }

    funderRepository.stubs.findById.restore();
    citizenService.stubs.getCitizenWithAffiliationById.restore();
    subscriptionRepository.stubs.findOne.restore();
    incentiveRepository.stubs.findOne.restore();
  });

  it('AffiliationInterceptor: OK', async () => {
    funderRepository.stubs.findById.resolves(
      new Funder({id: 'testFunder', type: FUNDER_TYPE.COLLECTIVITY, name: 'maasName'}),
    );

    const affiliation = new Affiliation(
      Object.assign({enterpriseId: 'funderId', enterpriseEmail: 'test@test.com'}),
    );
    affiliation.status = AFFILIATION_STATUS.AFFILIATED;

    const citizen = new Citizen({
      affiliation,
    });
    citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);

    const result = await interceptor.intercept(invocationCtx, () => {});
    expect(result).to.Null;

    funderRepository.stubs.findById.restore();
    citizenService.stubs.getCitizenWithAffiliationById.restore();
  });

  it('AffiliationInterceptor find id incentive territory"', async () => {
    try {
      funderRepository.stubs.findById.resolves(
        new Funder({type: FUNDER_TYPE.COLLECTIVITY, name: 'maasName'}),
      );

      const affiliation = new Affiliation(
        Object.assign({enterpriseId: 'funderId', enterpriseEmail: 'test@test.com'}),
      );
      const citizen = new Citizen({
        affiliation,
      });

      incentiveRepository.stubs.findOne.resolves(mockPublicIncentive);

      citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);

      await interceptor.intercept(invocationCtxFindId, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }

    funderRepository.stubs.findById.restore();
    citizenService.stubs.getCitizenWithAffiliationById.restore();
    incentiveRepository.stubs.findOne.restore();
  });

  it('AffiliationInterceptor find id incentive"', async () => {
    try {
      funderRepository.stubs.findById.resolves(
        new Funder({type: FUNDER_TYPE.COLLECTIVITY, name: 'maasName'}),
      );

      const affiliation = new Affiliation(
        Object.assign({enterpriseId: 'funderId', enterpriseEmail: 'test@test.com'}),
      );
      const citizen = new Citizen({
        affiliation,
      });

      incentiveRepository.stubs.findOne.resolves(mockPrivateIncentive);

      citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);

      await interceptor.intercept(invocationCtxFindId, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }

    funderRepository.stubs.findById.restore();
    citizenService.stubs.getCitizenWithAffiliationById.restore();
    incentiveRepository.stubs.findOne.restore();
  });

  it('AffiliationInterceptor findIncentiveById as content_editor with employer incentive"', async () => {
    const contentEditor = currentUserProfile;
    contentEditor.roles = [Roles.CONTENT_EDITOR];

    incentiveRepository.stubs.findOne.resolves(mockPrivateIncentive);

    const result = await interceptor.intercept(invocationCtxFindId, () => {});
    expect(result).to.Null;
    incentiveRepository.stubs.findOne.restore();
  });

  it('AffiliationInterceptor findIncentiveById incentive not found"', async () => {
    try {
      const contentEditor = currentUserProfile;
      contentEditor.roles = [Roles.CONTENT_EDITOR];

      incentiveRepository.stubs.findOne.resolves(undefined);
      await interceptor.intercept(invocationCtxFindId, () => {});
    } catch (err) {
      expect(err.message).to.equal('Incentive not found');
      expect(err.statusCode).to.equal(StatusCode.NotFound);
    }
  });

  it('AffiliationInterceptor addAttachments: subscription not found', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationCtxAddAttachments, () => {});
    } catch (err) {
      expect(err.message).to.equal('Subscription not found');
      expect(err.statusCode).to.equal(StatusCode.NotFound);
    }
    incentiveRepository.stubs.findOne.restore();
  });

  it('AffiliationInterceptor finalizeSubscription: subscription not found', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationCtxFinalizeSubscription, () => {});
    } catch (err) {
      expect(err.message).to.equal('Subscription not found');
      expect(err.statusCode).to.equal(StatusCode.NotFound);
    }
    incentiveRepository.stubs.findOne.restore();
  });

  function givenStubbedRepository() {
    citizenService = createStubInstance(CitizenService);
    incentiveRepository = createStubInstance(IncentiveRepository);
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    funderRepository = createStubInstance(FunderRepository);
    currentUserProfile = {
      id: 'testId',
      clientName: 'testName-client',
      emailVerified: true,
      [securityId]: 'testId',
      roles: ['maas'],
    };
  }
});

const invocationCtx = {
  methodName: 'findCommunitiesByFunderId',
  args: ['testFunder'],
};

const invocationCtxCreateSubscription = {
  methodName: 'createSubscription',
  args: [{incentiveId: 'testAides'}],
};

const invocationCtxCreateSubscription2 = {
  methodName: 'createSubscription',
  args: [{incentiveId: 'testAides'}],
};

const invocationCtxAddFiles = {
  methodName: 'addFiles',
  args: ['tstSubscription'],
};

const invocationCtxFindId = {
  methodName: 'findIncentiveById',
  args: ['606c236a624cec2becdef277'],
};

const invocationCtxAddAttachments = {
  methodName: 'addAttachments',
  args: ['606c236a624cec2becdef277'],
};

const invocationCtxFinalizeSubscription = {
  methodName: 'finalizeSubscription',
  args: ['606c236a624cec2becdef277'],
};

const mockPublicIncentive = new Incentive({
  territoryIds: ['test'],
  additionalInfos: 'test',
  funderName: 'Mairie',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
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
  territoryIds: ['test'],
  additionalInfos: 'test',
  funderName: 'Mairie',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
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

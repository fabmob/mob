import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import {
  CommunityRepository,
  FunderRepository,
  KeycloakGroupRepository,
  UserRepository,
} from '../../repositories';
import {UserInterceptor} from '../../interceptors';
import {FUNDER_TYPE, Roles, StatusCode} from '../../utils';
import {Community, Enterprise, EnterpriseDetails, Funder, User} from '../../models';

describe('UserInterceptor', () => {
  let userInterceptor: any = null;
  let funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>,
    keycloakGroupRepository: StubbedInstanceWithSinonAccessor<KeycloakGroupRepository>,
    userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>;

  beforeEach(() => {
    givenStubbed();
    userInterceptor = new UserInterceptor(
      funderRepository,
      keycloakGroupRepository,
      userRepository,
      communityRepository,
    );
  });

  function givenStubbed() {
    funderRepository = createStubInstance(FunderRepository);
    keycloakGroupRepository = createStubInstance(KeycloakGroupRepository);
    userRepository = createStubInstance(UserRepository);
    communityRepository = createStubInstance(CommunityRepository);
  }

  it('UserInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(userInterceptor.intercept, 'bind').resolves(res);
    const result = await userInterceptor.value();

    expect(result).to.equal(res);
    userInterceptor.intercept.bind.restore();
  });

  it('UserInterceptor create: KO funder not found', async () => {
    try {
      const invocationContextCreateKO = {
        target: {},
        methodName: 'create',
        args: [userKOEmail],
      };

      funderRepository.stubs.findById.resolves(undefined);
      await userInterceptor.intercept(invocationContextCreateKO);
    } catch (err) {
      expect(err.message).to.equal('users.error.funders.missed');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('UserInterceptor create: KO funder email domains', async () => {
    try {
      const invocationContextCreateKO = {
        target: {},
        methodName: 'create',
        args: [userKOEmail],
      };

      funderRepository.stubs.findById.resolves(funderEnterprise);
      await userInterceptor.intercept(invocationContextCreateKO);
    } catch (err) {
      expect(err.message).to.equal('email.error.emailFormat');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('UserInterceptor create: KO funder affiliation', async () => {
    try {
      const invocationContextCreateKO = {
        target: {},
        methodName: 'create',
        args: [userKOAffiliation],
      };

      funderRepository.stubs.findById.resolves(funderEnterprise);
      await userInterceptor.intercept(invocationContextCreateKO);
    } catch (err) {
      expect(err.message).to.equal('users.funder.manualAffiliation.refuse');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('UserInterceptor create: KO roles', async () => {
    try {
      const invocationContextCreateKO = {
        target: {},
        methodName: 'create',
        args: [userKORoles],
      };

      funderRepository.stubs.findById.resolves(funderEnterprise);
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.resolves([Roles.SUPERVISORS]);

      await userInterceptor.intercept(invocationContextCreateKO);
    } catch (err) {
      expect(err.message).to.equal('users.error.roles.mismatch');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('UserInterceptor create: KO communities', async () => {
    try {
      const invocationContextCreateKO = {
        target: {},
        methodName: 'create',
        args: [userKORoles],
      };

      funderRepository.stubs.findById.resolves(funderEnterprise);
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.resolves([Roles.MANAGERS]);
      communityRepository.stubs.findByFunderId.resolves([new Community({id: 'communityError'})]);

      await userInterceptor.intercept(invocationContextCreateKO);
    } catch (err) {
      expect(err.message).to.equal('users.error.communities.mismatch');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('UserInterceptor create: OK', async () => {
    const invocationContextCreateOK = {
      target: {},
      methodName: 'create',
      args: [userOK],
    };

    funderRepository.stubs.findById.resolves(funderEnterprise);
    keycloakGroupRepository.stubs.getSubGroupFunderRoles.resolves([Roles.MANAGERS]);
    communityRepository.stubs.findByFunderId.resolves([new Community({id: 'communityId'})]);
    const result = await userInterceptor.intercept(invocationContextCreateOK, () => {});
    expect(result).to.Null;
  });

  it('UserInterceptor updateById: KO canReceiveAffiliationMail', async () => {
    try {
      const invocationContextUpdateKO = {
        target: {},
        methodName: 'updateById',
        args: ['userId', userKOAffiliation],
      };

      funderRepository.stubs.findById.resolves(funderEnterprise);
      await userInterceptor.intercept(invocationContextUpdateKO);
    } catch (err) {
      expect(err.message).to.equal('users.funder.manualAffiliation.refuse');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('UserInterceptor updateById: KO funder not found', async () => {
    try {
      const invocationContextUpdateKO = {
        target: {},
        methodName: 'updateById',
        args: ['userId', userKORoles],
      };

      userRepository.stubs.exists.resolves(false);
      await userInterceptor.intercept(invocationContextUpdateKO);
    } catch (err) {
      expect(err.message).to.equal('users.error.funders.missed');
      expect(err.statusCode).to.equal(StatusCode.NotFound);
    }
  });
});

const userOK: User = new User({
  id: 'userId',
  funderId: 'funderId',
  communityIds: ['communityId'],
  roles: [Roles.MANAGERS],
  email: 'user@example.com',
});

const userKOEmail: User = new User({
  id: 'userId',
  funderId: 'funderId',
  communityIds: ['communityId'],
  roles: [Roles.SUPERVISORS],
  email: 'user@supervisor.com',
});

const userKOAffiliation: User = new User({
  id: 'userId',
  funderId: 'funderId',
  communityIds: ['communityId'],
  roles: [Roles.SUPERVISORS],
  email: 'user@example.com',
  canReceiveAffiliationMail: true,
});

const userKORoles: User = new User({
  id: 'userId',
  funderId: 'funderId',
  communityIds: ['communityId'],
  roles: [Roles.MANAGERS],
  email: 'user@example.com',
  canReceiveAffiliationMail: false,
});

const funderEnterprise: Funder = new Enterprise({
  id: 'userId',
  type: FUNDER_TYPE.ENTERPRISE,
  name: 'Enterprise',
  enterpriseDetails: new EnterpriseDetails({
    isHris: false,
    hasManualAffiliation: false,
    emailDomainNames: ['@example.com'],
  }),
});

import {createStubInstance, expect, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {
  CommunityRepository,
  UserEntityRepository,
  UserRepository,
  KeycloakGroupRepository,
  FunderRepository,
} from '../../repositories';
import {UserController} from '../../controllers';
import {KeycloakService} from '../../services';
import {Community, User, KeycloakRole, EnterpriseDetails, Funder} from '../../models';
import {FUNDER_TYPE, IUser, StatusCode} from '../../utils';
import {response} from '@loopback/rest';

describe('UserController (unit)', () => {
  let userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    keycloakGroupRepository: StubbedInstanceWithSinonAccessor<KeycloakGroupRepository>,
    userEntityRepository: StubbedInstanceWithSinonAccessor<UserEntityRepository>,
    communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>,
    funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>,
    kcService: StubbedInstanceWithSinonAccessor<KeycloakService>,
    controller: UserController;

  const currentUser: IUser = {
    id: 'a0e48494-1bfb-4142-951b-16ec6d9c8e1d',
    emailVerified: true,
    maas: undefined,
    membership: ['/citizens'],
    roles: ['offline_access', 'uma_authorization'],
    [securityId]: 'citizenId',
  };

  const user = new User({
    id: 'a0e48494-1bfb-4142-951b-16ec6d9c8e1d',
    email: 'random@random.fr',
    firstName: 'firstName',
    lastName: 'lastName',
    funderId: 'random',
    roles: ['gestionnaires', 'superviseurs'],
    communityIds: ['id1', 'id2'],
  });

  const userSupervisor = new User({
    email: 'random@random.fr',
    firstName: 'firstName',
    lastName: 'lastName',
    funderId: 'random',
    roles: ['superviseurs'],
  });

  const enterpriseNoManualAffiliation = new Funder({
    id: 'random',
    enterpriseDetails: new EnterpriseDetails({
      emailDomainNames: ['@arandom.fr', '@random.com'],
      hasManualAffiliation: false,
      isHris: true,
    }),
    name: 'enterprise',
    type: FUNDER_TYPE.ENTERPRISE,
  });

  const userWithManualAffiliation = new User({
    id: 'a0e48494-1bfb-4142-951b-16ec6d9c8e1d',
    email: 'random@random.fr',
    firstName: 'firstName',
    lastName: 'lastName',
    funderId: 'random',
    roles: ['gestionnaires', 'superviseurs'],
    communityIds: ['id1', 'id2'],
    canReceiveAffiliationMail: true,
  });

  const response: any = {
    status: function () {
      return this;
    },
    contentType: function () {
      return this;
    },
    send: (body: any) => body,
  };

  beforeEach(() => {
    givenStubbedComponent();
    controller = new UserController(
      response,
      userRepository,
      keycloakGroupRepository,
      userEntityRepository,
      communityRepository,
      funderRepository,
      kcService,
      currentUser,
    );
  });

  describe('UserController', () => {
    it('UserController create : fails because of create repository error', async () => {
      try {
        funderRepository.stubs.findById.resolves(
          new Funder({
            id: 'random',
            type: FUNDER_TYPE.COLLECTIVITY,
          }),
        );
        kcService.stubs.createUserKc.resolves({id: 'randomInputId'});
        keycloakGroupRepository.stubs.getSubGroupFunderRoles.resolves([
          'superviseurs',
          'gestionnaires',
          'newRole',
        ]);
        communityRepository.stubs.findByFunderId.resolves([
          new Community({id: 'id1'}),
          new Community({id: 'id2'}),
          new Community({id: 'id3'}),
        ]);
        userRepository.stubs.create.rejects(new Error('Error'));
        kcService.stubs.deleteUserKc.resolves();

        await controller.create(user);
      } catch (err) {
        expect(err.message).to.equal('Error');
      }
    });

    it('UserController create user funder : successful', async () => {
      funderRepository.stubs.findById.resolves(
        new Funder({
          id: 'random',
          enterpriseDetails: new EnterpriseDetails({
            emailDomainNames: ['@random.fr', '@random.com'],
          }),
          type: FUNDER_TYPE.ENTERPRISE,
        }),
      );
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.resolves([
        'superviseurs',
        'gestionnaires',
        'newRole',
      ]);
      communityRepository.stubs.findByFunderId.resolves([
        new Community({id: 'id1'}),
        new Community({id: 'id2'}),
        new Community({id: 'id3'}),
      ]);
      kcService.stubs.createUserKc.resolves({id: 'randomInputId'});

      userRepository.stubs.create.resolves(user);

      const result = await controller.create(user);

      expect(result).to.deepEqual({
        id: user.id,
      });
    });

    it('UserController create funder keycloakResult undefined', async () => {
      funderRepository.stubs.findById.resolves(
        new Funder({
          id: 'random',
          enterpriseDetails: new EnterpriseDetails({
            emailDomainNames: ['@random.fr', '@random.com'],
          }),
          type: FUNDER_TYPE.ENTERPRISE,
        }),
      );
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.resolves([
        'superviseurs',
        'gestionnaires',
        'newRole',
      ]);
      communityRepository.stubs.findByFunderId.resolves([
        new Community({id: 'id1'}),
        new Community({id: 'id2'}),
        new Community({id: 'id3'}),
      ]);

      kcService.stubs.createUserKc.resolves(undefined);

      const result = await controller.create(user);

      expect(result).to.deepEqual(undefined);
    });

    it('UserController create supervisor funder successful', async () => {
      funderRepository.stubs.findById.resolves(
        new Funder({
          id: 'random',
          enterpriseDetails: new EnterpriseDetails({
            emailDomainNames: ['@random.fr', '@random.com'],
          }),
          type: FUNDER_TYPE.ENTERPRISE,
        }),
      );
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.resolves(['superviseurs', 'gestionnaires']);

      kcService.stubs.createUserKc.resolves({id: 'randomInputId'});

      userRepository.stubs.create.resolves(userSupervisor);

      const result = await controller.create(userSupervisor);

      expect(result).to.deepEqual({
        id: userSupervisor.id,
      });
    });

    it('UserController /count : successful', async () => {
      const countRes = {
        count: 12,
      };

      userRepository.stubs.count.resolves(countRes);
      const result = await controller.count();

      expect(result).to.deepEqual(countRes);
    });

    it('UserController /get : ERROR', async () => {
      try {
        funderRepository.stubs.find.rejects(new Error('Error'));
        await controller.find();
      } catch (err) {
        expect(err.message).to.equal('Error');
      }
    });

    it('UserController /get : successful', async () => {
      funderRepository.stubs.find.resolves([newFunder]);
      userRepository.stubs.find.resolves([users]);
      communityRepository.stubs.find.resolves([newCommunity]);
      userEntityRepository.stubs.getUserRoles.resolves([roles]);
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.resolves(['test', 'test1']);

      const result = await controller.find();

      expect(result).to.deepEqual([mockUsersWithInfos]);
    });

    it('UserController /get : successful no community', async () => {
      funderRepository.stubs.find.resolves([newFunder]);
      userRepository.stubs.find.resolves([userWithoutCom]);
      userEntityRepository.stubs.getUserRoles.resolves([roles]);
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.resolves(['test', 'test1']);

      const result = await controller.find();

      expect(result).to.deepEqual([mockUsersWithInfosWithoutCommunity]);
    });

    it('UserController /v1/users/roles : ERROR', async () => {
      try {
        keycloakGroupRepository.stubs.getSubGroupFunderRoles.rejects(new Error('Error'));
        await controller.getRolesForUsers();
      } catch (err) {
        expect(err.message).to.equal('Error');
      }
    });

    it('UserController /v1/users/roles : successful', async () => {
      const res: any = ['gestionnaires', 'superviseurs'];
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.resolves(res);

      const result = await controller.getRolesForUsers();

      expect(result).to.deepEqual(res);
    });

    it('UserController findUserById: Successful ', async () => {
      userRepository.stubs.findById.resolves(user);
      userEntityRepository.stubs.getUserRoles.resolves([roles]);
      const result = await controller.findUserById('a0e48494-1bfb-4142-951b-16ec6d9c8e1d');
      const res: string[] = ['test'];
      expect(result).to.deepEqual({...result, roles: res});
      userRepository.stubs.findById.restore();
      userEntityRepository.stubs.getUserRoles.restore();
    });

    it('UserController findUserById: Error ', async () => {
      try {
        userRepository.stubs.findById.resolves(user);
        userEntityRepository.stubs.getUserRoles.resolves([roles]);
        const communities = new Community({id: 'id1', name: 'name'});
        communityRepository.stubs.findByFunderId.resolves([communities]);
        await controller.findUserById('1234567890');
      } catch (err) {
        expect(err.message).to.equal('Access denied');
        expect(err.statusCode).to.equal(StatusCode.Forbidden);
      }
      userRepository.stubs.findById.restore();
      userEntityRepository.stubs.getUserRoles.restore();
    });

    it('UserController updateById : ERROR ', async () => {
      try {
        userRepository.stubs.findById.rejects(new Error('Error'));
        await controller.updateById('a0e48494-1bfb-4142-951b-16ec6d9c8e1d', userWithManualAffiliation);
      } catch (err) {
        expect(err.message).to.equal('Error');
      }
    });

    it('UserController updateById: successful ', async () => {
      userRepository.stubs.findById.resolves(users);
      kcService.stubs.updateUserKC.resolves();
      kcService.stubs.updateUserGroupsKc.resolves();
      await controller.updateById('a0e48494-1bfb-4142-951b-16ec6d9c8e1d', usersUpdated);

      expect(kcService.stubs.updateUserGroupsKc.called).true();
      expect(kcService.stubs.updateUserKC.called).true();
      expect(userRepository.stubs.updateById.called).true();
    });

    it('UserController deleteById : ERROR ', async () => {
      try {
        kcService.stubs.deleteUserKc.rejects(new Error('Error'));
        await controller.deleteById('a0e48494-1bfb-4142-951b-16ec6d9c8e1d');
      } catch (err) {
        expect(err.message).to.equal('Error');
      }
    });

    it('UserController deleteById: successful ', async () => {
      kcService.stubs.deleteUserKc.resolves('a0e48494-1bfb-4142-951b-16ec6d9c8e1d');
      const result = await controller.deleteById('a0e48494-1bfb-4142-951b-16ec6d9c8e1d');
      expect(result).to.deepEqual({id: 'a0e48494-1bfb-4142-951b-16ec6d9c8e1d'});
    });
  });

  function givenStubbedComponent() {
    userRepository = createStubInstance(UserRepository);
    communityRepository = createStubInstance(CommunityRepository);
    userEntityRepository = createStubInstance(UserEntityRepository);
    keycloakGroupRepository = createStubInstance(KeycloakGroupRepository);
    communityRepository = createStubInstance(CommunityRepository);
    kcService = createStubInstance(KeycloakService);
    funderRepository = createStubInstance(FunderRepository);
  }
});

const users = new User({
  email: 'w.housni24@gmail.co',
  firstName: 'Walid',
  lastName: 'Walid HOUSNI',
  id: 'a0e48494-1bfb-4142-951b-16ec6d9c8e1d',
  funderId: 'efec7e68-fc17-4078-82c5-65d53961f34d',
  communityIds: ['618a4dad80ea32653c7a20d7'],
});

const userWithoutCom = new User({
  email: 'w.housni24@gmail.co',
  firstName: 'Walid',
  lastName: 'Walid HOUSNI',
  id: 'a0e48494-1bfb-4142-951b-16ec6d9c8e1d',
  funderId: 'efec7e68-fc17-4078-82c5-65d53961f34d',
  communityIds: [],
});

const usersUpdated = new User({
  email: 'w.housni24@gmail.co',
  firstName: 'Baghrous',
  lastName: 'Abdelmoumene',
  id: 'a0e48494-1bfb-4142-951b-16ec6d9c8e1d',
  funderId: 'efec7e68-fc17-4078-82c5-65d53961f34d',
  communityIds: ['618a4dad80ea32653c7a20d7'],
  roles: ['gestionnaires'],
});

const roles = new KeycloakRole({name: 'test'});

const newCommunity = new Community({
  id: '618a4dad80ea32653c7a20d7',
  name: 'Something wonderful',
  funderId: 'efec7e68-fc17-4078-82c5-65d53961f34d',
});

const newFunder = new Funder({
  id: 'efec7e68-fc17-4078-82c5-65d53961f34d',
  name: 'Collectivity United.',
  citizensCount: undefined,
  mobilityBudget: undefined,
  type: FUNDER_TYPE.COLLECTIVITY,
});

const mockUsersWithInfos = {
  email: 'w.housni24@gmail.co',
  firstName: 'Walid',
  lastName: 'Walid HOUSNI',
  id: 'a0e48494-1bfb-4142-951b-16ec6d9c8e1d',
  funderId: 'efec7e68-fc17-4078-82c5-65d53961f34d',
  communityIds: ['618a4dad80ea32653c7a20d7'],
  funderType: FUNDER_TYPE.COLLECTIVITY,
  communityName: 'Something wonderful',
  funderName: 'Collectivity United.',
  roles: 'Test',
};

const mockUsersWithInfosWithoutCommunity = {
  email: 'w.housni24@gmail.co',
  firstName: 'Walid',
  lastName: 'Walid HOUSNI',
  id: 'a0e48494-1bfb-4142-951b-16ec6d9c8e1d',
  funderId: 'efec7e68-fc17-4078-82c5-65d53961f34d',
  communityIds: [],
  funderType: FUNDER_TYPE.COLLECTIVITY,
  communityName: '',
  funderName: 'Collectivity United.',
  roles: 'Test',
};

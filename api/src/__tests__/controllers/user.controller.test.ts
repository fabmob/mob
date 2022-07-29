import {
  createStubInstance,
  expect,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {
  CommunityRepository,
  UserEntityRepository,
  UserRepository,
  KeycloakGroupRepository,
} from '../../repositories';
import {UserController} from '../../controllers';
import {KeycloakService, FunderService, IUser} from '../../services';
import {Community, User, KeycloakRole} from '../../models';
import {FUNDER_TYPE, ResourceName, StatusCode} from '../../utils';
import {ValidationError} from '../../validationError';

describe('UserController (unit)', () => {
  let userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    keycloakGroupRepository: StubbedInstanceWithSinonAccessor<KeycloakGroupRepository>,
    userEntityRepository: StubbedInstanceWithSinonAccessor<UserEntityRepository>,
    communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>,
    funderService: StubbedInstanceWithSinonAccessor<FunderService>,
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
  beforeEach(() => {
    givenStubbedComponent();
    controller = new UserController(
      userRepository,
      keycloakGroupRepository,
      userEntityRepository,
      communityRepository,
      kcService,
      funderService,
      currentUser,
    );
  });

  describe('UserController', () => {
    it('UserController create : fails because of emailformat error', async () => {
      const errorKc = new ValidationError(
        `email.error.emailFormat`,
        `/users`,
        StatusCode.UnprocessableEntity,
        ResourceName.User,
      );
      try {
        funderService.stubs.getFunders.resolves([
          {id: 'random', emailFormat: ['@arandom.fr', '@random.com']},
        ]);

        await controller.create(user);
      } catch ({message}) {
        expect(message).to.equal(errorKc.message);
      }
      funderService.stubs.getFunders.restore();
    });

    it('UserController create : fails because of unmismatched roles', async () => {
      const errorKc = new ValidationError(
        `users.error.roles.mismatch`,
        `/users`,
        StatusCode.UnprocessableEntity,
        ResourceName.User,
      );
      try {
        funderService.stubs.getFunders.resolves([
          {
            id: 'random',
            emailFormat: ['@random.fr', '@random.com'],
          },
        ]);
        keycloakGroupRepository.stubs.getSubGroupFunderRoles.resolves(['superviseurs']);

        await controller.create(user);
      } catch ({message}) {
        expect(message).to.equal(errorKc.message);
      }
      funderService.stubs.getFunders.restore();
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.restore();
    });

    it('UserController create : fails because of unmismatched communauties', async () => {
      const errorKc = new ValidationError(
        `users.error.communities.mismatch`,
        `/users`,
        StatusCode.UnprocessableEntity,
        ResourceName.User,
      );
      try {
        funderService.stubs.getFunders.resolves([
          {
            id: 'random',
            emailFormat: ['@random.fr', '@random.com'],
          },
        ]);
        keycloakGroupRepository.stubs.getSubGroupFunderRoles.resolves([
          'superviseurs',
          'gestionnaires',
          'newRole',
        ]);
        communityRepository.stubs.findByFunderId.resolves([]);

        await controller.create(user);
      } catch ({message}) {
        expect(message).to.equal(errorKc.message);
      }
      funderService.stubs.getFunders.restore();
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.restore();
      communityRepository.stubs.findByFunderId.restore();
    });

    it('UserController create : fails because of create repository error', async () => {
      const errorRepository = 'can not add data in database';
      try {
        funderService.stubs.getFunders.resolves([
          {id: 'random', funderType: FUNDER_TYPE.collectivity},
        ]);
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
        userRepository.stubs.create.rejects(errorRepository);
        kcService.stubs.deleteUserKc.resolves();

        await controller.create(user);
      } catch ({name}) {
        expect(name).to.equal(errorRepository);
      }

      kcService.stubs.createUserKc.restore();
      userRepository.stubs.create.restore();
      funderService.stubs.getFunders.restore();
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.restore();
      communityRepository.stubs.findByFunderId.restore();
      kcService.stubs.deleteUserKc.restore();
    });

    it('UserController create : fails because of can not find funder', async () => {
      const errorFunder = new ValidationError(
        `users.error.funders.missed`,
        `/users`,
        StatusCode.UnprocessableEntity,
        ResourceName.User,
      );
      try {
        kcService.stubs.createUserKc.resolves({
          id: 'randomInputId',
        });
        funderService.stubs.getFunders.resolves([]);
        kcService.stubs.deleteUserKc.resolves();

        await controller.create(user);
      } catch (err) {
        expect(err).to.deepEqual(errorFunder);
      }

      kcService.stubs.createUserKc.restore();
      kcService.stubs.deleteUserKc.restore();
      userRepository.stubs.create.restore();
      funderService.stubs.getFunders.restore();
    });

    it('UserController create user funder : successful', async () => {
      funderService.stubs.getFunders.resolves([
        {id: 'random', emailFormat: ['@random.fr', '@random.com']},
      ]);
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
        email: user.email,
        lastName: user.lastName,
        firstName: user.firstName,
      });
      funderService.stubs.getFunders.restore();
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.restore();
      communityRepository.stubs.findByFunderId.restore();
      kcService.stubs.createUserKc.restore();
      userRepository.stubs.create.restore();
    });

    it('UserController create funder keycloakResult undefined', async () => {
      funderService.stubs.getFunders.resolves([
        {id: 'random', emailFormat: ['@random.fr', '@random.com']},
      ]);
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

      funderService.stubs.getFunders.restore();
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.restore();
      communityRepository.stubs.findByFunderId.restore();
      kcService.stubs.createUserKc.restore();
    });

    it('UserController create supervisor funder successful', async () => {
      funderService.stubs.getFunders.resolves([
        {id: 'random', emailFormat: ['@random.fr', '@random.com']},
      ]);
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.resolves([
        'superviseurs',
        'gestionnaires',
      ]);

      kcService.stubs.createUserKc.resolves({id: 'randomInputId'});

      userRepository.stubs.create.resolves(userSupervisor);

      const result = await controller.create(userSupervisor);

      expect(result).to.deepEqual({
        id: userSupervisor.id,
        email: userSupervisor.email,
        lastName: userSupervisor.lastName,
        firstName: userSupervisor.firstName,
      });
      funderService.stubs.getFunders.restore();
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.restore();
      communityRepository.stubs.findByFunderId.restore();
      kcService.stubs.createUserKc.restore();
      userRepository.stubs.create.restore();
    });

    it('UserController /count : successful', async () => {
      const countRes = {
        count: 12,
      };

      userRepository.stubs.count.resolves(countRes);
      const result = await controller.count();

      expect(result).to.deepEqual(countRes);
    });

    it('UserController /get : successful', async () => {
      funderService.stubs.getFunders.resolves([newFunder]);
      userRepository.stubs.find.resolves([users]);
      communityRepository.stubs.find.resolves([newCommunity]);
      userEntityRepository.stubs.getUserRoles.resolves([roles]);
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.resolves(['test', 'test1']);

      const result = await controller.find();

      expect(result).to.deepEqual([mockUsersWithInfos]);
      funderService.stubs.getFunders.restore();
      userRepository.stubs.find.restore();
      communityRepository.stubs.find.restore();
      userEntityRepository.stubs.getUserRoles.restore();
      keycloakGroupRepository.stubs.getSubGroupFunderRoles.restore();
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
      const result = await controller.findUserById(
        'a0e48494-1bfb-4142-951b-16ec6d9c8e1d',
      );
      const res: string[] = ['test'];
      expect(result).to.deepEqual({...result, roles: res});
      userRepository.stubs.findById.restore();
      userEntityRepository.stubs.getUserRoles.restore();
    });

    it('UserController findUserById: Error ', async () => {
      const userError = new ValidationError(
        `Access Denied`,
        `/authorization`,
        StatusCode.Forbidden,
      );

      try {
        userRepository.stubs.findById.resolves(user);
        userEntityRepository.stubs.getUserRoles.resolves([roles]);
        const communities = new Community({id: 'id1', name: 'name'});
        communityRepository.stubs.findByFunderId.resolves([communities]);
        await controller.findUserById('1234567890');
      } catch ({message}) {
        expect(message).to.equal(userError.message);
      }
      userRepository.stubs.findById.restore();
      userEntityRepository.stubs.getUserRoles.restore();
    });

    it('UserController updateById: successful ', async () => {
      userRepository.stubs.findById.resolves(users);
      kcService.stubs.updateUserGroupsKc.resolves();
      const result = await controller.updateById(
        'a0e48494-1bfb-4142-951b-16ec6d9c8e1d',
        usersUpdated,
      );
      expect(result).to.deepEqual({id: 'a0e48494-1bfb-4142-951b-16ec6d9c8e1d'});
      userRepository.stubs.findById.restore();
      kcService.stubs.updateUserGroupsKc.restore();
    });

    it('UserController deleteById: successful ', async () => {
      kcService.stubs.deleteUserKc.resolves('a0e48494-1bfb-4142-951b-16ec6d9c8e1d');
      const result = await controller.deleteById('a0e48494-1bfb-4142-951b-16ec6d9c8e1d');
      expect(result).to.deepEqual({id: 'a0e48494-1bfb-4142-951b-16ec6d9c8e1d'});
      kcService.stubs.deleteUserKc.restore();
    });
  });

  function givenStubbedComponent() {
    userRepository = createStubInstance(UserRepository);
    communityRepository = createStubInstance(CommunityRepository);
    userEntityRepository = createStubInstance(UserEntityRepository);
    keycloakGroupRepository = createStubInstance(KeycloakGroupRepository);
    communityRepository = createStubInstance(CommunityRepository);
    kcService = createStubInstance(KeycloakService);
    funderService = createStubInstance(FunderService);
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

const newFunder = {
  id: 'efec7e68-fc17-4078-82c5-65d53961f34d',
  name: 'Collectivity United.',
  citizensCount: undefined,
  mobilityBudget: undefined,
  funderType: 'collectivité',
};

const mockUsersWithInfos = {
  email: 'w.housni24@gmail.co',
  firstName: 'Walid',
  lastName: 'Walid HOUSNI',
  id: 'a0e48494-1bfb-4142-951b-16ec6d9c8e1d',
  funderId: 'efec7e68-fc17-4078-82c5-65d53961f34d',
  communityIds: ['618a4dad80ea32653c7a20d7'],
  funderType: 'Collectivité',
  communityName: 'Something wonderful',
  funderName: 'Collectivity United.',
  roles: 'Test',
};

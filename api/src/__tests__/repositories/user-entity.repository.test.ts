import {expect} from '@loopback/testlab';

import {realmName} from '../../constants';
import {KeycloakGroup, UserAttribute, UserEntity, UserGroupMembership} from '../../models';

import {
  GroupAttributeRepository,
  GroupRoleMappingRepository,
  KeycloakGroupRepository,
  KeycloakRoleRepository,
  UserAttributeRepository,
  UserEntityRepository,
  UserGroupMembershipRepository,
} from '../../repositories';
import {GROUPS} from '../../utils';

import {testdbPostgres} from './testdb.datasource';

describe('UserEntity repository (unit)', () => {
  let userEntityRepository: UserEntityRepository,
    userGroupMembershipRepository: UserGroupMembershipRepository,
    keycloakGroupRepository: KeycloakGroupRepository,
    groupRoleMappingRepository: GroupRoleMappingRepository,
    keycloakRoleRepository: KeycloakRoleRepository,
    userAttributeRepository: UserAttributeRepository,
    groupAttributeRepository: GroupAttributeRepository;

  beforeEach(async () => {
    userEntityRepository = new UserEntityRepository(
      testdbPostgres,
      async () => userGroupMembershipRepository,
      async () => keycloakGroupRepository,
      keycloakGroupRepository,
      async () => userAttributeRepository,
    );

    userGroupMembershipRepository = new UserGroupMembershipRepository(testdbPostgres);
    groupRoleMappingRepository = new GroupRoleMappingRepository(testdbPostgres);
    keycloakRoleRepository = new KeycloakRoleRepository(testdbPostgres);
    keycloakGroupRepository = new KeycloakGroupRepository(
      testdbPostgres,
      async () => groupRoleMappingRepository,
      async () => keycloakRoleRepository,
      async () => groupAttributeRepository,
    );
    userAttributeRepository = new UserAttributeRepository(testdbPostgres);
    keycloakRoleRepository = new KeycloakRoleRepository(testdbPostgres);
    groupAttributeRepository = new GroupAttributeRepository(testdbPostgres);

    await userEntityRepository.deleteAll();
    await userGroupMembershipRepository.deleteAll();
    await keycloakRoleRepository.deleteAll();
    await keycloakGroupRepository.deleteAll();
    await userAttributeRepository.deleteAll();
    await keycloakRoleRepository.deleteAll();
  });

  it('UserEntity repository  getUserWithAttributes(): successful 1 result', async () => {
    const citizenUserEntity: UserEntity = new UserEntity({
      id: 'userId',
      emailVerified: true,
      enabled: true,
      notBefore: 0,
    });

    const citizenUserAttributes: UserAttribute = new UserAttribute({
      id: 'userAttributeId',
      userId: 'userId',
      name: 'identity.lastName',
      value: 'lastName',
    });

    const citizenKeycloakGroup: KeycloakGroup = new KeycloakGroup({
      id: 'citizenGroupId',
      name: GROUPS.citizens,
      realmId: realmName,
    });

    const createdUserEntity: UserEntity = await userEntityRepository.create(citizenUserEntity);

    const createdUserAttribute: UserAttribute = await userAttributeRepository.create(citizenUserAttributes);

    const createdKeycloakGroup: KeycloakGroup = await keycloakGroupRepository.create(citizenKeycloakGroup);

    await userGroupMembershipRepository.create(
      new UserGroupMembership({
        groupId: 'citizenGroupId',
        userId: 'userId',
      }),
    );

    const result = await userEntityRepository.getUserWithAttributes('userId', GROUPS.citizens);
    expect(result).to.deepEqual(
      new UserEntity({
        ...createdUserEntity,
        emailVerified: true,
        enabled: true,
        userAttributes: [createdUserAttribute],
        keycloakGroups: [createdKeycloakGroup],
      }),
    );
  });

  it('UserEntity repository  getUserWithAttributes(): successful no result', async () => {
    const citizenUserEntity: UserEntity = new UserEntity({
      id: 'userId',
      emailVerified: true,
      enabled: true,
      notBefore: 0,
    });

    const citizenUserAttributes: UserAttribute = new UserAttribute({
      id: 'userAttributeId',
      userId: 'userId',
      name: 'identity.lastName',
      value: 'lastName',
    });

    const citizenKeycloakGroup: KeycloakGroup = new KeycloakGroup({
      id: 'citizenGroupId',
      name: GROUPS.citizens,
      realmId: realmName,
    });

    await userEntityRepository.create(citizenUserEntity);

    await userAttributeRepository.create(citizenUserAttributes);

    await keycloakGroupRepository.create(citizenKeycloakGroup);

    await userGroupMembershipRepository.create(
      new UserGroupMembership({
        groupId: 'citizenGroupId',
        userId: 'userId',
      }),
    );

    const result = await userEntityRepository.getUserWithAttributes('userId', GROUPS.funders);
    expect(result).to.deepEqual(null);
  });

  it('UserEntity repository searchUserWithAttributesByFilter(): no filter, 1 result', async () => {
    const citizenUserEntity: UserEntity = new UserEntity({
      id: 'userId',
      emailVerified: true,
      enabled: true,
      notBefore: 0,
    });

    const citizenUserAttributes: UserAttribute = new UserAttribute({
      id: 'userAttributeId',
      userId: 'userId',
      name: 'identity.lastName',
      value: 'lastName',
    });

    const citizenKeycloakGroup: KeycloakGroup = new KeycloakGroup({
      id: 'citizenGroupId',
      name: GROUPS.citizens,
      realmId: realmName,
    });

    const createdUserEntity: UserEntity = await userEntityRepository.create(citizenUserEntity);

    const createdUserAttribute: UserAttribute = await userAttributeRepository.create(citizenUserAttributes);

    const createdKeycloakGroup: KeycloakGroup = await keycloakGroupRepository.create(citizenKeycloakGroup);

    await userGroupMembershipRepository.create(
      new UserGroupMembership({
        groupId: 'citizenGroupId',
        userId: 'userId',
      }),
    );

    const result = await userEntityRepository.searchUserWithAttributesByFilter({}, GROUPS.citizens);
    expect(result).to.deepEqual([
      new UserEntity({
        ...createdUserEntity,
        emailVerified: true,
        enabled: true,
        userAttributes: [createdUserAttribute],
        keycloakGroups: [createdKeycloakGroup],
      }),
    ]);
  });

  it('UserEntity repository searchUserWithAttributesByFilter(): with filter, 1 result', async () => {
    const citizenUserEntity: UserEntity = new UserEntity({
      id: 'userId',
      lastName: 'lastName',
      emailVerified: true,
      enabled: true,
      notBefore: 0,
    });

    const citizenUserAttributes: UserAttribute = new UserAttribute({
      id: 'userAttributeId',
      userId: 'userId',
      name: 'identity.lastName',
      value: 'lastName',
    });

    const citizenKeycloakGroup: KeycloakGroup = new KeycloakGroup({
      id: 'citizenGroupId',
      name: GROUPS.citizens,
      realmId: realmName,
    });

    const createdUserEntity: UserEntity = await userEntityRepository.create(citizenUserEntity);

    const createdUserAttribute: UserAttribute = await userAttributeRepository.create(citizenUserAttributes);

    const createdKeycloakGroup: KeycloakGroup = await keycloakGroupRepository.create(citizenKeycloakGroup);

    await userGroupMembershipRepository.create(
      new UserGroupMembership({
        groupId: 'citizenGroupId',
        userId: 'userId',
      }),
    );

    const result = await userEntityRepository.searchUserWithAttributesByFilter(
      {where: {lastName: 'lastName'}},
      GROUPS.citizens,
    );
    expect(result).to.deepEqual([
      new UserEntity({
        ...createdUserEntity,
        emailVerified: true,
        enabled: true,
        userAttributes: [createdUserAttribute],
        keycloakGroups: [createdKeycloakGroup],
      }),
    ]);
  });

  it('UserEntity repository searchUserWithAttributesByFilter(): successful no result', async () => {
    const citizenUserEntity: UserEntity = new UserEntity({
      id: 'userId',
      emailVerified: true,
      enabled: true,
      notBefore: 0,
    });

    const citizenUserAttributes: UserAttribute = new UserAttribute({
      id: 'userAttributeId',
      userId: 'userId',
      name: 'identity.lastName',
      value: 'lastName',
    });

    const citizenKeycloakGroup: KeycloakGroup = new KeycloakGroup({
      id: 'citizenGroupId',
      name: GROUPS.citizens,
      realmId: realmName,
    });

    await userEntityRepository.create(citizenUserEntity);

    await userAttributeRepository.create(citizenUserAttributes);

    await keycloakGroupRepository.create(citizenKeycloakGroup);

    await userGroupMembershipRepository.create(
      new UserGroupMembership({
        groupId: 'citizenGroupId',
        userId: 'userId',
      }),
    );

    const result = await userEntityRepository.searchUserWithAttributesByFilter({}, GROUPS.funders);
    expect(result).to.deepEqual([]);
  });
});

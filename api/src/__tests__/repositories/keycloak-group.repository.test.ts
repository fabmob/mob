import {expect} from '@loopback/testlab';

import {realmName} from '../../constants';
import {GroupRoleMapping, KeycloakGroup, KeycloakRole} from '../../models';

import {
  GroupAttributeRepository,
  GroupRoleMappingRepository,
  KeycloakGroupRepository,
  KeycloakRoleRepository,
} from '../../repositories';
import {GROUPS} from '../../utils';

import {testdbPostgres} from './testdb.datasource';

describe('keycloakGroup (unit)', () => {
  let repository: KeycloakGroupRepository,
    groupRoleMappingRepository: GroupRoleMappingRepository,
    keycloakRoleRepository: KeycloakRoleRepository,
    groupAttributeRepository: GroupAttributeRepository;

  beforeEach(async () => {
    repository = new KeycloakGroupRepository(
      testdbPostgres,
      async () => groupRoleMappingRepository,
      async () => keycloakRoleRepository,
      async () => groupAttributeRepository,
    );

    groupRoleMappingRepository = new GroupRoleMappingRepository(testdbPostgres);

    keycloakRoleRepository = new KeycloakRoleRepository(testdbPostgres);

    await repository.deleteAll();
    await groupRoleMappingRepository.deleteAll();
    await keycloakRoleRepository.deleteAll();
  });

  it('keycloakGroup get roles : successful', async () => {
    await repository.create(
      new KeycloakGroup({
        id: 'parent',
        name: GROUPS.funders,
        parentGroup: '',
        realmId: realmName,
      }),
    );
    await repository.create(
      new KeycloakGroup({
        id: 'grp1',
        name: 'grp1',
        parentGroup: 'parent',
        realmId: realmName,
      }),
    );
    await repository.create(
      new KeycloakGroup({
        id: 'grp2',
        name: 'grp2',
        parentGroup: 'parent',
        realmId: realmName,
      }),
    );
    await repository.create(
      new KeycloakGroup({
        id: 'grp3',
        name: 'grp3',
        parentGroup: 'parent2',
        realmId: realmName,
      }),
    );

    await keycloakRoleRepository.create(new KeycloakRole({id: 'role1', name: 'role1'}));
    await keycloakRoleRepository.create(new KeycloakRole({id: 'role2', name: 'role2'}));
    await keycloakRoleRepository.create(new KeycloakRole({id: 'role3', name: 'role3'}));

    await groupRoleMappingRepository.create(new GroupRoleMapping({roleId: 'role1', groupId: 'grp1'}));
    await groupRoleMappingRepository.create(new GroupRoleMapping({roleId: 'role2', groupId: 'grp1'}));
    await groupRoleMappingRepository.create(new GroupRoleMapping({roleId: 'role5', groupId: 'grp3'}));
    await groupRoleMappingRepository.create(new GroupRoleMapping({roleId: 'role6', groupId: 'grp2'}));
    await groupRoleMappingRepository.create(new GroupRoleMapping({roleId: 'role3', groupId: 'grp1'}));

    const result = await repository.getSubGroupFunderRoles();
    expect(result).to.deepEqual(['role1', 'role2', 'role3']);
  });

  it('keycloakGroup get roles : fails', async () => {
    await repository.create(
      new KeycloakGroup({
        id: 'parent',
        name: 'grp1',
        parentGroup: '',
        realmId: realmName,
      }),
    );
    await repository.create(
      new KeycloakGroup({
        id: 'grp2',
        name: 'grp2',
        parentGroup: 'grp1',
        realmId: realmName,
      }),
    );
    const result = await repository.getSubGroupFunderRoles();
    expect(result).to.deepEqual([]);
  });

  it('keycloakGroup getGroupByName : success', async () => {
    await repository.create(
      new KeycloakGroup({
        id: 'parent',
        name: 'grp1',
        parentGroup: '',
        realmId: realmName,
      }),
    );

    const result = await repository.getGroupByName('grp1');
    expect(result).to.deepEqual(
      new KeycloakGroup({
        id: 'parent',
        name: 'grp1',
        parentGroup: '',
        realmId: realmName,
      }),
    );
  });

  it('keycloakGroup getGroupById : success', async () => {
    await repository.create(
      new KeycloakGroup({
        id: 'randomGroupId',
        name: 'grp1',
        parentGroup: '',
        realmId: realmName,
      }),
    );

    const result = await repository.getGroupById('randomGroupId');
    expect(result).to.deepEqual(
      new KeycloakGroup({
        id: 'randomGroupId',
        name: 'grp1',
        parentGroup: '',
        realmId: realmName,
      }),
    );
  });
});

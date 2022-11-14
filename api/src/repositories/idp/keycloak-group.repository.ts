import {inject, Getter} from '@loopback/core';
import {
  DefaultCrudRepository,
  repository,
  HasManyThroughRepositoryFactory,
} from '@loopback/repository';

import {uniq} from 'lodash';

import {realmName} from '../../constants';
import {IdpDbDataSource} from '../../datasources';
import {
  KeycloakGroup,
  KeycloakGroupRelations,
  KeycloakRole,
  GroupRoleMapping,
} from '../../models';
import {GROUPS} from '../../utils';
import {GroupRoleMappingRepository, KeycloakRoleRepository} from './index';

export class KeycloakGroupRepository extends DefaultCrudRepository<
  KeycloakGroup,
  typeof KeycloakGroup.prototype.id,
  KeycloakGroupRelations
> {
  public readonly keycloakRoles: HasManyThroughRepositoryFactory<
    KeycloakRole,
    typeof KeycloakRole.prototype.id,
    GroupRoleMapping,
    typeof KeycloakGroup.prototype.id
  >;

  constructor(
    @inject('datasources.idpdbDS') dataSource: IdpDbDataSource,
    @repository.getter('GroupRoleMappingRepository')
    protected groupRoleMappingRepositoryGetter: Getter<GroupRoleMappingRepository>,
    @repository.getter('KeycloakRoleRepository')
    protected keycloakRoleRepositoryGetter: Getter<KeycloakRoleRepository>,
  ) {
    super(KeycloakGroup, dataSource);
    this.keycloakRoles = this.createHasManyThroughRepositoryFactoryFor(
      'keycloakRoles',
      keycloakRoleRepositoryGetter,
      groupRoleMappingRepositoryGetter,
    );
    this.registerInclusionResolver('keycloakRoles', this.keycloakRoles.inclusionResolver);
  }

  async getSubGroupFunder(): Promise<{id: string; name: string | undefined}[]> {
    const groups = await this.find({
      where: {realmId: realmName},
    });

    const funder: KeycloakGroup | undefined = groups.find(
      ({name}) => name === GROUPS.funders,
    );

    const funderSubGroups = groups
      .filter(({parentGroup}) => parentGroup === funder?.id)
      .map(({id, name}) => ({id, name}));

    return funderSubGroups;
  }

  async getSubGroupFunderRoles(): Promise<string[]> {
    const groups = await this.find({
      where: {realmId: realmName},
    });

    const funder: KeycloakGroup | undefined = groups.find(
      ({name}) => name === GROUPS.funders,
    );

    const funderSubGroups = groups.filter(({parentGroup}) => parentGroup === funder?.id);

    const funderRoles: string[] = await Promise.all(
      funderSubGroups.map(({id}) => this.keycloakRoles(id).find({fields: {name: true}})),
    ).then((result: KeycloakRole[][]) =>
      uniq(result.flat().map(({name}: {name: string}) => name)),
    );

    return funderRoles.sort();
  }

  /**
   * Get citizens group
   * @returns KeycloakGroup
   */
  async getGroupByName(
    groupName: string,
  ): Promise<(KeycloakGroup & KeycloakGroupRelations) | null> {
    const group: (KeycloakGroup & KeycloakGroupRelations) | null = await this.findOne({
      where: {and: [{realmId: realmName}, {name: groupName}]},
    });
    return group;
  }
}

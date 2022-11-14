import {inject, Getter} from '@loopback/core';
import {
  DefaultCrudRepository,
  repository,
  HasManyThroughRepositoryFactory,
} from '@loopback/repository';

import {IdpDbDataSource} from '../../datasources';
import {
  UserEntity,
  UserEntityRelations,
  KeycloakGroup,
  UserGroupMembership,
  KeycloakRole,
} from '../../models';
import {UserGroupMembershipRepository, KeycloakGroupRepository} from '../../repositories';

export class UserEntityRepository extends DefaultCrudRepository<
  UserEntity,
  typeof UserEntity.prototype.id,
  UserEntityRelations
> {
  public readonly keycloakGroups: HasManyThroughRepositoryFactory<
    KeycloakGroup,
    typeof KeycloakGroup.prototype.id,
    UserGroupMembership,
    typeof UserEntity.prototype.id
  >;

  constructor(
    @inject('datasources.idpdbDS') dataSource: IdpDbDataSource,
    @repository.getter('UserGroupMembershipRepository')
    protected userGroupMembershipRepositoryGetter: Getter<UserGroupMembershipRepository>,
    @repository.getter('KeycloakGroupRepository')
    protected keycloakGroupRepositoryGetter: Getter<KeycloakGroupRepository>,
    @repository('KeycloakGroupRepository')
    protected keycloakGroupRepository: KeycloakGroupRepository,
  ) {
    super(UserEntity, dataSource);
    this.keycloakGroups = this.createHasManyThroughRepositoryFactoryFor(
      'keycloakGroups',
      keycloakGroupRepositoryGetter,
      userGroupMembershipRepositoryGetter,
    );
    this.registerInclusionResolver(
      'keycloakGroups',
      this.keycloakGroups.inclusionResolver,
    );
  }

  async getUserRoles(id: string): Promise<KeycloakRole[]> {
    const groups = await this.keycloakGroups(id).find({fields: {id: true}});

    return Promise.all(
      groups.map(({id}) =>
        this.keycloakGroupRepository.keycloakRoles(id).find({fields: {name: true}}),
      ),
    ).then(res => res.flat().filter(x => x));
  }
  async getServiceUser(
    clientId: string,
  ): Promise<(UserEntity & UserEntityRelations) | null> {
    return this.findOne({
      where: {serviceAccountClientLink: clientId},
    });
  }
}

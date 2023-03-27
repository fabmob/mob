import {inject, Getter} from '@loopback/core';
import {
  DefaultCrudRepository,
  repository,
  HasManyThroughRepositoryFactory,
  HasManyRepositoryFactory,
  Filter,
} from '@loopback/repository';

import {IdpDbDataSource} from '../../datasources';
import {
  UserEntity,
  UserEntityRelations,
  KeycloakGroup,
  UserGroupMembership,
  KeycloakRole,
  UserAttribute,
} from '../../models';
import {UserGroupMembershipRepository, KeycloakGroupRepository} from '../../repositories';
import {GROUPS} from '../../utils';
import {UserAttributeRepository} from './user-attribute.repository';

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

  public readonly userAttributes: HasManyRepositoryFactory<UserAttribute, typeof UserEntity.prototype.id>;

  constructor(
    @inject('datasources.idpdbDS') dataSource: IdpDbDataSource,
    @repository.getter('UserGroupMembershipRepository')
    protected userGroupMembershipRepositoryGetter: Getter<UserGroupMembershipRepository>,
    @repository.getter('KeycloakGroupRepository')
    protected keycloakGroupRepositoryGetter: Getter<KeycloakGroupRepository>,
    @repository('KeycloakGroupRepository')
    protected keycloakGroupRepository: KeycloakGroupRepository,
    @repository.getter('UserAttributeRepository')
    protected userAttributeRepositoryGetter: Getter<UserAttributeRepository>,
  ) {
    super(UserEntity, dataSource);
    this.userAttributes = this.createHasManyRepositoryFactoryFor(
      'userAttributes',
      userAttributeRepositoryGetter,
    );
    this.registerInclusionResolver('userAttributes', this.userAttributes.inclusionResolver);
    this.keycloakGroups = this.createHasManyThroughRepositoryFactoryFor(
      'keycloakGroups',
      keycloakGroupRepositoryGetter,
      userGroupMembershipRepositoryGetter,
    );
    this.registerInclusionResolver('keycloakGroups', this.keycloakGroups.inclusionResolver);
  }

  async getUserRoles(id: string): Promise<KeycloakRole[]> {
    const groups = await this.keycloakGroups(id).find({fields: {id: true}});

    return Promise.all(
      groups.map(({id}) => this.keycloakGroupRepository.keycloakRoles(id).find({fields: {name: true}})),
    ).then(res => res.flat().filter(x => x));
  }

  async getServiceUser(clientId: string): Promise<(UserEntity & UserEntityRelations) | null> {
    return this.findOne({
      where: {serviceAccountClientLink: clientId},
    });
  }

  /**
   * Get user entity representation with all associated attributes
   * @param userId string
   * @param group: GROUPS
   */
  async getUserWithAttributes(
    userId: string,
    group: GROUPS,
    userAttributeFilter?: Filter<UserAttribute>,
  ): Promise<(UserEntity & UserEntityRelations) | null> {
    const user: UserEntity & UserEntityRelations = await this.findById(userId, {
      include: [
        {relation: 'userAttributes', scope: userAttributeFilter},
        {relation: 'keycloakGroups', scope: {where: {name: group}}},
      ],
    });
    return user?.keycloakGroups.length ? user : null;
  }

  /**
   * Get an array of user entity representation based on given filter and group
   * @param filter: Filter<UserEntity>
   * @param group: GROUPS
   * @returns Promise<(UserEntity & UserEntityRelations)[] | []
   */
  async searchUserWithAttributesByFilter(
    filter: Filter<UserEntity>,
    group: GROUPS,
  ): Promise<(UserEntity & UserEntityRelations)[] | []> {
    Object.assign(filter, {
      include: [{relation: 'userAttributes'}, {relation: 'keycloakGroups', scope: {where: {name: group}}}],
    });
    return (await this.find(filter)).filter(userEntity => userEntity.keycloakGroups?.length);
  }
}

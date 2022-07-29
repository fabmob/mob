import {inject} from '@loopback/core';
import {
  Count,
  CountSchema,
  repository,
  Where,
  AnyObject,
  Filter,
} from '@loopback/repository';
import {
  post,
  patch,
  param,
  get,
  del,
  getModelSchemaRef,
  requestBody,
} from '@loopback/rest';
import {SecurityBindings} from '@loopback/security';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';

import {head, omit, orderBy, capitalize, isEqual, intersection} from 'lodash';

import {
  UserRepository,
  CommunityRepository,
  UserEntityRepository,
  KeycloakGroupRepository,
} from '../repositories';
import {FunderService, KeycloakService, IUser} from '../services';
import {Community, KeycloakRole, User} from '../models';
import {
  ResourceName,
  StatusCode,
  SECURITY_SPEC_KC_PASSWORD,
  Roles,
  FUNDER_TYPE,
  GROUPS,
  AUTH_STRATEGY,
} from '../utils';
import {ValidationError} from '../validationError';
import {RequiredActionAlias} from 'keycloak-admin/lib/defs/requiredActionProviderRepresentation';

export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(KeycloakGroupRepository)
    public keycloakGroupRepository: KeycloakGroupRepository,
    @repository(UserEntityRepository)
    public userEntityRepository: UserEntityRepository,
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
    @inject('services.KeycloakService')
    public kcService: KeycloakService,
    @inject('services.FunderService')
    public funderService: FunderService,
    @inject(SecurityBindings.USER)
    private currentUser: IUser,
  ) {}

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/users/funders/count', {
    'x-controller-name': 'Users',
    summary: "Récupère le nombre d'utilisateurs financeurs",
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'User model count',
        content: {
          'application/json': {
            schema: {...CountSchema, ...{title: 'Count'}},
          },
        },
      },
    },
  })
  async count(@param.where(User) where?: Where<User>): Promise<Count> {
    return this.userRepository.count(where);
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/users/funders', {
    'x-controller-name': 'Users',
    summary: 'Retourne les utilisateurs financeurs',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Array of User model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(User),
            },
          },
        },
      },
    },
  })
  async find(@param.filter(User) filter?: Filter<User>): Promise<User[]> {
    const funders = await this.funderService.getFunders();
    const users: User[] = await this.userRepository.find(filter);

    const usersResult: any[] =
      users &&
      users.map(async (user: any) => {
        const funder: any =
          funders && funders.find((fnd: any) => fnd.id === user.funderId);

        let communities = undefined;
        if (user.communityIds && user.communityIds.length >= 0) {
          communities = await Promise.all(
            user.communityIds?.map((id: string) =>
              this.communityRepository.find({
                where: {id},
                fields: {name: true},
              }),
            ),
          );
        }

        const community: Community[] | undefined = communities?.map(
          (res: any) => res[0].name,
        );

        const roles: KeycloakRole[] = await this.userEntityRepository.getUserRoles(
          user.id,
        );

        const rolesFormatted: string[] = roles.map(({name}) => name);

        const funderRoles: string[] =
          await this.keycloakGroupRepository.getSubGroupFunderRoles();

        const funderRolesUser: string[] = intersection(
          rolesFormatted,
          funderRoles,
        ).filter(x => x);

        const rolesMatchedAndMapped =
          funderRolesUser &&
          funderRolesUser
            .map((elt: string) => capitalize(elt.replace(/s$/, '')))
            .join(' ; ');

        return {
          ...user,
          funderType: capitalize(funder.funderType),
          communityName: community
            ? community.join(' ; ')
            : rolesMatchedAndMapped === 'Superviseur'
            ? ''
            : funderRolesUser
            ? 'Ensemble du périmètre financeur'
            : null,
          funderName: funder.name,
          roles: rolesMatchedAndMapped,
        };
      });

    const resolved = await Promise.all(
      orderBy(usersResult, ['funderName', 'lastName'], ['asc']),
    );

    return resolved;
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @post('/v1/users', {
    'x-controller-name': 'Users',
    summary: 'Crée un utilisateur financeur',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'User financeur model instance',
        content: {'application/json': {schema: getModelSchemaRef(User)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User),
        },
      },
    })
    user: User,
  ): Promise<any> {
    let keycloakResult;
    try {
      const funders = await this.funderService.getFunders();
      const fundersFiltered = head(funders.filter(({id}) => id === user.funderId));

      if (fundersFiltered) {
        const {name, funderType, emailFormat} = fundersFiltered;
        if (
          funderType === FUNDER_TYPE.collectivity ||
          emailFormat.some((format: string) => user.email.endsWith(format))
        ) {
          const availableRoles =
            await this.keycloakGroupRepository.getSubGroupFunderRoles();
          const {roles, funderId, communityIds} = user;

          if (isEqual(intersection(availableRoles, roles).sort(), roles.sort())) {
            const availableCommunities: Community[] =
              await this.communityRepository.findByFunderId(funderId);
            const conditionNoCommunities =
              (!communityIds || communityIds.length === 0) &&
              availableCommunities &&
              availableCommunities.length === 0;

            const conditionMismatch =
              !conditionNoCommunities &&
              communityIds &&
              isEqual(
                intersection(
                  availableCommunities.map(({id}) => id),
                  communityIds,
                ).sort(),
                communityIds.sort(),
              );

            if (
              !roles.includes(Roles.MANAGERS) ||
              (roles.includes(Roles.MANAGERS) &&
                (conditionNoCommunities || conditionMismatch))
            ) {
              const actions: RequiredActionAlias[] = [
                RequiredActionAlias.VERIFY_EMAIL,
                RequiredActionAlias.UPDATE_PASSWORD,
              ];
              keycloakResult = await this.kcService.createUserKc(
                {
                  ...user,
                  funderName: name,
                  group: [
                    `/${
                      funderType === FUNDER_TYPE.collectivity
                        ? GROUPS.collectivities
                        : GROUPS.enterprises
                    }/${name}`,
                    ...user.roles.map(role => `${GROUPS.funders}/${role}`),
                  ],
                },
                actions,
              );
              if (keycloakResult && keycloakResult.id) {
                user.id = keycloakResult.id;
                const propertiesToOmit = roles.includes(Roles.MANAGERS)
                  ? ['password', 'roles']
                  : ['password', 'roles', 'communityIds'];
                const userRepo = omit(user, propertiesToOmit);

                await this.userRepository.create(userRepo);

                // Send mail to set password and activate account.
                await this.kcService.sendExecuteActionsEmailUserKc(
                  keycloakResult.id,
                  actions,
                );

                // returning id because of react-admin specifications
                return {
                  id: userRepo.id,
                  email: userRepo.email,
                  lastName: userRepo.lastName,
                  firstName: userRepo.firstName,
                };
              }
              return keycloakResult;
            }
            throw new ValidationError(
              `users.error.communities.mismatch`,
              `/users`,
              StatusCode.UnprocessableEntity,
              ResourceName.User,
            );
          }
          throw new ValidationError(
            `users.error.roles.mismatch`,
            `/users`,
            StatusCode.UnprocessableEntity,
            ResourceName.User,
          );
        }

        throw new ValidationError(
          `email.error.emailFormat`,
          `/users`,
          StatusCode.UnprocessableEntity,
          ResourceName.User,
        );
      }
      throw new ValidationError(
        `users.error.funders.missed`,
        `/users`,
        StatusCode.UnprocessableEntity,
        ResourceName.User,
      );
    } catch (error) {
      if (keycloakResult && keycloakResult.id) {
        await this.kcService.deleteUserKc(keycloakResult.id);
      }
      throw error;
    }
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/users/roles', {
    'x-controller-name': 'Users',
    summary: 'Retourne les rôles des utilisateurs financeurs',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Array of roles',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  })
  async getRolesForUsers(): Promise<String[]> {
    return this.keycloakGroupRepository.getSubGroupFunderRoles();
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({
    allowedRoles: [Roles.CONTENT_EDITOR, Roles.FUNDERS],
  })
  @get('/v1/users/{userId}', {
    'x-controller-name': 'Users',
    summary: "Retourne les informations de l'utilisateur financeur",
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'User model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User),
          },
        },
      },
    },
  })
  async findUserById(
    @param.path.string('userId', {
      description: `L'identifiant de l'utilisateur financeur`,
    })
    userId: string,
  ): Promise<AnyObject> {
    const isContentEditor = this.currentUser?.roles?.includes(Roles.CONTENT_EDITOR);

    if (this.currentUser?.id !== userId && !isContentEditor) {
      throw new ValidationError(`Access Denied`, `/authorization`, StatusCode.Forbidden);
    }

    const rolesQuery: KeycloakRole[] = await this.userEntityRepository.getUserRoles(
      userId,
    );
    const rolesFormatted: string[] = rolesQuery.map(({name}) => name);
    const user: User = await this.userRepository.findById(userId);

    const res: any = {
      ...user,
      roles: rolesFormatted,
    };

    return res;
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @patch('/v1/users/{userId}', {
    'x-controller-name': 'Users',
    summary: 'Modifie un utilisateur financeur',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Utilisateur patch success',
      },
    },
  })
  async updateById(
    @param.path.string('userId', {
      description: `L'identifiant de l'utilisateur financeur`,
    })
    userId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {title: 'UserUpdate', partial: true}),
        },
      },
    })
    user: User,
  ): Promise<{id: string}> {
    const userRepo: User = await this.userRepository.findById(userId);
    if (userRepo) {
      const {roles} = user;
      const propertiesToOmit = ['roles'];
      user.communityIds = roles.includes(Roles.MANAGERS) ? user.communityIds : [];
      const userOmit = omit(user, propertiesToOmit);
      await this.kcService.updateUserGroupsKc(userId, roles);
      await this.kcService.updateUser(userId, userOmit);
      await this.userRepository.updateById(userId, userOmit);
    }
    return {id: userId};
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @del('/v1/users/{userId}', {
    'x-controller-name': 'Users',
    summary: 'Supprime un utilisateur financeur',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'utilisateur DELETE success',
      },
    },
  })
  async deleteById(
    @param.path.string('userId', {
      description: `L'identifiant de l'utilisateur financeur`,
    })
    userId: string,
  ): Promise<{id: string}> {
    await this.kcService.deleteUserKc(userId);
    await this.userRepository.deleteById(userId);
    return {id: userId};
  }
}

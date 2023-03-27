import {inject, intercept} from '@loopback/core';
import {Count, CountSchema, repository, Where, AnyObject, Filter} from '@loopback/repository';
import {post, patch, param, get, del, getModelSchemaRef, requestBody, RestBindings} from '@loopback/rest';
import {SecurityBindings} from '@loopback/security';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';

import {omit, orderBy, capitalize, intersection} from 'lodash';

import {
  UserRepository,
  CommunityRepository,
  UserEntityRepository,
  KeycloakGroupRepository,
  FunderRepository,
} from '../repositories';
import {KeycloakService} from '../services';
import {Community, CommunityRelations, Funder, KeycloakRole, User} from '../models';
import {
  StatusCode,
  SECURITY_SPEC_KC_PASSWORD,
  Roles,
  GROUPS,
  AUTH_STRATEGY,
  IUsersResult,
  IUser,
  Logger,
  FUNDER_TYPE,
} from '../utils';
import {ForbiddenError} from '../validationError';
import {RequiredActionAlias} from 'keycloak-admin/lib/defs/requiredActionProviderRepresentation';
import {defaultSwaggerError} from './utils/swagger-errors';
import {UserInterceptor} from '../interceptors';
import express, {Request, Response} from 'express';
@intercept(UserInterceptor.BINDING_KEY)
export class UserController {
  constructor(
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(KeycloakGroupRepository)
    public keycloakGroupRepository: KeycloakGroupRepository,
    @repository(UserEntityRepository)
    public userEntityRepository: UserEntityRepository,
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
    @repository(FunderRepository)
    public funderRepository: FunderRepository,
    @inject('services.KeycloakService')
    public kcService: KeycloakService,
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
        description: "Le nombre d'utilisateurs financeurs",
        content: {
          'application/json': {
            schema: {...CountSchema, ...{title: 'Count'}},
          },
        },
      },
      ...defaultSwaggerError,
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
        description: 'La liste des utilisateurs financeurs',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(User),
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async find(@param.filter(User) filter?: Filter<User>): Promise<IUsersResult[]> {
    try {
      const funderList: Funder[] = await this.funderRepository.find();
      Logger.debug(UserController.name, this.find.name, 'Funders data', funderList);

      const users: User[] = await this.userRepository.find(filter);
      Logger.debug(UserController.name, this.find.name, 'Users data', users);

      const usersResult: Promise<IUsersResult>[] =
        users &&
        users.map(async (user: User) => {
          const funder: Funder | undefined =
            funderList && funderList.find((fnd: Funder) => fnd.id === user.funderId);

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

          const community: string[] | undefined = communities?.map(
            (res: (Community & CommunityRelations)[]) => res[0].name,
          );
          Logger.debug(UserController.name, this.find.name, 'Community data', community);

          const roles: KeycloakRole[] = await this.userEntityRepository.getUserRoles(user.id);
          Logger.debug(UserController.name, this.find.name, 'Roles data', roles);

          const rolesFormatted: string[] = roles.map(({name}) => name);

          const funderRoles: string[] = await this.keycloakGroupRepository.getSubGroupFunderRoles();
          Logger.debug(UserController.name, this.find.name, 'Funders Roles data', funderRoles);

          const funderRolesUser: string[] = intersection(rolesFormatted, funderRoles).filter(x => x);
          Logger.debug(UserController.name, this.find.name, 'Funders Roles users data', funderRolesUser);

          const rolesMatchedAndMapped =
            funderRolesUser &&
            funderRolesUser.map((elt: string) => capitalize(elt.replace(/s$/, ''))).join(' ; ');

          Logger.debug(
            UserController.name,
            this.find.name,
            'Roles matched and mapped data',
            rolesMatchedAndMapped,
          );

          return {
            ...user,
            funderType: capitalize(funder?.type),
            communityName: community
              ? community.join(' ; ')
              : rolesMatchedAndMapped === 'Superviseur'
              ? ''
              : funderRolesUser
              ? 'Ensemble du périmètre financeur'
              : null,
            funderName: funder?.name,
            roles: rolesMatchedAndMapped,
          };
        });

      const resolved = await Promise.all(orderBy(usersResult, ['funderName', 'lastName'], ['asc']));
      Logger.debug(UserController.name, this.find.name, 'Users result ordered', resolved);
      return resolved;
    } catch (error) {
      Logger.error(UserController.name, this.find.name, 'Error', error);
      throw error;
    }
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @post('/v1/users', {
    'x-controller-name': 'Users',
    summary: 'Crée un utilisateur financeur',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Created]: {
        description: "L'utilisateur financeur est crée",
        content: {'application/json': {schema: getModelSchemaRef(User)}},
      },
      ...defaultSwaggerError,
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            exclude: ['id'],
            title: 'CreateUser',
          }),
        },
      },
    })
    user: User,
  ): Promise<{id: string}> {
    this.response.status(201);
    let keycloakResult: {id: string} = {id: ''};
    try {
      const funder: Funder = await this.funderRepository.findById(user.funderId);
      Logger.debug(UserController.name, this.create.name, 'Funders data', funder);

      const FUNDER_TO_GROUPS: {[key: string]: GROUPS} = {
        [FUNDER_TYPE.ENTERPRISE]: GROUPS.enterprises,
        [FUNDER_TYPE.COLLECTIVITY]: GROUPS.collectivities,
        [FUNDER_TYPE.NATIONAL]: GROUPS.administrations_nationales,
      };

      const {roles} = user;

      const actions: RequiredActionAlias[] = [
        RequiredActionAlias.VERIFY_EMAIL,
        RequiredActionAlias.UPDATE_PASSWORD,
      ];
      keycloakResult = await this.kcService.createUserKc(
        new User(user),
        [
          `/${FUNDER_TO_GROUPS[funder.type]}/${funder.name}`,
          ...user.roles.map(role => `${GROUPS.funders}/${role}`),
        ],
        actions,
      );

      if (keycloakResult && keycloakResult.id) {
        Logger.info(UserController.name, this.create.name, 'Funder created in KC', keycloakResult.id);

        user.id = keycloakResult.id;
        const propertiesToOmit = roles.includes(Roles.MANAGERS)
          ? ['password', 'roles']
          : ['password', 'roles', 'communityIds'];
        const userRepo = omit(user, propertiesToOmit);

        await this.userRepository.create(userRepo);
        Logger.info(UserController.name, this.create.name, 'Funder created in Mongo', keycloakResult.id);

        // Send mail to set password and activate account.
        await this.kcService.sendExecuteActionsEmailUserKc(keycloakResult.id, actions);
        Logger.info(UserController.name, this.create.name, 'Execute action email sent', keycloakResult.id);

        // returning id because of react-admin specifications
        return {
          id: userRepo.id!,
        };
      }
      return keycloakResult;
    } catch (error) {
      if (keycloakResult && keycloakResult.id) {
        await this.kcService.deleteUserKc(keycloakResult.id);
      }
      Logger.error(UserController.name, this.create.name, 'Error', error);
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
        description: 'La liste des rôles des utilisateurs financeurs',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'string',
                example: '',
              },
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async getRolesForUsers(): Promise<String[]> {
    try {
      return await this.keycloakGroupRepository.getSubGroupFunderRoles();
    } catch (error) {
      Logger.error(UserController.name, this.getRolesForUsers.name, 'Error', error);
      throw error;
    }
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
        description: "Les informations de l'utilisateur financeur",
        content: {
          'application/json': {
            schema: getModelSchemaRef(User),
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async findUserById(
    @param.path.string('userId', {
      description: `L'identifiant de l'utilisateur financeur`,
    })
    userId: string,
  ): Promise<AnyObject> {
    try {
      const isContentEditor = this.currentUser?.roles?.includes(Roles.CONTENT_EDITOR);
      Logger.debug(UserController.name, this.findUserById.name, 'Is content editor', isContentEditor);

      if (this.currentUser?.id !== userId && !isContentEditor) {
        throw new ForbiddenError(UserController.name, this.findUserById.name, {
          currentUserId: this.currentUser?.id,
          isContentEditor: isContentEditor,
        });
      }

      const rolesQuery: KeycloakRole[] = await this.userEntityRepository.getUserRoles(userId);

      const rolesFormatted: string[] = rolesQuery.map(({name}) => name);
      Logger.debug(UserController.name, this.findUserById.name, 'Roles data', rolesFormatted);

      const user: User = await this.userRepository.findById(userId);
      Logger.debug(UserController.name, this.findUserById.name, 'User data', user);

      const res: any = {
        ...user,
        roles: rolesFormatted,
      };

      return res;
    } catch (error) {
      Logger.error(UserController.name, this.findUserById.name, 'Error', error);
      throw error;
    }
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @patch('/v1/users/{userId}', {
    'x-controller-name': 'Users',
    summary: 'Modifie un utilisateur financeur',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: "Modification de l'utilisateur financeur reussie",
      },
      ...defaultSwaggerError,
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
  ): Promise<void> {
    try {
      const userRepo: User = await this.userRepository.findById(userId);
      Logger.debug(UserController.name, this.updateById.name, 'User data', userRepo);

      const {roles} = user;

      if (user.communityIds) {
        user.communityIds = roles.includes(Roles.MANAGERS) ? user.communityIds : [];
      }

      await this.kcService.updateUserGroupsKc(userId, roles);
      Logger.info(UserController.name, this.updateById.name, 'User group updated', userId);

      await this.kcService.updateUserKC(userId, Object.assign(userRepo, user));
      Logger.info(UserController.name, this.updateById.name, 'User updated in KC', userId);

      await this.userRepository.updateById(userId, user);
      Logger.info(UserController.name, this.updateById.name, 'User updated in Mongo', userId);
    } catch (error) {
      Logger.error(UserController.name, this.updateById.name, 'Error', error);
      throw error;
    }
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @del('/v1/users/{userId}', {
    'x-controller-name': 'Users',
    summary: 'Supprime un utilisateur financeur',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: "Supprimer l'utilisateur financeur",
      },
      ...defaultSwaggerError,
    },
  })
  async deleteById(
    @param.path.string('userId', {
      description: `L'identifiant de l'utilisateur financeur`,
    })
    userId: string,
  ): Promise<{id: string}> {
    try {
      await this.kcService.deleteUserKc(userId);
      Logger.info(UserController.name, this.deleteById.name, 'User deleted in KC', userId);

      await this.userRepository.deleteById(userId);
      Logger.info(UserController.name, this.deleteById.name, 'User deleted in Mongo', userId);

      return {id: userId};
    } catch (error) {
      Logger.error(UserController.name, this.deleteById.name, 'Error', error);
      throw error;
    }
  }
}

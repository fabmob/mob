import {injectable, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';

import KcAdminClient from 'keycloak-admin';
import {RequiredActionAlias} from 'keycloak-admin/lib/defs/requiredActionProviderRepresentation';
import UserRepresentation from 'keycloak-admin/lib/defs/userRepresentation';
import {head, startCase} from 'lodash';

import {Citizen, GroupAttribute, KeycloakGroup, KeycloakGroupRelations, User} from '../models';

import {baseUrl, realmName, credentials} from '../constants';
import {ResourceName, StatusCode, GROUPS, Consent, IUser, IDP_EMAIL_TEMPLATE, Logger} from '../utils';
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  UnprocessableEntityError,
} from '../validationError';
import {KeycloakGroupRepository, UserEntityRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class KeycloakService {
  keycloakAdmin: KcAdminClient;

  constructor(
    @repository(KeycloakGroupRepository)
    public keycloakGroupRepository: KeycloakGroupRepository,
    @repository(UserEntityRepository)
    public userEntityRepository: UserEntityRepository,
  ) {
    this.keycloakAdmin = new KcAdminClient({
      baseUrl,
      realmName,
    });
  }

  /**
   * Create KC User (citizen or funder user)
   * @param user Citizen | User
   * @param groupList string[]
   * @param actionList RequiredActionAlias[]
   */
  createUserKc(
    user: Citizen | User,
    groupList: string[],
    actionList: RequiredActionAlias[],
  ): Promise<{id: string}> {
    let userToCreate: UserRepresentation = {};

    if (user instanceof Citizen) {
      userToCreate = {
        ...user.toUserRepresentation(),
        groups: groupList,
        emailVerified: false,
        enabled: true,
        credentials: [
          {
            temporary: false,
            type: 'password',
            value: user.password,
          },
        ],
        requiredActions: actionList,
      };
    }

    if (user instanceof User) {
      userToCreate = {
        username: user.email,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        groups: groupList,
        emailVerified: false,
        enabled: true,
        attributes: {
          emailTemplate: IDP_EMAIL_TEMPLATE.FUNDER,
          funderName: startCase(groupList[0].split('/')[2]),
        },
        requiredActions: actionList,
      };
    }
    return this.keycloakAdmin
      .auth(credentials)
      .then(() => this.keycloakAdmin.users.create(userToCreate))
      .catch(err => {
        if (err && err.response) {
          const {status, data} = err.response;

          if (status === StatusCode.Conflict) {
            throw new ConflictError(
              KeycloakService.name,
              this.createUserKc.name,
              `email.error.unique`,
              '/personalInformation.email.value',
              ResourceName.Account,
              user instanceof User ? user.email : user.personalInformation.email.value,
            );
          } else if (status === 400 && data && data.errorMessage === 'Password policy not met') {
            throw new UnprocessableEntityError(
              KeycloakService.name,
              this.createUserKc.name,
              `password.error.format`,
              '/password',
              ResourceName.Account,
              user instanceof User ? '' : user.password,
            );
          }
        }
        throw new InternalServerError(KeycloakService.name, this.createUserKc.name, err.message);
      });
  }

  async updateUserGroupsKc(id: string, roles: string[]): Promise<string> {
    const groups = await this.keycloakGroupRepository.getSubGroupFunder();
    const newRoles = roles.map(role => {
      return groups.find(group => group.name === role);
    });
    return this.keycloakAdmin
      .auth(credentials)
      .then(() => {
        return Promise.all(
          groups.map(async group => {
            await this.keycloakAdmin.users.delFromGroup({id, groupId: group.id});
          }),
        );
      })
      .then(() => {
        return Promise.all(
          newRoles.map(async newRole => {
            newRole && (await this.addUserGroupMembership(id, newRole.id));
          }),
        );
      })
      .catch(err => err);
  }

  deleteUserKc(id: string): Promise<{id: string} | string> {
    return this.keycloakAdmin
      .auth(credentials)
      .then(() => this.keycloakAdmin.users.del({id}))
      .catch(err => err);
  }

  addUserGroupMembership(id: string, groupId: string): Promise<void> {
    return this.keycloakAdmin
      .auth(credentials)
      .then(() => this.keycloakAdmin.users.addToGroup({id, groupId}))
      .catch(err => err);
  }

  /**
   * Update user in Keycloak
   * @param id string
   * @param user Citizen | User
   * @returns void
   */
  updateUserKC(id: string, user: Citizen | User): Promise<void> {
    let userToUpdate: UserRepresentation = {};
    if (user instanceof Citizen) {
      // ⚠ You cannot update only one attributes with this KC API call.
      // If you do so, it will remove all other attributes
      userToUpdate = {
        attributes: {...user.toUserRepresentation().attributes},
      };
    }

    if (user instanceof User) {
      userToUpdate = {
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }
    return this.keycloakAdmin
      .auth(credentials)
      .then(() => this.keycloakAdmin.users.update({id: id}, userToUpdate))
      .catch(err => {
        Logger.error(KeycloakService.name, this.updateUserKC.name, 'Error', err);
        err;
      });
  }

  createGroupKc(name: string, type: GROUPS): Promise<{id: string}> {
    return this.keycloakAdmin
      .auth(credentials)
      .then(() =>
        this.keycloakAdmin.groups.find({
          search: type,
        }),
      )
      .then((res): Promise<{id: string}> => {
        const topGroup = head(res);

        if (!!topGroup && topGroup.id) {
          return this.keycloakAdmin.groups.setOrCreateChild({id: topGroup.id}, {name});
        } else {
          throw new BadRequestError(
            KeycloakService.name,
            this.createGroupKc.name,
            `${type}.error.topgroup`,
            `/${type}`,
            ResourceName.Enterprise,
            res,
          );
        }
      })
      .catch(err => {
        Logger.error(KeycloakService.name, this.createGroupKc.name, 'Error', err.message);
        if (err && err.response) {
          const {status} = err.response;

          if (status === StatusCode.Conflict) {
            throw new ConflictError(
              KeycloakService.name,
              this.createGroupKc.name,
              `${type}.error.name.unique`,
              `/${type}`,
              ResourceName.Enterprise,
              type,
            );
          }
        }

        if (err && err.statusCode === StatusCode.BadRequest) {
          throw new BadRequestError(
            KeycloakService.name,
            this.createGroupKc.name,
            `${type}.error.topgroup`,
            `/${type}`,
            ResourceName.Enterprise,
            err,
          );
        }

        throw new InternalServerError(KeycloakService.name, this.createGroupKc.name, err);
      });
  }

  deleteGroupKc(id: string): Promise<void> {
    return this.keycloakAdmin
      .auth(credentials)
      .then(() => this.keycloakAdmin.groups.del({id}))
      .catch(err => {
        Logger.error(KeycloakService.name, this.deleteGroupKc.name, 'Error', err);
        err;
      });
  }

  sendExecuteActionsEmailUserKc(id: string, actions: RequiredActionAlias[]): Promise<void> {
    return this.keycloakAdmin
      .auth(credentials)
      .then(() => this.keycloakAdmin.users.executeActionsEmail({id, actions}))
      .catch(err => {
        Logger.error(KeycloakService.name, this.sendExecuteActionsEmailUserKc.name, 'Error', err);
        err;
      });
  }

  async listConsents(id: string): Promise<Consent[]> {
    return this.keycloakAdmin
      .auth(credentials)

      .then(() => this.keycloakAdmin.users.listConsents({id}))

      .catch(err => err);
  }

  async deleteConsent(id: string, clientId: string): Promise<void> {
    return this.keycloakAdmin
      .auth(credentials)

      .then(() => this.keycloakAdmin.users.revokeConsent({id, clientId}))

      .catch(err => err);
  }

  async getUser(id: string): Promise<IUser> {
    return this.keycloakAdmin
      .auth(credentials)
      .then(() => this.keycloakAdmin.users.findOne({id}))
      .catch(err => err);
  }

  async listUserGroups(id: string): Promise<[{id: string}]> {
    return this.keycloakAdmin
      .auth(credentials)

      .then(() => this.keycloakAdmin.users.listGroups({id}))

      .catch(err => err);
  }

  /**
   * Get attributes from keycloak group
   * @param attributeNames: List of attributes to return. Example : ["attribute1", "attribute2"]
   * @param funderName
   * @param funderId
   * @returns Object of attributes with their values
   */
  async getAttributesFromGroup(
    attributeNames: string[],
    funderName: string,
    funderId?: string,
  ): Promise<{[key: string]: string | undefined}> {
    const group: (KeycloakGroup & KeycloakGroupRelations) | null = funderId
      ? await this.keycloakGroupRepository.getGroupById(funderId)
      : await this.keycloakGroupRepository.getGroupByName(funderName);

    if (group) {
      const attributes: GroupAttribute[] = await this.keycloakGroupRepository
        .groupAttributes(group?.id)
        .find({
          where: {
            name: {inq: attributeNames},
          },
        });

      return attributes.reduce((obj: {[key: string]: string | undefined}, attribute: GroupAttribute) => {
        if (attribute.name) {
          obj[attribute.name] = attribute.value;
        }
        return obj;
      }, {});
    }
    return {};
  }
}

import {injectable, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';

import KcAdminClient from 'keycloak-admin';
import {RequiredActionAlias} from 'keycloak-admin/lib/defs/requiredActionProviderRepresentation';
import UserRepresentation from 'keycloak-admin/lib/defs/userRepresentation';
import {head, startCase} from 'lodash';

import {baseUrl, realmName, credentials} from '../constants';
import {ResourceName, StatusCode, GROUPS, IDP_EMAIL_TEMPLATE, Consent} from '../utils';
import {ValidationError} from '../validationError';
import {KeycloakGroupRepository} from '../repositories';

interface User {
  email: string;
  password?: string;
  funderName?: string;
  lastName: string;
  firstName: string;
  group: string[];
}

@injectable({scope: BindingScope.TRANSIENT})
export class KeycloakService {
  keycloakAdmin: KcAdminClient;

  constructor(
    @repository(KeycloakGroupRepository)
    public keycloakGroupRepository: KeycloakGroupRepository,
  ) {
    this.keycloakAdmin = new KcAdminClient({
      baseUrl,
      realmName,
    });
  }

  createUserKc(user: User, actions: RequiredActionAlias[]): Promise<{id: string}> {
    const {email, firstName, lastName, password, group, funderName} = user;

    return this.keycloakAdmin
      .auth(credentials)
      .then(() =>
        this.keycloakAdmin.users.create({
          username: email,
          email,
          firstName,
          lastName,
          emailVerified: false,
          enabled: true,
          groups: group,
          attributes: {
            emailTemplate: group.some(group => group.includes(GROUPS.citizens))
              ? IDP_EMAIL_TEMPLATE.CITIZEN
              : IDP_EMAIL_TEMPLATE.FUNDER,
            funderName: startCase(funderName),
          },
          credentials: password
            ? [
                {
                  temporary: false,
                  type: 'password',
                  value: password,
                },
              ]
            : undefined,
          requiredActions: actions,
        }),
      )
      .catch(err => {
        if (err && err.response) {
          const {status, data} = err.response;

          if (status === StatusCode.Conflict)
            throw new ValidationError(
              `email.error.unique`,
              '/email',
              StatusCode.Conflict,
              ResourceName.Account,
            );
          else if (
            status === 400 &&
            data &&
            data.errorMessage === 'Password policy not met'
          )
            throw new ValidationError(
              `password.error.format`,
              '/password',
              StatusCode.PreconditionFailed,
              ResourceName.Account,
            );
        }
        throw new ValidationError(`cannot connect to IDP or add user`, '');
      });
  }

  async updateUserGroupsKc(id: string, roles: string[]): Promise<any> {
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
            newRole &&
              (await this.keycloakAdmin.users.addToGroup({id, groupId: newRole.id}));
          }),
        );
      })
      .catch(err => err);
  }

  deleteUserKc(id: string): any {
    return this.keycloakAdmin
      .auth(credentials)
      .then(() => this.keycloakAdmin.users.del({id}))
      .catch(err => err);
  }

  updateUser(id: string, newUser: UserRepresentation): any {
    return this.keycloakAdmin
      .auth(credentials)
      .then(() =>
        this.keycloakAdmin.users.update(
          {id},
          {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
          },
        ),
      )
      .catch(err => err);
  }

  createGroupKc(name: string, type: GROUPS): any {
    return this.keycloakAdmin
      .auth(credentials)
      .then(() =>
        this.keycloakAdmin.groups.find({
          search: type,
        }),
      )
      .then((res): any => {
        const topGroup = head(res);

        if (!!topGroup && topGroup.id)
          return this.keycloakAdmin.groups.setOrCreateChild({id: topGroup.id}, {name});
        else
          throw new ValidationError(
            `${type}.error.topgroup`,
            `/${type}`,
            StatusCode.PreconditionFailed,
            ResourceName.Enterprise,
          );
      })
      .catch((err: any) => {
        if (err && err.response) {
          const {status} = err.response;

          if (status === StatusCode.Conflict)
            throw new ValidationError(
              `${type}.error.name.unique`,
              `/${type}`,
              StatusCode.Conflict,
              ResourceName.Enterprise,
            );
        }
        if (err instanceof ValidationError) throw err;

        throw new ValidationError(`cannot connect to IDP or add group`, '');
      });
  }

  deleteGroupKc(id: string): any {
    return this.keycloakAdmin
      .auth(credentials)
      .then(() => this.keycloakAdmin.groups.del({id}))
      .catch(err => err);
  }

  sendExecuteActionsEmailUserKc(
    id: string,
    actions: RequiredActionAlias[],
  ): Promise<void> {
    return this.keycloakAdmin
      .auth(credentials)
      .then(() => this.keycloakAdmin.users.executeActionsEmail({id, actions}))
      .catch(err => err);
  }

  async disableUserKc(id: string): Promise<object> {
    return this.keycloakAdmin
      .auth(credentials)
      .then(() => this.keycloakAdmin.users.update({id}, {enabled: false}))
      .catch(err => err);
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

  async listUsers(): Promise<[{id: string}]> {
    return this.keycloakAdmin
      .auth(credentials)

      .then(() => this.keycloakAdmin.users.find())

      .catch(err => err);
  }

  async listUserGroups(id: string): Promise<[{id: string}]> {
    return this.keycloakAdmin
      .auth(credentials)

      .then(() => this.keycloakAdmin.users.listGroups({id}))

      .catch(err => err);
  }
}

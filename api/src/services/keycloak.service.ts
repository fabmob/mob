import {injectable, BindingScope} from '@loopback/core';
import {AnyObject, repository} from '@loopback/repository';

import KcAdminClient from 'keycloak-admin';
import {RequiredActionAlias} from 'keycloak-admin/lib/defs/requiredActionProviderRepresentation';
import UserRepresentation from 'keycloak-admin/lib/defs/userRepresentation';
import {head, startCase} from 'lodash';

import {KeycloakGroup, KeycloakGroupRelations} from '../models';
import {PersonalInformation} from '../models/citizen/personalInformation.model';

import {baseUrl, realmName, credentials} from '../constants';
import {
  ResourceName,
  StatusCode,
  GROUPS,
  IDP_EMAIL_TEMPLATE,
  Consent,
  User,
  IUser,
} from '../utils';
import {ValidationError} from '../validationError';
import {KeycloakGroupRepository} from '../repositories';
import {Identity} from '../models/citizen/identity.model';

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
    const {email, firstName, lastName, password, group, funderName, birthdate, gender} =
      user;

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
            birthdate: birthdate,
            gender: gender,
            'identity.gender': JSON.stringify(user?.identity?.gender),
            'identity.lastName': JSON.stringify(user?.identity?.lastName),
            'identity.firstName': JSON.stringify(user?.identity?.firstName),
            'identity.birthDate': JSON.stringify(user?.identity?.birthDate),
            'personalInformation.email': JSON.stringify(user?.personalInformation?.email),
            'personalInformation.primaryPhoneNumber': JSON.stringify(
              user?.personalInformation?.primaryPhoneNumber,
            ),
            'personalInformation.secondaryPhoneNumber': JSON.stringify(
              user?.personalInformation?.secondaryPhoneNumber,
            ),
            'personalInformation.primaryPostalAddress': JSON.stringify(
              user?.personalInformation?.primaryPostalAddress,
            ),
            'personalInformation.secondaryPostalAddress': JSON.stringify(
              user?.personalInformation?.secondaryPostalAddress,
            ),
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
              '/personalInformation.email.value',
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

  updateUser(id: string, newUser: UserRepresentation): Promise<void> {
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
      .catch(err => {
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

  deleteGroupKc(id: string): Promise<void> {
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

      .then(() => this.keycloakAdmin.users.find({max: 9999999}))

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
   * Update Citizen Role
   * @param id Citizen Id
   * @param actionDelete Action for delete
   */
  async updateCitizenRole(
    id: string,
    groupName: string,
    actionDelete?: boolean,
  ): Promise<string> {
    const group: (KeycloakGroup & KeycloakGroupRelations) | null =
      await this.keycloakGroupRepository.getGroupByName(groupName);
    return this.keycloakAdmin
      .auth(credentials)
      .then(async () => {
        if (group && group.id) {
          if (actionDelete) {
            await this.keycloakAdmin.users.delFromGroup({id, groupId: group.id});
          } else {
            await this.keycloakAdmin.users.addToGroup({id, groupId: group.id});
          }
        }
      })
      .catch(err => err);
  }

  async updateCitizenAttributes(id: string, newCitizen: AnyObject): Promise<void> {
    const user: IUser = await this.getUser(id);
    return this.keycloakAdmin
      .auth(credentials)
      .then(() =>
        this.keycloakAdmin.users.update(
          {id},
          {
            attributes: {
              ...user.attributes,
              'identity.gender': JSON.stringify(newCitizen?.gender),
              'identity.lastName': JSON.stringify(newCitizen?.lastName),
              'identity.firstName': JSON.stringify(newCitizen?.firstName),
              'identity.birthDate': JSON.stringify(newCitizen?.birthDate),
              'identity.birthPlace': JSON.stringify(newCitizen?.birthPlace),
              'identity.birthCountry': JSON.stringify(newCitizen?.birthCountry),
              'personalInformation.email': JSON.stringify(newCitizen?.email),
              'personalInformation.primaryPhoneNumber': JSON.stringify(
                newCitizen?.primaryPhoneNumber,
              ),
              'personalInformation.secondaryPhoneNumber': JSON.stringify(
                newCitizen?.secondaryPhoneNumber,
              ),
              'personalInformation.primaryPostalAddress': JSON.stringify(
                newCitizen?.primaryPostalAddress,
              ),
              'personalInformation.secondaryPostalAddress': JSON.stringify(
                newCitizen?.secondaryPostalAddress,
              ),
            },
          },
        ),
      )
      .catch(err => err);
  }
}

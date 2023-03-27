import {injectable, BindingScope, service, inject} from '@loopback/core';
import {repository, Filter, Fields, AnyObject, Count} from '@loopback/repository';
import {capitalize} from 'lodash';
import {sub, format, fromUnixTime, add, differenceInCalendarDays} from 'date-fns';

import {SecurityBindings, UserProfile} from '@loopback/security';

import {RequiredActionAlias} from 'keycloak-admin/lib/defs/requiredActionProviderRepresentation';
import * as Excel from 'exceljs';

import {
  UserEntity,
  OfflineUserSession,
  OfflineClientSession,
  Client,
  Citizen,
  Incentive,
  Subscription,
  AttachmentType,
  User,
  Affiliation,
  Enterprise,
  UserAttribute,
  KeycloakGroup,
  CitizenCreate,
} from '../models';
import {
  UserRepository,
  SubscriptionRepository,
  UserEntityRepository,
  ClientRepository,
  OfflineClientSessionRepository,
  OfflineUserSessionRepository,
  AffiliationRepository,
  FunderRepository,
  UserAttributeRepository,
} from '../repositories';

import {JwtService} from './jwt.service';
import {AffiliationService} from './affiliation.service';
import {KeycloakService} from './keycloak.service';
import {MailService} from './mail.service';

import {
  AFFILIATION_STATUS,
  USER_STATUS,
  ClientOfConsent,
  GROUPS,
  Roles,
  formatDateInFrenchNotation,
  Logger,
  Tab,
  EmployeesQueryParams,
  FilterCitizen,
  PartialCitizen,
} from '../utils';
import {composeWhere, parseScopes, preCheckFields} from '../utils/citizen';

import {WEBSITE_FQDN} from '../constants';
import {InternalServerError} from '../validationError';

const SubscriptionStatus: Record<string, string> = {
  A_TRAITER: 'à traiter',
  VALIDEE: 'validée',
  REJETEE: 'refusée',
};

// used to add style to sheet header cells
function styleHeaderCell(cell: Excel.Cell) {
  cell.alignment = {vertical: 'middle', horizontal: 'center'};
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {argb: '1ee146'},
  };
  cell.font = {
    size: 10,
    bold: true,
  };
}

@injectable({scope: BindingScope.TRANSIENT})
export class CitizenService {
  constructor(
    @repository(FunderRepository)
    public funderRepository: FunderRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @repository(UserEntityRepository)
    public userEntityRepository: UserEntityRepository,
    @repository(UserAttributeRepository)
    public userAttributeRepository: UserAttributeRepository,
    @repository(ClientRepository)
    public clientRepository: ClientRepository,
    @repository(OfflineClientSessionRepository)
    public offlineClientSessionRepository: OfflineClientSessionRepository,
    @repository(OfflineUserSessionRepository)
    public offlineUserSessionRepository: OfflineUserSessionRepository,
    @service(JwtService)
    public jwtService: JwtService,
    @service(AffiliationService)
    public affiliationService: AffiliationService,
    @inject(SecurityBindings.USER, {optional: true})
    private currentUser: UserProfile,
    @inject('services.KeycloakService')
    public kcService: KeycloakService,
    @inject('services.MailService')
    public mailService: MailService,
    @repository(AffiliationRepository)
    public affiliationRepository: AffiliationRepository,
  ) {}

  /**
   * Get salaries based on their affiliation status and lastName
   * @param EmployeesQueryParams
   */
  async getEnterpriseEmployees({
    funderId,
    status,
    lastName,
    skip = 0,
    limit,
  }: EmployeesQueryParams): Promise<PartialCitizen[] | []> {
    const userFilter: Filter<UserEntity> = {
      order: ['lastName ASC'],
      where: lastName ? {lastName: {regexp: new RegExp('.*' + lastName + '.*', 'i')}} : {},
      fields: {id: true},
      include: [{relation: 'userAttributes'}],
    };

    const affiliationFilter: Filter<Affiliation> = {
      where: {enterpriseId: funderId},
      limit,
      skip,
    };

    if (status) {
      affiliationFilter.where = {...affiliationFilter.where, status};
    } else {
      affiliationFilter.where = {...affiliationFilter.where, status: {neq: AFFILIATION_STATUS.UNKNOWN}};
    }

    const affiliatedCitizenList: PartialCitizen[] | [] = await this.findCitizenWithAffiliation(
      userFilter,
      affiliationFilter,
    );

    return affiliatedCitizenList;
  }

  /**
   * Get total of salaries based on their affiliation status and lastName
   * @param EmployeesQueryParams
   */
  async getEnterpriseEmployeesCount({funderId, status, lastName}: EmployeesQueryParams): Promise<Count> {
    const affiliationFilter: Filter<Affiliation> = {
      where: {enterpriseId: funderId},
    };

    if (status) {
      affiliationFilter.where = {...affiliationFilter.where, status};
    } else {
      affiliationFilter.where = {...affiliationFilter.where, status: {neq: AFFILIATION_STATUS.UNKNOWN}};
    }

    if (lastName) {
      const userFilter: Filter<UserEntity> = {
        where: {lastName: {regexp: new RegExp('.*' + lastName + '.*', 'i')}},
        fields: {id: true},
        include: [{relation: 'userAttributes'}],
      };

      const affiliatedCitizenList: PartialCitizen[] | [] = await this.findCitizenWithAffiliation(
        userFilter,
        affiliationFilter,
      );

      return {count: affiliatedCitizenList.length};
    } else {
      return this.affiliationRepository.count(affiliationFilter.where);
    }
  }

  /**
   * Generate Excel RGPD file that contains all user private data
   * @param citizen - user informations
   * @param companyName - company name
   * @param subscriptions - list of user subscriptions
   * @param incentives - list of incentives
   * @param listMaas - list of MAAS services names
   * @returns Excel Buffer
   */
  async generateExcelGDPR(
    citizen: Citizen,
    companyName: string,
    subscriptions: Subscription[],
    incentives: Incentive[],
    listMaas: string[],
  ): Promise<Excel.Buffer> {
    // Creation du excel book
    const workbook = new Excel.Workbook();

    // Creation du Sheet/onglet informations personnelles
    this.addSheetInformationsPers(workbook, citizen, companyName, listMaas);

    // Generate one Sheet/Tab for each incentive, each one contains list of user subscription by incentive
    this.addSheetSubscriptions(workbook, subscriptions, incentives);

    // send buffer
    return workbook.xlsx.writeBuffer();
  }

  /**
   * Creation da Sheet/Tab for user informations
   * @param workbook - user to create sheet/tab
   * @param citizen - user informations
   * @param companyName - company name
   * @param listMaas - list of MAAS services names
   * @returns workbook with new Sheet/Tab that contains user informations
   */
  addSheetInformationsPers(
    workbook: Excel.Workbook,
    citizen: Citizen,
    companyName: string,
    listMaas: string[],
  ): Excel.Workbook {
    const sheet: Excel.Worksheet = workbook.addWorksheet('Informations personnelles');

    // prepare data to be exposed inside the Excel sheet for user informations
    const data: Record<string, string> = {
      Nom: citizen.identity.lastName.value,
      Prénom: citizen.identity.firstName.value,
      'Date de naissance': citizen.identity.birthDate.value
        ? formatDateInFrenchNotation(new Date(citizen.identity.birthDate.value))
        : '',
      'Code postal': citizen.postcode,
      Ville: citizen.city,
      'Statut professionnel': citizen.status ? USER_STATUS[citizen.status] : '',
      "Entreprise d'affiliation": companyName || '',
      'Adresse email professionnelle': citizen?.affiliation?.enterpriseEmail || '',
      'Adresse email personnelle': citizen.personalInformation?.email.value,
      'Liste des affiliations MaaS': listMaas?.length ? listMaas.join(', ') : '',
    };

    // loop data lign by lign and insert each one in the Excel sheet
    let rowIndex: number = 1;
    for (const col of Object.keys(data)) {
      const row = sheet.getRow(rowIndex);
      const value = data[col];
      row.values = [col, value];
      rowIndex++;
    }

    return workbook;
  }

  /**
   * Generate one Sheet/Tab for each incentive, each one contains list of user subscription by incentive
   * @param workbook - user to create sheet/tab
   * @param subscriptions - list of user subscriptions
   * @param incentives - list of incentives
   * @returns workbook with new Sheet/Tab that contains user informations
   */
  addSheetSubscriptions(
    workbook: Excel.Workbook,
    subscriptions: Subscription[],
    incentives: Incentive[],
  ): Excel.Workbook {
    if (!subscriptions?.length || !incentives?.length) {
      return workbook;
    }

    const tabs: Tab[] = this.generateTabsDataStructure(subscriptions, incentives);

    for (const tab of tabs) {
      const {title, header, rows} = tab;

      const sheet = workbook.addWorksheet(title);

      const firstRowHeader = sheet.getRow(1);
      firstRowHeader.values = [...header];
      firstRowHeader.eachCell(styleHeaderCell);

      let rowIndexe = 2;
      for (const row of rows) {
        const currentRow = sheet.getRow(rowIndexe);
        currentRow.values = [...row];
        rowIndexe++;
      }
    }

    return workbook;
  }

  /**
   * Prepare Data required to create sheets/tabs for each incentive
   * @param subscriptions - list of user subscriptions
   * @param incentives - list of incentives
   * @returns Data required to create sheets/tabs for each incentive
   */
  generateTabsDataStructure(subscriptions: Subscription[], incentives: Incentive[]): Tab[] {
    const incentivesHashMap: Record<string, Incentive> = incentives.reduce(
      (hashMap: Record<string, Incentive>, incentive: Incentive) => {
        if (incentive.id) {
          hashMap[incentive.id] = incentive;
        }
        return hashMap;
      },
      {},
    );

    const tabsHashMap: Record<string, Tab> = subscriptions.reduce(
      (tabsHashMap: Record<string, Tab>, subscription: Subscription) => {
        const {incentiveId} = subscription;
        if (!incentiveId) {
          return tabsHashMap;
        }
        if (!(incentiveId in tabsHashMap)) {
          const incentive: Incentive = incentivesHashMap[incentiveId];
          tabsHashMap[incentiveId] = {
            title: incentive.id || incentiveId,
            header: this.generateHeader(incentive),
            rows: [],
          };
        }
        const row: string[] = this.generateRow(subscription, tabsHashMap[incentiveId].header);
        tabsHashMap[incentiveId].rows.push(row);
        return tabsHashMap;
      },
      {},
    );

    return Object.values(tabsHashMap);
  }

  /**
   * generate colomns names by incentive, with specificFields names
   * @param incentive - list of incentives
   * @returns array of colomns names by incentive, with specificFields names
   */
  generateHeader(incentive: Incentive): string[] {
    const header = [
      'Date de la demande',
      "Nom de l'aide",
      'Financeur',
      'Statut',
      'Nom des justificatifs transmis',
    ];
    // Gestion des specifics fields
    if (incentive?.specificFields?.length) {
      const titles = incentive?.specificFields?.map(sf => sf.title);
      return [...header, ...titles];
    }
    return header;
  }

  /**
   * Generate one row of cell data per user subscription
   * @param subscription - one user subscription
   * @param header - array of colomns names by incentive, with specificFields names
   * @returns one row data per user subscription
   */
  generateRow(subscription: Subscription, header: string[]): string[] {
    return header.map((colName: string) => {
      switch (colName) {
        case 'Date de la demande':
          return subscription.createdAt ? formatDateInFrenchNotation(subscription.createdAt) : '';
        case "Nom de l'aide":
          return subscription.incentiveTitle || '';
        case 'Financeur':
          return subscription.funderName || '';
        case 'Statut':
          return SubscriptionStatus[subscription.status] || '';
        case 'Nom des justificatifs transmis':
          return (
            subscription.attachments
              ?.map((attachment: AttachmentType) => attachment.originalName)
              ?.join(', ') || ''
          );
        default:
          // specificFields data
          return subscription.specificFields?.[colName] || '';
      }
    });
  }

  /**
   * return list of MAAS services attached to one user
   * @param email of user
   * @returns list of MAAS services names attached to one user
   */
  async getListMaasNames(email: string): Promise<string[]> {
    const userEntity: UserEntity | null = await this.userEntityRepository.findOne({
      where: {email},
      fields: {id: true, email: true, username: true},
    });

    const userId: string = userEntity?.id || this.currentUser.id;

    // get all user offline sessions
    const offlineUserSessions: OfflineUserSession[] = await this.offlineUserSessionRepository.find({
      where: {userId},
      fields: {userId: true, userSessionId: true},
    });

    const userSessionIds: string[] = offlineUserSessions?.map(ous => ous.userSessionId);

    // get all client offline sessions
    const offlineClientSessions: OfflineClientSession[] = await this.offlineClientSessionRepository.find({
      where: {userSessionId: {inq: userSessionIds}},
      fields: {userSessionId: true, clientId: true},
    });

    const clientIds: string[] = offlineClientSessions?.map(ocs => ocs.clientId);

    // get all concerned clients
    const clients: Client[] = await this.clientRepository.find({
      where: {id: {inq: clientIds}},
      fields: {id: true, clientId: true, name: true},
    });

    const listMaasNames: string[] = clients?.filter(ocs => !!ocs.name)?.map(ocs => `${ocs.name}`);

    return listMaasNames;
  }

  /**
   * Send mail for citizen account deletion
   * @param mailService
   * @param citizen
   * @param deletionDate
   *
   */
  async sendDeletionMail(mailService: MailService, citizen: Citizen, deletionDate: string) {
    const incentiveLink = `${WEBSITE_FQDN}/recherche`;
    await mailService.sendMailAsHtml(
      citizen.personalInformation.email.value!,
      'Votre compte a bien été supprimé',
      'deletion-account-citizen',
      {
        username: capitalize(citizen.identity.firstName.value),
        deletionDate: deletionDate,
        incentiveLink: incentiveLink,
      },
    );
  }

  async getClientList(): Promise<ClientOfConsent[]> {
    const clients = await this.clientRepository.find({
      fields: {clientId: true, name: true},
    });
    return clients;
  }

  /**
   * Send account deletion mail for citizen
   *
   * @param mailService
   * @param to
   * @param firstName
   */
  async sendNonActivatedAccountDeletionMail(mailService: MailService, to: string, firstName: string) {
    await mailService.sendMailAsHtml(
      to,
      'Votre compte moB vient d’être supprimé',
      'nonActivated-account-deletion',
      {
        username: capitalize(firstName),
      },
    );
  }

  /**
   * Function used by nonActivatedAccountNotificationCronJon
   * Non activated account from more than 6 months will be deleted
   * An email is sent to the user
   * His data (account and/or affiliation are deleted)
   */
  async accountDeletionService(): Promise<void> {
    try {
      const deletionDate: number = Math.round(sub(new Date(), {months: 6}).getTime());
      Logger.debug(CitizenService.name, this.accountDeletionService.name, 'Deletion date', deletionDate);

      // Get user list where email not verified
      const nonActivatedAccountToDeleteList: UserEntity[] = await this.userEntityRepository.find({
        where: {
          and: [{email: {neq: 'null'}}, {emailVerified: false}, {createdTimestamp: {lte: deletionDate}}],
        },
        include: [{relation: 'userAttributes'}, {relation: 'keycloakGroups'}],
      });

      Logger.debug(
        CitizenService.name,
        this.accountDeletionService.name,
        'Citizen List to delete',
        nonActivatedAccountToDeleteList,
      );

      await Promise.allSettled(
        nonActivatedAccountToDeleteList.map(async (nonActivatedAccountToDelete: UserEntity) => {
          const isCitizen: boolean =
            nonActivatedAccountToDelete.keycloakGroups.filter((group: KeycloakGroup) => {
              return group.name === GROUPS.citizens;
            }).length > 0;

          const isUserFunder: boolean =
            nonActivatedAccountToDelete.keycloakGroups.filter((group: KeycloakGroup) => {
              return group.name === Roles.MANAGERS || group.name === Roles.SUPERVISORS;
            }).length > 0;

          // Handle citizen
          if (isCitizen) {
            const citizen: Citizen = await this.getCitizenWithAffiliationById(nonActivatedAccountToDelete.id);

            if (citizen.affiliation) {
              await this.affiliationRepository.deleteById(citizen.affiliation.id);
              Logger.info(
                CitizenService.name,
                this.accountDeletionService.name,
                'Affiliation deleted',
                citizen.affiliation.id,
              );
            }

            await this.kcService.deleteUserKc(nonActivatedAccountToDelete.id);
            await this.sendNonActivatedAccountDeletionMail(
              this.mailService,
              citizen.personalInformation.email.value,
              citizen.identity.firstName.value,
            );
          }

          // Handle user funder
          if (isUserFunder) {
            const userFunder: User = await this.userRepository.findById(nonActivatedAccountToDelete.id);
            await this.userRepository.deleteById(nonActivatedAccountToDelete.id);
            await this.kcService.deleteUserKc(nonActivatedAccountToDelete.id);
            await this.sendNonActivatedAccountDeletionMail(
              this.mailService,
              userFunder.email,
              userFunder.firstName,
            );
          }
          Logger.info(
            CitizenService.name,
            this.accountDeletionService.name,
            'Email sent to',
            nonActivatedAccountToDelete.id,
          );
          Logger.info(
            CitizenService.name,
            this.accountDeletionService.name,
            'User deleted',
            nonActivatedAccountToDelete.id,
          );
        }),
      );
    } catch (err) {
      throw new InternalServerError(CitizenService.name, this.accountDeletionService.name, err);
    }
  }

  /**
   * Create Citizen in KC
   * @param rawCitizen
   * @returns id
   */
  async createCitizen(rawCitizen: CitizenCreate): Promise<{id: string}> {
    let keycloakResult;
    let enterprise: Enterprise | null = null;

    try {
      const citizen: Citizen = new Citizen(rawCitizen as Citizen);

      const actions: RequiredActionAlias[] = [RequiredActionAlias.VERIFY_EMAIL];

      // Initialize user creation in KC
      keycloakResult = await this.kcService.createUserKc(citizen, [GROUPS.citizens], actions);

      if (keycloakResult && keycloakResult.id) {
        Logger.info(CitizenService.name, this.createCitizen.name, 'Citizen created', keycloakResult.id);

        citizen.id = keycloakResult.id;

        if (citizen.affiliation?.enterpriseId) {
          enterprise = (await this.funderRepository.getEnterpriseById(
            citizen.affiliation.enterpriseId,
          )) as Enterprise;
        }

        // Create Affiliation
        const affiliation: Affiliation = await this.affiliationRepository.createAffiliation(
          citizen,
          enterprise?.enterpriseDetails.hasManualAffiliation || false,
        );
        Logger.info(CitizenService.name, this.createCitizen.name, 'Affiliation created', affiliation.id);

        citizen.affiliation = affiliation;

        // Send verification mail
        await this.kcService.sendExecuteActionsEmailUserKc(citizen.id, actions);
        Logger.info(CitizenService.name, this.createCitizen.name, 'Execute email action sent', citizen.id);

        // Send a manual affiliation mail to the company's funders accepting the manual affiliation or to citizen
        if (affiliation.status === AFFILIATION_STATUS.TO_AFFILIATE) {
          if (enterprise!.enterpriseDetails.hasManualAffiliation) {
            await this.affiliationService.sendManualAffiliationMail(citizen, enterprise!);
            Logger.info(
              CitizenService.name,
              this.createCitizen.name,
              'Manual Affiliation email sent',
              citizen.id,
            );
          } else {
            await this.affiliationService.sendAffiliationMail(this.mailService, citizen, enterprise!.name);
            Logger.info(CitizenService.name, this.createCitizen.name, 'Affiliation email sent', citizen.id);
          }
        }

        return {
          id: citizen.id,
        };
      }

      return keycloakResult;
    } catch (error) {
      if (keycloakResult && keycloakResult.id) {
        const affiliationToDelete = await this.affiliationRepository.findOne({
          where: {citizenId: keycloakResult.id},
        });
        affiliationToDelete && (await this.affiliationRepository.deleteById(affiliationToDelete.id));
        await this.kcService.deleteUserKc(keycloakResult.id);
      }
      throw error;
    }
  }

  /**
   * Function used by InactiveAccountNotificationCronJon
   * Inactive account from 24 to 23 months will be notified with an email
   * An attribute is set to know if a notification has already been set
   */
  async notifyInactiveAccount(): Promise<void> {
    try {
      const notificationDate: string = String(Math.round(sub(new Date(), {months: 23}).getTime()));
      Logger.debug(
        CitizenService.name,
        this.notifyInactiveAccount.name,
        'Notification date',
        notificationDate,
      );

      const deletionDate: string = String(Math.round(sub(new Date(), {months: 24}).getTime()));
      Logger.debug(CitizenService.name, this.notifyInactiveAccount.name, 'Deletion date', deletionDate);

      // Get user list where isInactivityNotificationSent is set
      const userIdInactiveNotificationSentList: string[] = (
        await this.userAttributeRepository.find({
          where: {
            and: [{name: 'isInactivityNotificationSent'}, {value: 'true'}],
          },
          fields: {userId: true},
        })
      ).map((userAttribute: UserAttribute) => userAttribute.userId);

      // Get user list where isInactivityNotificationSent is set and lastLoginAt
      const inactiveAccountNotNotifiedList: UserAttribute[] = await this.userAttributeRepository.find({
        where: {
          and: [
            {name: 'lastLoginAt'},
            {value: {between: [deletionDate, notificationDate]}},
            {userId: {nin: userIdInactiveNotificationSentList}},
          ],
        },
        fields: {userId: true},
      });

      Logger.debug(
        CitizenService.name,
        this.notifyInactiveAccount.name,
        'Citizen List to notify',
        inactiveAccountNotNotifiedList,
      );

      await Promise.allSettled(
        inactiveAccountNotNotifiedList.map(async (inactiveAccountNotNotified: UserAttribute) => {
          const citizen: Citizen = (await this.userEntityRepository.getUserWithAttributes(
            inactiveAccountNotNotified.userId,
            GROUPS.citizens,
          ))!.toCitizen();

          await this.mailService.sendMailAsHtml(
            citizen.personalInformation.email.value,
            'Connectez-vous à votre compte moB',
            'notification-inactive-account',
            {
              username: capitalize(citizen.identity.firstName.value),
              inactiveDate: format(
                fromUnixTime(Math.round(Number(citizen.lastLoginAt) / 1000)),
                'dd/MM/yyyy',
              ),
              maxConnectionDate: format(
                add(new Date(), {
                  days: differenceInCalendarDays(
                    fromUnixTime(Math.round(Number(citizen.lastLoginAt) / 1000)),
                    fromUnixTime(Number(deletionDate) / 1000),
                  ),
                }),
                'dd/MM/yyyy',
              ),
              connectionLink: WEBSITE_FQDN,
            },
          );
          Logger.info(CitizenService.name, this.notifyInactiveAccount.name, 'Email sent to', citizen.id);

          // Set notification boolean
          citizen.isInactivityNotificationSent = true;
          await this.kcService.updateUserKC(citizen.id, citizen);
          Logger.info(CitizenService.name, this.notifyInactiveAccount.name, 'Citizen updated', citizen.id);
        }),
      );
    } catch (err) {
      throw new InternalServerError(CitizenService.name, this.notifyInactiveAccount.name, err);
    }
  }

  /**
   * Function used by InactiveAccountDeletionCronJon
   * Inactive account from more than 24 months will be deleted
   * An email is sent to the user
   * His data (account and/or affiliation are deleted)
   * A flag is added to his subscription
   */
  async deleteInactiveAccount(): Promise<void> {
    try {
      const deletionDate: string = String(Math.round(sub(new Date(), {months: 24}).getTime()));
      Logger.debug(CitizenService.name, this.deleteInactiveAccount.name, 'Deletion date', deletionDate);

      // Get user list where isInactivityNotificationSent is set
      const userIdInactiveNotificationSentList: string[] = (
        await this.userAttributeRepository.find({
          where: {
            and: [{name: 'isInactivityNotificationSent'}, {value: 'true'}],
          },
          fields: {userId: true},
        })
      ).map((userAttribute: UserAttribute) => userAttribute.userId);

      // Get user list where isInactivityNotificationSent is set and lastLoginAt
      const inactiveAccountToDeleteList: UserAttribute[] = await this.userAttributeRepository.find({
        where: {
          and: [
            {name: 'lastLoginAt'},
            {value: {lte: deletionDate}},
            {userId: {inq: userIdInactiveNotificationSentList}},
          ],
        },
        fields: {userId: true},
      });
      Logger.debug(
        CitizenService.name,
        this.deleteInactiveAccount.name,
        'Citizen List to delete',
        inactiveAccountToDeleteList,
      );

      await Promise.allSettled(
        inactiveAccountToDeleteList.map(async (inactiveAccountToDelete: UserAttribute) => {
          const citizen: Citizen = await this.getCitizenWithAffiliationById(inactiveAccountToDelete.userId);

          await this.mailService.sendMailAsHtml(
            citizen.personalInformation.email.value,
            'Suppression de votre compte moB',
            'deletion-inactive-account',
            {
              username: capitalize(citizen.identity.firstName.value),
              inactiveDate: format(
                fromUnixTime(Math.round(Number(citizen.lastLoginAt) / 1000)),
                'dd/MM/yyyy',
              ),
              gdprLink: `${WEBSITE_FQDN}/charte-protection-donnees-personnelles`,
            },
          );
          Logger.info(CitizenService.name, this.deleteInactiveAccount.name, 'Email sent to', citizen.id);

          // ADD Flag "Compte Supprimé" to citizen Subscription
          const citizenSubscriptionList: Subscription[] = await this.subscriptionRepository.find({
            where: {citizenId: citizen.id},
          });

          if (citizenSubscriptionList.length) {
            await Promise.allSettled(
              citizenSubscriptionList.map(async citizenSubscription => {
                citizenSubscription.isCitizenDeleted = true;
                await this.subscriptionRepository.updateById(citizenSubscription.id, {
                  isCitizenDeleted: true,
                });
              }),
            );
            Logger.info(
              CitizenService.name,
              this.deleteInactiveAccount.name,
              'Citizen flag is deleted added on subscriptions',
              citizen.id,
            );
          }

          // Delete affiliation
          if (citizen.affiliation) {
            await this.affiliationRepository.deleteById(citizen.affiliation.id);
            Logger.info(
              CitizenService.name,
              this.deleteInactiveAccount.name,
              'Affiliation deleted',
              citizen.affiliation.id,
            );
          }

          // Delete citizen
          await this.kcService.deleteUserKc(citizen.id);
          Logger.info(CitizenService.name, this.deleteInactiveAccount.name, 'Citizen deleted', citizen.id);
        }),
      );
    } catch (err) {
      throw new InternalServerError(CitizenService.name, this.deleteInactiveAccount.name, err);
    }
  }

  /**
   * Get citizen by Id from PGSQL DB
   * @param citizenId string
   */
  async getCitizenWithAffiliationById(citizenId: string): Promise<Citizen> {
    const citizen: Citizen = (await this.userEntityRepository.getUserWithAttributes(
      citizenId,
      GROUPS.citizens,
    ))!.toCitizen();
    const affiliation: Affiliation | null = await this.affiliationRepository.findOne({
      where: {citizenId: citizen.id},
    });
    citizen.affiliation = affiliation!;
    return citizen;
  }

  /**
   * Get citizen by Id from PGSQL DB with filter on userAttribute
   * @param citizenId string
   * @param citizenFilter citizen filter with only fields
   */
  async getCitizenByFilter(citizenId: string, citizenFilter?: FilterCitizen): Promise<Citizen> {
    const {roles, scopes} = this.currentUser;
    Logger.debug(CitizenService.name, this.getCitizenByFilter.name, 'Current user', this.currentUser);

    // Check whether all values in the fields parameter are false.
    let newCitizenFields: Fields<Citizen> = preCheckFields(citizenFilter?.fields);

    // If it is a citizen, check its scope to control the properties to be returned.
    // Overide the current fields if necessary.
    if (roles.includes(Roles.CITIZENS)) {
      newCitizenFields = parseScopes(scopes, newCitizenFields as Record<string, boolean>);
      Logger.debug(
        CitizenService.name,
        this.getCitizenByFilter.name,
        'Fields after scopes verification',
        newCitizenFields,
      );
    }

    // If it is a citizen, check its scope to control the properties to be returned.
    const userAttributeFilter: Filter<UserAttribute> = composeWhere(newCitizenFields);
    Logger.debug(
      CitizenService.name,
      this.getCitizenByFilter.name,
      'Filter applied to userAttributes table',
      userAttributeFilter,
    );

    let citizen: Partial<Citizen> = {};

    if (userAttributeFilter && Object.keys(userAttributeFilter).length) {
      citizen = (await this.userEntityRepository.getUserWithAttributes(
        citizenId,
        GROUPS.citizens,
        userAttributeFilter,
      ))!.toCitizen();
    }

    const hasAffiliation: boolean =
      citizenFilter?.fields?.['affiliation' as keyof Fields<Citizen>] ||
      !Object.keys(citizenFilter?.fields || {}).length;

    if (hasAffiliation) {
      const affiliation: Affiliation | null = await this.affiliationRepository.findOne({
        where: {citizenId: citizenId},
      });
      citizen.affiliation = affiliation!;
    }

    return citizen as Citizen;
  }

  /**
   * Get citizens with affiliations from PGSQL DB based on given filters.
   * @param userEntityFilter Filter<UserEntity> The filter to apply to the UserEntity relation.
   * @param affiliationFilter Filter<Affiliation> The filter to apply to the Affiliation relation.
   * @returns Promise<Citizen[] | []> A Promise that resolves to an array of Citizens.
   */
  async findCitizenWithAffiliation(
    userEntityFilter: Filter<UserEntity>,
    affiliationFilter: Filter<Affiliation>,
  ): Promise<PartialCitizen[] | []> {
    const filter: Filter<Affiliation> = {
      include: [
        {
          relation: 'user',
          scope: {
            ...userEntityFilter,
          },
        },
      ],
      ...affiliationFilter,
    };

    const citizensWithAffiliation: Affiliation[] = (await this.affiliationRepository.find(filter)).filter(
      (affiliation: AnyObject) => affiliation.user,
    );

    const citizens = citizensWithAffiliation.map((citizenWithAffiliation: AnyObject) => {
      const citizen: Citizen = citizenWithAffiliation.user.toCitizen();

      const newCitizen: PartialCitizen = {
        id: citizenWithAffiliation.citizenId,
        lastName: citizen.identity.lastName.value,
        firstName: citizen.identity.firstName.value,
        birthdate: citizen.identity.birthDate.value,
        email: citizen.personalInformation.email.value,
        enterpriseEmail: citizenWithAffiliation?.enterpriseEmail,
        isCitizenDeleted: false,
      };

      return newCitizen;
    });

    return citizens;
  }
}

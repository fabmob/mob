import * as Excel from 'exceljs';
import {injectable, BindingScope, service, inject} from '@loopback/core';
import {repository, AnyObject, Filter, Where, Count} from '@loopback/repository';
import {
  UserEntity,
  OfflineUserSession,
  OfflineClientSession,
  Client,
  Citizen,
  Enterprise,
  Incentive,
  Subscription,
  AttachmentType,
  User,
  Affiliation,
  CitizenCreate,
  UserEntityRelations,
} from '../models';
import {
  EnterpriseRepository,
  UserRepository,
  SubscriptionRepository,
  UserEntityRepository,
  ClientRepository,
  OfflineClientSessionRepository,
  OfflineUserSessionRepository,
  AffiliationRepository,
} from '../repositories';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {
  AFFILIATION_STATUS,
  USER_STATUS,
  ClientOfConsent,
  GROUPS,
  Roles,
  formatDateInFrenchNotation,
} from '../utils';
import {WEBSITE_FQDN} from '../constants';
import {capitalize} from 'lodash';
import {differenceInMonths} from 'date-fns';
import {RequiredActionAlias} from 'keycloak-admin/lib/defs/requiredActionProviderRepresentation';
import {JwtService} from './jwt.service';
import {AffiliationService} from './affiliation.service';
import {KeycloakService} from './keycloak.service';
import {MailService} from './mail.service';

// We specify queryParams for our employees search
type EmployeesQueryParams = {
  status?: string;
  lastName?: string;
  skip?: number;
  limit?: number;
};

export type Tab = {
  title: string;
  header: string[];
  rows: string[][];
};

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
    @repository(EnterpriseRepository)
    public enterpriseRepository: EnterpriseRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @repository(UserEntityRepository)
    public userEntityRepository: UserEntityRepository,
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
   *
   * @param EmployeesQueryParams
   */
  async findEmployees({
    status,
    lastName,
    skip,
    limit,
  }: EmployeesQueryParams): Promise<{employees: Citizen[]; employeesCount: number}> {
    const {id} = this.currentUser;
    const user: User = await this.userRepository.findById(id);

    const filter: Filter<UserEntity> = {order: ['lastName ASC']};

    const where: Where<UserEntity> = {};

    const affiliationFilter: Filter<Affiliation> = {where: {enterpriseId: user.funderId}};

    let count: Count;

    if (skip) {
      Object.assign(filter, {skip: skip});
    }

    if (limit) {
      Object.assign(filter, {limit: limit});
    }

    if (lastName) {
      Object.assign(where, {lastName: new RegExp('.*' + lastName + '.*', 'i')});
    }

    if (status) {
      Object.assign(affiliationFilter.where!, {status: status});
    }

    // Get citizen for these affiliations with minimal info ?
    const affiliatedCitizenList: Citizen[] | [] =
      await this.searchCitizenWithAffiliationListByFilter(
        Object.assign(filter, {where: where}),
        affiliationFilter,
      );

    if (lastName) {
      count = {count: affiliatedCitizenList.length};
    } else {
      // Count affiliated citizens
      count = await this.affiliationRepository.count(affiliationFilter.where);
    }

    return {
      employees: affiliatedCitizenList,
      employeesCount: count.count,
    };
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
  generateTabsDataStructure(
    subscriptions: Subscription[],
    incentives: Incentive[],
  ): Tab[] {
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
        const row: string[] = this.generateRow(
          subscription,
          tabsHashMap[incentiveId].header,
        );
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
          return subscription.createdAt
            ? formatDateInFrenchNotation(subscription.createdAt)
            : '';
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
    const offlineUserSessions: OfflineUserSession[] =
      await this.offlineUserSessionRepository.find({
        where: {userId},
        fields: {userId: true, userSessionId: true},
      });

    const userSessionIds: string[] = offlineUserSessions?.map(ous => ous.userSessionId);

    // get all client offline sessions
    const offlineClientSessions: OfflineClientSession[] =
      await this.offlineClientSessionRepository.find({
        where: {userSessionId: {inq: userSessionIds}},
        fields: {userSessionId: true, clientId: true},
      });

    const clientIds: string[] = offlineClientSessions?.map(ocs => ocs.clientId);

    // get all concerned clients
    const clients: Client[] = await this.clientRepository.find({
      where: {id: {inq: clientIds}},
      fields: {id: true, clientId: true, name: true},
    });

    const listMaasNames: string[] = clients
      ?.filter(ocs => !!ocs.name)
      ?.map(ocs => `${ocs.name}`);

    return listMaasNames;
  }

  /**
   * Send mail for citizen account deletion
   * @param mailService
   * @param citizen
   * @param deletionDate
   *
   */
  async sendDeletionMail(
    mailService: MailService,
    citizen: Citizen,
    deletionDate: string,
  ) {
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
   * @param citizen
   */
  async sendNonActivatedAccountDeletionMail(mailService: MailService, user: AnyObject) {
    await mailService.sendMailAsHtml(
      user.email!,
      'Votre compte moB vient d’être supprimé',
      'nonActivated-account-deletion',
      {
        username: capitalize(user.firstName),
      },
    );
  }

  /**
   * deletion of every non_activated account after six months from its creation date + sending an email to the citizen/funder
   */
  async accountDeletionService(): Promise<void> {
    // keycloak users list
    const userList = await this.kcService.listUsers();

    //  get only non_activated accounts that was created six months ago
    const sixMonthNonActivatedAccounts = userList.filter((user: AnyObject) => {
      const currentDate = new Date();
      const monthsPassed = differenceInMonths(
        currentDate,
        new Date(user.createdTimestamp),
      );

      return user.emailVerified === false && monthsPassed >= 6;
    });

    if (sixMonthNonActivatedAccounts.length) {
      for (const account of sixMonthNonActivatedAccounts) {
        //  get the list of User groups
        const group: object[] = await this.kcService.listUserGroups(account.id);

        // check if the user is a citizen
        const citizenGroup: object[] = group.filter((group: AnyObject) => {
          return group.name === GROUPS.citizens;
        });

        //  check if the user is a funder
        const funderGroup: object[] = group.filter((group: AnyObject) => {
          return group.name === Roles.MANAGERS || group.name === Roles.SUPERVISORS;
        });

        // citizen account deletion + sending mail
        if (citizenGroup.length !== 0) {
          const citizen: Citizen = await this.getCitizenWithAffiliationById(account.id);

          citizen.affiliation &&
            (await this.affiliationRepository.deleteById(account.id));
          await this.kcService.deleteUserKc(account.id);
          await this.sendNonActivatedAccountDeletionMail(this.mailService, {
            ...citizen,
            firstName: citizen.identity.firstName.value,
            email: citizen.personalInformation.email.value,
          });
        }

        //  funder account deletion + sending mail
        if (funderGroup.length !== 0) {
          const funder: User = await this.userRepository.findById(account.id);
          await this.userRepository.deleteById(account.id);
          await this.kcService.deleteUserKc(account.id);
          await this.sendNonActivatedAccountDeletionMail(this.mailService, funder);
        }
      }
    }
  }

  /**
   * Create Citizen in KC
   * @param rawCitizen
   * @returns id
   */
  async createCitizen(
    rawCitizen: Omit<CitizenCreate, 'password'>,
  ): Promise<{id: string} | undefined> {
    let keycloakResult;
    let enterprise = new Enterprise();

    try {
      const citizen: Citizen = new Citizen(rawCitizen as Citizen);

      const actions: RequiredActionAlias[] = [RequiredActionAlias.VERIFY_EMAIL];

      // Initialize user creation in KC
      keycloakResult = await this.kcService.createUserKc(
        citizen,
        [GROUPS.citizens],
        actions,
      );

      if (keycloakResult && keycloakResult.id) {
        citizen.id = keycloakResult.id;

        if (citizen.affiliation?.enterpriseId) {
          enterprise = await this.enterpriseRepository.findById(
            citizen.affiliation.enterpriseId,
          );
        }

        // Create Affiliation
        const affiliation: Affiliation =
          await this.affiliationRepository.createAffiliation(
            citizen,
            enterprise.hasManualAffiliation || false,
          );

        citizen.affiliation = affiliation;

        // Send verification mail
        await this.kcService.sendExecuteActionsEmailUserKc(citizen.id, actions);

        // Send a manual affiliation mail to the company's funders accepting the manual affiliation or to citizen
        if (affiliation.status === AFFILIATION_STATUS.TO_AFFILIATE) {
          if (enterprise.hasManualAffiliation) {
            await this.affiliationService.sendManualAffiliationMail(citizen, enterprise);
          } else {
            await this.affiliationService.sendAffiliationMail(
              this.mailService,
              citizen,
              enterprise!.name,
            );
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
        affiliationToDelete &&
          (await this.affiliationRepository.deleteById(affiliationToDelete.id));
        await this.kcService.deleteUserKc(keycloakResult.id);
      }
      throw error;
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
   * Get citizen according to given filter from PGSQL DB
   * @param userEntityFilter Filter<UserEntity>
   * @param affiliationFilter <Affiliation>
   * @returns Promise<Citizen[] | []>
   */
  async searchCitizenWithAffiliationListByFilter(
    userEntityFilter: Filter<UserEntity>,
    affiliationFilter: Filter<Affiliation>,
  ): Promise<Citizen[] | []> {
    // Get all affiliation for funder
    const affiliationList: string[] | [] = (
      await this.affiliationRepository.find(affiliationFilter)
    ).map((affiliation: Affiliation) => affiliation.citizenId);

    // Add citizen id list to userEntityFilter
    userEntityFilter.where &&
      Object.assign(userEntityFilter.where, {id: {inq: affiliationList}});

    const userWithAttributesList: (UserEntity & UserEntityRelations)[] =
      await this.userEntityRepository.searchUserWithAttributesByFilter(
        userEntityFilter,
        GROUPS.citizens,
      );

    return (
      await Promise.all(
        userWithAttributesList.map(
          async (userWithAttributes: UserEntity & UserEntityRelations) => {
            const citizen: Citizen = userWithAttributes.toCitizen();
            affiliationFilter.where &&
              Object.assign({...affiliationFilter.where}, {citizenId: citizen.id});
            const affiliation: Affiliation | null =
              await this.affiliationRepository.findOne(affiliationFilter);
            affiliation && (citizen.affiliation = affiliation);
            return citizen;
          },
        ),
      )
    ).filter((citizen: Citizen) => citizen.affiliation);
  }
}

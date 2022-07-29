import * as Excel from 'exceljs';
import {injectable, BindingScope, service, inject} from '@loopback/core';
import {repository, AnyObject} from '@loopback/repository';

import {MailService} from './mail.service';
import {KeycloakService} from './keycloak.service';
import {ValidationError} from '../validationError';
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
} from '../models';
import {formatDateExcel} from '../interceptors/utils';
import {
  CitizenRepository,
  EnterpriseRepository,
  EmployeesFind,
  UserRepository,
  SubscriptionRepository,
  UserEntityRepository,
  ClientRepository,
  OfflineClientSessionRepository,
  OfflineUserSessionRepository,
} from '../repositories';
import {AffiliationAccessTokenPayload, JwtService} from './jwt.service';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {
  StatusCode,
  ResourceName,
  AFFILIATION_STATUS,
  SUBSCRIPTION_STATUS,
  USER_STATUS,
  ClientOfConsent,
  GROUPS,
  Roles,
} from '../utils';
import {WEBSITE_FQDN} from '../constants';
import {capitalize} from 'lodash';
import {differenceInMonths} from 'date-fns';

// We specify queryParams for our employees search
type EmployeesQueryParams = Omit<EmployeesFind, 'skip'> & {
  status: string | undefined;
  lastName?: string | undefined;
  skip?: number;
};

export type Tab = {
  title: string;
  header: string[];
  rows: string[][];
};

const SubscriptionStatus: Record<string, string> = {
  A_TRAITER: 'à traiter',
  VALIDER: 'accepté',
  REJETER: 'refusée',
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
    @repository(CitizenRepository)
    public citizenRepository: CitizenRepository,
    @repository(EnterpriseRepository)
    public enterpriseRepository: EnterpriseRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @service(JwtService)
    public jwtService: JwtService,
    @inject(SecurityBindings.USER, {optional: true})
    private currentUser: UserProfile,
    @repository(UserEntityRepository)
    public userEntityRepository: UserEntityRepository,
    @repository(ClientRepository)
    public clientRepository: ClientRepository,
    @repository(OfflineClientSessionRepository)
    public offlineClientSessionRepository: OfflineClientSessionRepository,
    @repository(OfflineUserSessionRepository)
    public offlineUserSessionRepository: OfflineUserSessionRepository,
    @inject('services.KeycloakService')
    public kcService: KeycloakService,
    @inject('services.MailService')
    public mailService: MailService,
  ) {}

  /**
   * Get salaries based on their affiliation status and lastName
   *
   * @param status
   * @param lastName
   * @param skip
   */
  async findEmployees({
    status,
    lastName,
    skip,
    limit = 10,
  }: EmployeesQueryParams): Promise<{
    employees: Citizen[] | undefined;
    employeesCount: number;
  }> {
    const {id} = this.currentUser;
    const user = await this.userRepository.findById(id);

    const employees = await this.citizenRepository.findByParams({
      status,
      lastName,
      funderId: user.funderId,
      skip,
      limit,
    });

    // Count Affiliated/disaffiliated/toAffiliate employees
    const match: object[] = [{'affiliation.enterpriseId': user.funderId}];

    if (lastName) {
      match.push({lastName: {$regex: new RegExp('.*' + lastName + '.*', 'i')}});
    }

    if (status) {
      match.push({'affiliation.affiliationStatus': status});
    }

    const employeesNumber = await this.citizenRepository
      .execute('Citizen', 'aggregate', [
        {
          $match: {
            $and: match,
          },
        },
        {
          $group: {
            _id: null,
            count: {
              $sum: 1,
            },
          },
        },
      ])
      .then((res: AnyObject) => res.get())
      .catch(err => err);

    const employeesCount = employeesNumber?.[0] ? employeesNumber[0]['count'] : 0;

    return {employees, employeesCount};
  }

  /**
   * Send affiliation mail for salarie citizen
   *
   * @param mailService
   * @param citizen
   * @param enterpriseNames
   */
  async sendAffiliationMail(
    mailService: MailService,
    citizen: Citizen,
    enterpriseName: string,
  ) {
    const token = this.jwtService.generateAffiliationAccessToken(citizen);
    const affiliationLink = `${WEBSITE_FQDN}/inscription/association?token=${token}`;

    await mailService.sendMailAsHtml(
      citizen.affiliation!.enterpriseEmail!,
      'Rejoignez la communauté de votre entreprise sur Mon Compte Mobilité !',
      'affiliation-citoyen',
      {
        enterpriseName: enterpriseName,
        affiliationLink: affiliationLink,
      },
    );
  }

  /**
   * Send disaffiliation mail for salarie citizen
   * @param mailService
   * @param citizen
   *
   */
  async sendDisaffiliationMail(mailService: MailService, citizen: Citizen) {
    await mailService.sendMailAsHtml(
      citizen.email!,
      'Votre affiliation à votre employeur a été mise à jour',
      'desaffiliation-citoyen',
    );
  }

  /**
   * Check that the citizen profesionnel email is aligned with the
   * domains of the enterprise citizen want to be member
   * @returns true/false
   * @param emailCitizen string - citizen profesionnel email
   * @param enterpriseEmails[]: string[] - email patterns of the enterprise citizen want to be member
   */
  validateEmailPattern(emailCitizen: string, enterpriseEmails: string[]) {
    const formatEmail: string = emailCitizen.replace(/^.+@/, '@');
    if (!enterpriseEmails.includes(formatEmail)) {
      throw new ValidationError(
        'citizen.email.professional.error.format',
        '/professionnalEmailBadFormat',
        StatusCode.PreconditionFailed,
        ResourceName.ProfessionalEmail,
      );
    }
  }

  /**
   * Check Affiliation and return citizen if all checks are ok
   * CheckList :
   * verify token /
   * verify citizen and enterprise in mongo /
   * verify match between token and mongo
   * verify affiliation status
   */
  async checkAffiliation(token: string): Promise<Citizen> {
    let citizen: Citizen, enterprise: Enterprise;

    // Verify token
    if (!this.jwtService.verifyAffiliationAccessToken(token)) {
      throw new ValidationError(
        'citizens.affiliation.not.valid',
        '/citizensAffiliationNotValid',
        StatusCode.UnprocessableEntity,
        ResourceName.Affiliation,
      );
    }

    const decodedToken: AffiliationAccessTokenPayload =
      this.jwtService.decodeAffiliationAccessToken(token);

    try {
      // Get from db
      citizen = await this.citizenRepository.findById(decodedToken.id);
      enterprise = await this.enterpriseRepository.findById(decodedToken.enterpriseId);
    } catch (err) {
      throw new ValidationError(
        'citizens.affiliation.not.valid',
        '/citizensAffiliationNotValid',
        StatusCode.UnprocessableEntity,
        ResourceName.Affiliation,
      );
    }

    // Check if citizen and enterprise exists
    // Check if affiliation enterpriseId matches the token one
    if (
      !citizen ||
      !citizen?.affiliation ||
      citizen.affiliation.enterpriseId !== decodedToken.enterpriseId ||
      !enterprise
    ) {
      throw new ValidationError(
        'citizens.affiliation.not.valid',
        '/citizensAffiliationNotValid',
        StatusCode.UnprocessableEntity,
        ResourceName.Affiliation,
      );
    }

    // Check Affiliation status
    if (citizen.affiliation.affiliationStatus !== AFFILIATION_STATUS.TO_AFFILIATE) {
      throw new ValidationError(
        'citizens.affiliation.bad.status',
        '/citizensAffiliationBadStatus',
        StatusCode.PreconditionFailed,
        ResourceName.Affiliation,
      );
    }

    return citizen;
  }

  /**
   * Check Disaffiliation and return boolean if all checks are ok
   * CheckList :
   * verify citizen subscription
   */
  async checkDisaffiliation(citizenId: string): Promise<boolean> {
    // Check Citizen demands
    const withParams: AnyObject[] = [
      {funderName: this.currentUser.funderName},
      {incentiveType: this.currentUser.incentiveType},
      {status: SUBSCRIPTION_STATUS.TO_PROCESS},
      {citizenId: citizenId},
    ];

    const userId = this.currentUser.id;

    let communityIds: '' | string[] | null | undefined = null;

    communityIds =
      userId && (await this.userRepository.findOne({where: {id: userId}}))?.communityIds;

    if (communityIds && communityIds?.length > 0) {
      withParams.push({communityId: {inq: communityIds}});
    }

    const subscriptions = await this.subscriptionRepository.find({
      where: {
        and: withParams,
      },
    });

    return subscriptions?.length === 0;
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
  async generateExcelRGPD(
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
      Nom: citizen.lastName,
      Prénom: citizen.firstName,
      'Date de naissance': citizen.birthdate
        ? formatDateExcel(new Date(citizen.birthdate))
        : '',
      'Code postal': citizen.postcode,
      Ville: citizen.city,
      'Statut professionnel': citizen.status ? USER_STATUS[citizen.status] : '',
      "Entreprise d'affiliation": companyName || '',
      'Adresse email professionnelle': citizen?.affiliation?.enterpriseEmail || '',
      'Adresse email personnelle': citizen.email,
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
          return subscription.createdAt ? formatDateExcel(subscription.createdAt) : '';
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
    await mailService.sendMailAsHtml(
      citizen.email!,
      'Votre compte MOB a été supprimé',
      'deletion-account-citizen',
      {
        username: capitalize(citizen.firstName),
        familyName: capitalize(citizen.lastName),
        deletionDate: deletionDate,
      },
    );
  }

  /**
   * Check if the professional email is unique
   * @param professionalEmail
   *
   */
  async checkProEmailExistence(professionalEmail: string): Promise<void> {
    const withParams: AnyObject = {
      'affiliation.enterpriseEmail': professionalEmail,
    };
    const result = await this.citizenRepository.findOne({
      where: withParams,
    });
    if (result) {
      throw new ValidationError(
        'citizen.email.error.unique',
        '/affiliation.enterpriseEmail',
        StatusCode.UnprocessableEntity,
        ResourceName.UniqueProfessionalEmail,
      );
    }
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
  async sendInactifAccountDeletionMail(mailService: MailService, user: AnyObject) {
    await mailService.sendMailAsHtml(
      user.email!,
      'Votre compte MOB inactif a été supprimé',
      'inactif-account-deletion',
      {
        username: capitalize(user.firstName),
      },
    );
  }

  // suppression des comptes inactif au bout de six mois et l'envoi du mail au citoyen/financeur

  async accountDeletionService(): Promise<void> {
    // la liste de tout les User de keycloak
    const userList = await this.kcService.listUsers();

    //  avoir que ceux qui n'ont pas été activés au bout de six mois
    const sixMonthInactifAccounts = userList.filter((user: AnyObject) => {
      const currentDate = new Date();
      const monthsPassed = differenceInMonths(
        currentDate,
        new Date(user.createdTimestamp),
      );
      return user.emailVerified === false && monthsPassed >= 6;
    });

    if (sixMonthInactifAccounts.length !== 0) {
      for (const account of sixMonthInactifAccounts) {
        //  avoir la liste des groupes du User
        const group: object[] = await this.kcService.listUserGroups(account.id);

        // checker si le user est citoyen
        const citizenGroup: object[] = group.filter((group: AnyObject) => {
          return group.name === GROUPS.citizens;
        });

        //  checker si le user est financeur
        const funderGroup: object[] = group.filter((group: AnyObject) => {
          return group.name === Roles.MANAGERS || group.name === Roles.SUPERVISORS;
        });

        // suppression du compte si le user est citoyen et envoi du mail
        if (citizenGroup.length !== 0) {
          const citizen: Citizen = await this.citizenRepository.findById(account.id);
          await this.citizenRepository.deleteById(account.id);
          await this.kcService.deleteUserKc(account.id);
          await this.sendInactifAccountDeletionMail(this.mailService, citizen);
        }

        //  suppression du compte si le user est financeur et envoi du mail
        if (funderGroup.length !== 0) {
          const funder: User = await this.userRepository.findById(account.id);
          await this.userRepository.deleteById(account.id);
          await this.kcService.deleteUserKc(account.id);
          await this.sendInactifAccountDeletionMail(this.mailService, funder);
        }
      }
    }
  }
}

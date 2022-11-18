import * as Excel from 'exceljs';
import {injectable, BindingScope, service, inject} from '@loopback/core';
import {repository, AnyObject} from '@loopback/repository';
import {pick} from 'lodash';
import axios from 'axios';

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
  Affiliation,
} from '../models';
import {formatDateInFrenchNotation} from '../interceptors/utils';
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
  GENDER,
  User as UserInterface,
} from '../utils';
import {WEBSITE_FQDN} from '../constants';
import {capitalize} from 'lodash';
import {differenceInMonths} from 'date-fns';
import {RequiredActionAlias} from 'keycloak-admin/lib/defs/requiredActionProviderRepresentation';

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
   * @param EmployeesQueryParams
   */
  async findEmployees({
    status,
    lastName,
    skip,
    limit,
  }: EmployeesQueryParams): Promise<{employees: Citizen[]; employeesCount: number}> {
    const {id} = this.currentUser;
    const user = await this.userRepository.findById(id);

    const match: object[] = [
      {
        'affiliation.enterpriseId': user.funderId,
      },
    ];

    if (status) {
      match.push({'affiliation.affiliationStatus': status});
    }

    if (lastName) {
      match.push({
        'identity.lastName.value': new RegExp('.*' + lastName + '.*', 'i'),
      });
    }

    const employeesFacet: object[] = [
      {
        $group: {
          _id: {
            id: '$_id',
            lastName: {$toLower: '$identity.lastName.value'},
            firstName: {$toLower: '$identity.firstName.value'},
          },
          id: {$first: '$_id'},
          lastName: {$first: '$identity.lastName.value'},
          firstName: {$first: '$identity.firstName.value'},
          affiliation: {$first: '$affiliation'},
          email: {$first: '$personalInformation.email.value'},
          birthdate: {$first: '$identity.birthDate.value'},
        },
      },
      {$sort: {'_id.lastName': 1, '_id.firstName': 1, _id: 1}},
      {
        $project: {
          _id: 0,
        },
      },
      {$skip: skip ?? 0},
    ];

    if (limit) {
      employeesFacet.push({$limit: limit});
    }

    const queryEmployees = await this.citizenRepository
      .execute('Citizen', 'aggregate', [
        {
          $match: {
            $and: match,
          },
        },
        {
          $facet: {
            salariesCount: [
              {
                $group: {
                  _id: '$_id',
                },
              },
              {$count: 'count'},
            ],
            employees: employeesFacet,
          },
        },
        {
          $project: {
            employeesCount: {$ifNull: [{$arrayElemAt: ['$salariesCount.count', 0]}, 0]},
            employees: 1,
          },
        },
      ])
      .then((res: AnyObject) => res.get())
      .catch(err => err);

    return queryEmployees?.[0];
  }

  /**
   * Send affiliation mail for salarie citizen
   *
   * @param mailService
   * @param citizen
   * @param funderNames
   */
  async sendAffiliationMail(
    mailService: MailService,
    citizen: Citizen,
    funderName: string,
  ) {
    const token = this.jwtService.generateAffiliationAccessToken(citizen);
    const affiliationLink = `${WEBSITE_FQDN}/inscription/association?token=${token}`;

    await mailService.sendMailAsHtml(
      citizen.affiliation!.enterpriseEmail!,
      `Bienvenue dans votre communauté moB ${funderName}`,
      'citizen-affiliation',
      {
        funderName: funderName,
        affiliationLink: affiliationLink,
        username: capitalize(citizen.identity.firstName.value),
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
    const incentiveLink = `${WEBSITE_FQDN}/recherche`;
    await mailService.sendMailAsHtml(
      citizen.personalInformation.email.value!,
      'Votre affiliation employeur vient d’être supprimée',
      'disaffiliation-citizen',
      {
        username: capitalize(citizen.identity.firstName.value),
        incentiveLink: incentiveLink,
      },
    );
  }

  /**
   * send reject affiliation email
   * @param citizen citizen data
   * @param enterpriseName entreprise to be affiliated to
   */
  async sendRejectedAffiliation(citizen: Citizen, enterpriseName: string) {
    await this.mailService.sendMailAsHtml(
      citizen.personalInformation.email.value!,
      "Votre demande d'affiliation a été refusée",
      'affiliation-rejection',
      {
        username: capitalize(citizen.identity.firstName.value),
        enterpriseName: capitalize(enterpriseName),
      },
    );
  }

  /**
   * send validated affiliation email
   * @param citizen citizen data
   * @param enterpriseName entreprise to be affiliated to
   */
  async sendValidatedAffiliation(citizen: Citizen, enterpriseName: string) {
    const websiteLink = `${WEBSITE_FQDN}/recherche`;
    await this.mailService.sendMailAsHtml(
      citizen.personalInformation.email.value!,
      "Votre demande d'affiliation a été acceptée !",
      'affiliation-validation',
      {
        username: capitalize(citizen.identity.firstName.value),
        enterpriseName: capitalize(enterpriseName),
        websiteLink,
      },
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
        ResourceName.AffiliationBadStatus,
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
          const citizen: Citizen = await this.citizenRepository.findById(account.id);
          await this.citizenRepository.deleteById(account.id);
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
   * If the company accepts a manual affiliation, send an affiliation mail to that company's funders.
   * @param citizen
   * @param enterprise
   *
   */
  async sendManualAffiliationMail(
    citizen: AnyObject,
    enterprise: Enterprise,
  ): Promise<void> {
    //  Get list of the enterprise funders
    const enterpriseFunders = await this.userRepository.find({
      where: {
        funderId: enterprise.id,
        canReceiveAffiliationMail: true,
      },
    });

    // List of funders who accept manual affiliation and who have an activated account
    const verifiedFunders: User[] = [];

    const creationDate = formatDateInFrenchNotation(new Date());
    const manualAffiliationLink = `${WEBSITE_FQDN}/gerer-salaries?tab=A_AFFILIER`;

    await Promise.all(
      //  Loop through the existing funders in MongoDb and get the ones that have verified emails from keycloak.
      enterpriseFunders.map(async (el: User) => {
        const user = await this.kcService.getUser(el.id);
        if (user.emailVerified) {
          verifiedFunders.push(el);
        }
      }),
    );

    await Promise.all(
      //  Send an affiliation mail to each funder whose email address has been verified and who accept manual affiliation.
      verifiedFunders.map(async singleFunder =>
        this.mailService.sendMailAsHtml(
          singleFunder.email,
          `Vous avez une nouvelle demande d'affiliation !`,
          'funder-manual-affiliation-notification',
          {
            funderName: capitalize(enterprise.name),
            funderFirstName: capitalize(singleFunder.firstName),
            firstName: capitalize(citizen.identity.firstName.value),
            lastName: capitalize(citizen.identity.lastName.value),
            creationDate: creationDate,
            manualAffiliationLink: manualAffiliationLink,
          },
        ),
      ),
    );
  }

  /**
   * Create Citizen
   * @param register
   * @param citizenId
   * @returns
   */
  async createCitizen(
    register: Omit<Citizen, 'id' | 'password'>,
    citizenId?: string,
  ): Promise<{id: string} | undefined> {
    let keycloakResult;
    let enterprise = new Enterprise();

    try {
      const citizen: AnyObject = pick(register, [
        'personalInformation',
        'identity',
        'city',
        'postcode',
        'status',
        'tos1',
        'tos2',
        'affiliation',
        'dgfipInformation',
      ]);

      // Enterprise Verification
      if (citizen.affiliation?.enterpriseId) {
        enterprise = await this.enterpriseRepository.findById(
          citizen.affiliation.enterpriseId,
        );
      }

      // Check if the professional email is unique
      if (citizen.affiliation?.enterpriseId && citizen.affiliation?.enterpriseEmail) {
        await this.checkProEmailExistence(citizen?.affiliation?.enterpriseEmail);
      }

      // Verification the employee's professional email format
      if (citizen.affiliation?.enterpriseId && citizen.affiliation?.enterpriseEmail) {
        this.validateEmailPattern(
          citizen?.affiliation?.enterpriseEmail,
          enterprise?.emailFormat,
        );
      }

      const actions: RequiredActionAlias[] = [RequiredActionAlias.VERIFY_EMAIL];

      if (citizenId) {
        // Update the citizen attributes on KC
        await this.kcService.updateCitizenAttributes(citizenId, {
          ...citizen.identity,
          ...citizen.personalInformation,
        });

        // Update the citizen role on KC
        await this.kcService.updateCitizenRole(citizenId, GROUPS.citizens);
      } else {
        // Initialize user creation in KC
        const newRegister: UserInterface = {
          ...register,
          group: [GROUPS.citizens],
          gender: register.identity.gender.value === 1 ? GENDER.MALE : GENDER.FEMALE,
          lastName: register.identity.lastName.value,
          firstName: register.identity.firstName.value,
          birthdate: register.identity.birthDate.value,
          email: register.personalInformation.email.value,
        };

        keycloakResult = await this.kcService.createUserKc(
          {
            ...newRegister,
          },
          actions,
        );
      }

      if ((keycloakResult && keycloakResult.id) || citizenId) {
        if (citizenId) {
          // Set Citizen Id
          citizen.id = citizenId;
        } else if (keycloakResult) {
          citizen.id = keycloakResult.id;
        }

        // Create object : affiliation
        const affiliation: Affiliation = new Affiliation(citizen.affiliation);

        // Check if one of the enterpriseId or/and enterpriseEmail are provided
        if (
          (!affiliation.enterpriseId && affiliation.enterpriseEmail) ||
          (affiliation.enterpriseId &&
            !affiliation.enterpriseEmail &&
            !enterprise?.hasManualAffiliation) ||
          (!affiliation.enterpriseId && !affiliation.enterpriseEmail)
        ) {
          affiliation.enterpriseId = !affiliation.enterpriseId
            ? null
            : affiliation.enterpriseId;
          affiliation.enterpriseEmail = !affiliation.enterpriseEmail
            ? null
            : affiliation.enterpriseEmail;
          affiliation.affiliationStatus = AFFILIATION_STATUS.UNKNOWN;
        }

        if (
          (affiliation.enterpriseId && affiliation.enterpriseEmail) ||
          (affiliation.enterpriseId &&
            !affiliation.enterpriseEmail &&
            enterprise?.hasManualAffiliation)
        ) {
          affiliation.affiliationStatus = AFFILIATION_STATUS.TO_AFFILIATE;
        }

        citizen.affiliation = affiliation;

        let result;

        if (!citizenId) {
          result = await this.citizenRepository.create({
            ...citizen,
            ...keycloakResult,
          });
          // Send verification mail
          await this.kcService.sendExecuteActionsEmailUserKc(result.id, actions);
        } else {
          // Completion Mode
          result = await this.citizenRepository.create({
            ...citizen,
          });
        }

        // Send a manual affiliaton mail to the company's funders accepting the manual affiliation
        if (
          citizen.affiliation?.enterpriseId &&
          !citizen.affiliation?.enterpriseEmail &&
          enterprise.hasManualAffiliation
        ) {
          await this.sendManualAffiliationMail(citizen, enterprise);
        }

        // Send the affiliation mail to citizens with a professional email
        if (
          (result?.affiliation?.affiliationStatus !== AFFILIATION_STATUS.UNKNOWN &&
            !enterprise?.hasManualAffiliation) ||
          (result?.affiliation?.affiliationStatus === AFFILIATION_STATUS.TO_AFFILIATE &&
            enterprise?.hasManualAffiliation &&
            result?.affiliation?.enterpriseEmail)
        ) {
          await this.sendAffiliationMail(this.mailService, result, enterprise!.name);
        }

        return {
          id: result.id,
        };
      }

      return keycloakResult;
    } catch (error) {
      if (keycloakResult && keycloakResult.id) {
        await this.citizenRepository.deleteById(keycloakResult.id);
        await this.kcService.deleteUserKc(keycloakResult.id);
      } else if (citizenId) {
        await this.kcService.updateCitizenRole(citizenId, GROUPS.citizens, true);
        await this.citizenRepository.deleteById(citizenId);
      }
      throw error;
    }
  }
}

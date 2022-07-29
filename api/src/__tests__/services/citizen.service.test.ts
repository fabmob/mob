import * as Excel from 'exceljs';
import {
  StubbedInstanceWithSinonAccessor,
  createStubInstance,
  expect,
  sinon,
} from '@loopback/testlab';
import {securityId, UserProfile} from '@loopback/security';
import {
  CitizenService,
  FunderService,
  IUser,
  JwtService,
  MailService,
  Tab,
  KeycloakService,
} from '../../services';
import {ValidationError} from '../../validationError';
import {
  AFFILIATION_STATUS,
  CITIZEN_STATUS,
  ResourceName,
  StatusCode,
  SUBSCRIPTION_STATUS,
} from '../../utils';
import {
  Incentive,
  Citizen,
  Enterprise,
  Subscription,
  UserEntity,
  OfflineUserSession,
  OfflineClientSession,
  Client,
  User,
} from '../../models';
import {
  UserRepository,
  CitizenRepository,
  EnterpriseRepository,
  SubscriptionRepository,
  UserEntityRepository,
  ClientRepository,
  OfflineClientSessionRepository,
  OfflineUserSessionRepository,
} from '../../repositories';
import {AnyObject} from '@loopback/repository';

describe('Citizen services', () => {
  let citizenService: any = null;
  let citizenRepository: StubbedInstanceWithSinonAccessor<CitizenRepository>,
    enterpriseRepository: StubbedInstanceWithSinonAccessor<EnterpriseRepository>,
    userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    userEntityRepository: StubbedInstanceWithSinonAccessor<UserEntityRepository>,
    clientRepository: StubbedInstanceWithSinonAccessor<ClientRepository>,
    offlineClientSessionRepository: StubbedInstanceWithSinonAccessor<OfflineClientSessionRepository>,
    offlineUserSessionRepository: StubbedInstanceWithSinonAccessor<OfflineUserSessionRepository>;

  const currentUser: UserProfile = {
    id: 'idUser',
    emailVerified: true,
    maas: undefined,
    membership: ['/entreprise/capgemini'],
    roles: ['offline_access', 'uma_authorization'],
    incentiveType: 'AideEmployeur',
    funderName: 'funderName',
    [securityId]: 'idUser',
  };
  let mailService: any = null;
  let jwtService: any = null;
  let keycloakService: any = null;

  const citizen = new Citizen({
    firstName: 'Xina',
    lastName: 'Zhong',
  });

  beforeEach(() => {
    mailService = createStubInstance(MailService);
    keycloakService = createStubInstance(KeycloakService);
    citizenRepository = createStubInstance(CitizenRepository);
    enterpriseRepository = createStubInstance(EnterpriseRepository);
    userRepository = createStubInstance(UserRepository);
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    userRepository = createStubInstance(UserRepository);
    userEntityRepository = createStubInstance(UserEntityRepository);
    clientRepository = createStubInstance(ClientRepository);
    offlineClientSessionRepository = createStubInstance(OfflineClientSessionRepository);
    offlineUserSessionRepository = createStubInstance(OfflineUserSessionRepository);

    jwtService = new JwtService();
    citizenService = new CitizenService(
      citizenRepository,
      enterpriseRepository,
      userRepository,
      subscriptionRepository,
      jwtService,
      currentUser,
      userEntityRepository,
      clientRepository,
      offlineClientSessionRepository,
      offlineUserSessionRepository,
      keycloakService,
      mailService,
    );
  });

  it('sendAffiliationMail: successfull', () => {
    citizenService.sendAffiliationMail(mailService, mockCitizen, 'entrepiseName');
    mailService.stubs.sendMailAsHtml.resolves('success');
    expect(mailService.sendMailAsHtml.calledOnce).true();
    expect(
      mailService.sendMailAsHtml.calledWith(
        'test@outlook.com',
        'Rejoignez la communauté de votre entreprise sur Mon Compte Mobilité !',
        'affiliation-citoyen',
        sinon.match.any,
      ),
    ).true();
  });

  it('validateEmailPattern : successful', () => {
    try {
      citizenService.validateEmailPattern('rerer@toto.fr', ['@toto.fr', '@toto.com']);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('validateEmailPattern : fail', () => {
    try {
      citizenService.validateEmailPattern('rerer@titi.fr', ['@toto.fr', '@toto.com']);
      sinon.assert.fail();
    } catch (error) {
      expect(error).to.deepEqual(expectedErrorEmailFormat);
    }
  });

  it('Check Affiliation: OK', async () => {
    citizenRepository.stubs.findById.resolves(mockCitizen);
    enterpriseRepository.stubs.findById.resolves(mockEnterprise);
    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(true);

    sinon.stub(jwtService, 'decodeAffiliationAccessToken').returns(mockedDecodedToken);

    const citizen = await citizenService.checkAffiliation(mockedToken);
    expect(citizen).to.deepEqual(mockCitizen);
  });

  it('Check Affiliation: Token KO', async () => {
    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(false);

    try {
      await citizenService.checkAffiliation(mockedToken);
    } catch (err) {
      expect(err).to.deepEqual(expectedErrorNotValid);
    }
  });

  it('Check Affiliation: Enterprise Repository KO', async () => {
    citizenRepository.stubs.findById.resolves(mockCitizen);
    enterpriseRepository.stubs.findById.rejects();

    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(true);

    sinon.stub(jwtService, 'decodeAffiliationAccessToken').returns(mockedDecodedToken);

    try {
      await citizenService.checkAffiliation(mockedToken);
    } catch (err) {
      expect(err).to.deepEqual(expectedErrorNotValid);
    }
  });

  it('Check Affiliation: Citizen Repository KO', async () => {
    citizenRepository.stubs.findById.rejects();
    enterpriseRepository.stubs.findById.resolves(mockEnterprise);

    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(true);

    sinon.stub(jwtService, 'decodeAffiliationAccessToken').returns(mockedDecodedToken);

    try {
      await citizenService.checkAffiliation(mockedToken);
    } catch (err) {
      expect(err).to.deepEqual(expectedErrorNotValid);
    }
  });

  it('Check Affiliation: Citizen Affiliation KO', async () => {
    const mockCitizenAffliationKO = new Citizen({...mockCitizen});

    citizenRepository.stubs.findById.resolves(mockCitizenAffliationKO);
    enterpriseRepository.stubs.findById.resolves(mockEnterprise);

    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(true);

    sinon.stub(jwtService, 'decodeAffiliationAccessToken').returns(mockedDecodedToken);

    try {
      await citizenService.checkAffiliation(mockedToken);
    } catch (err) {
      expect(err).to.deepEqual(expectedErrorNotValid);
    }
  });

  it('Check Affiliation: Affiliation enterpriseId matches token KO', async () => {
    const mockCitizenAffliationKO: any = {
      ...mockCitizen,
      affiliation: {...mockCitizen.affiliation},
    };
    mockCitizenAffliationKO.affiliation.enterpriseId = 'KO';

    citizenRepository.stubs.findById.resolves(mockCitizenAffliationKO);
    enterpriseRepository.stubs.findById.resolves(mockEnterprise);

    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(true);

    sinon.stub(jwtService, 'decodeAffiliationAccessToken').returns(mockedDecodedToken);

    try {
      await citizenService.checkAffiliation(mockedToken);
    } catch (err) {
      expect(err).to.deepEqual(expectedErrorNotValid);
    }
  });

  it('Check Affiliation: Status KO', async () => {
    const mockCitizenAffliationKO: any = {
      ...mockCitizen,
      affiliation: {...mockCitizen.affiliation},
    };
    mockCitizenAffliationKO.affiliation!.affiliationStatus =
      AFFILIATION_STATUS.AFFILIATED;
    citizenRepository.stubs.findById.resolves(mockCitizenAffliationKO);
    enterpriseRepository.stubs.findById.resolves(mockEnterprise);

    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(true);

    sinon.stub(jwtService, 'decodeAffiliationAccessToken').returns(mockedDecodedToken);

    try {
      await citizenService.checkAffiliation(mockedToken);
    } catch (err) {
      expect(err).to.deepEqual(expectedErrorBadStatus);
    }
  });

  it('sendDisaffiliationMail: successfull', () => {
    citizenService.sendDisaffiliationMail(mailService, mockCitizen);
    mailService.stubs.sendMailAsHtml.resolves('success');
    expect(mailService.sendMailAsHtml.calledOnce).true();
    expect(
      mailService.sendMailAsHtml.calledWith(
        'email@gmail.com',
        'Votre affiliation à votre employeur a été mise à jour',
        'desaffiliation-citoyen',
      ),
    ).true();
  });

  it('Check Disaffiliation: KO', async () => {
    citizenRepository.stubs.findById.resolves(new Citizen({id: 'randomInputId'}));
    userRepository.stubs.findOne.resolves(mockUserWithCom);
    subscriptionRepository.stubs.find.resolves();

    try {
      await citizenService.checkDisaffiliation('randomInputId');
    } catch (err) {
      expect(err).to.deepEqual(expectedErrorDisaffiliation);
    }
  });

  it('check generateRow : success', async () => {
    try {
      const header: string[] = [
        'Date de la demande',
        "Nom de l'aide",
        'Financeur',
        'Statut',
        'specificField',
      ];
      const excepted: string[] = [
        '06/04/2021',
        'incentiveTitle',
        'funderName',
        'à traiter',
        'value',
      ];
      const result: string[] = await citizenService.generateRow(
        mockDemandeWithSpecefiqueFields,
        header,
      );
      expect(result).to.deepEqual(excepted);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check generateRow avec justificatifs: success', async () => {
    try {
      const header: string[] = [
        'Date de la demande',
        "Nom de l'aide",
        'Financeur',
        'Statut',
        'Nom des justificatifs transmis',
      ];
      const excepted: string[] = [
        '06/04/2021',
        'incentiveTitle',
        'funderName',
        'à traiter',
        'originalName',
      ];

      const result: string[] = await citizenService.generateRow(
        mockDemandeWithJustificatifs,
        header,
      );
      expect(result).to.deepEqual(excepted);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check generateHeader : success', async () => {
    try {
      const excepted: string[] = [
        'Date de la demande',
        "Nom de l'aide",
        'Financeur',
        'Statut',
        'Nom des justificatifs transmis',
        'specificField',
      ];

      const result: string[] = await citizenService.generateHeader(incentive);
      expect(result).to.deepEqual(excepted);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check generateTabsDataStructure without SpecefiqueFields: success', async () => {
    try {
      const excepted: Tab[] = tabsWithoutSF;
      const result: Tab[] = await citizenService.generateTabsDataStructure(
        [mockSubscription, {incentiveId: null}],
        [{id: 'incentiveId'}],
      );
      expect(result).to.deepEqual(excepted);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check generateTabsDataStructure : success', async () => {
    try {
      const excepted: Tab[] = tabs;
      const result: Tab[] = await citizenService.generateTabsDataStructure(
        [mockDemandeWithSpecefiqueFields],
        [incentive],
      );
      expect(result).to.deepEqual(excepted);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check getListMaasNames : success', async () => {
    userEntityRepository.stubs.findOne.resolves(userEntity);
    offlineUserSessionRepository.stubs.find.resolves([offlineUserSession]);
    offlineClientSessionRepository.stubs.find.resolves([offlineClientSession]);
    clientRepository.stubs.find.resolves([client]);
    try {
      const result: string[] = await citizenService.getListMaasNames('email@gmail.com');
      expect(result).to.deepEqual(['name maas']);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check getListMaasNames empty: success', async () => {
    userEntityRepository.stubs.findOne.resolves(userEntity);
    offlineUserSessionRepository.stubs.find.resolves([]);
    offlineClientSessionRepository.stubs.find.resolves([]);
    clientRepository.stubs.find.resolves([]);
    try {
      const result: string[] = await citizenService.getListMaasNames('email@gmail.com');
      expect(result).to.deepEqual([]);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check addSheetSubscriptions: success', async () => {
    const workbook = new Excel.Workbook();
    const userDemandes: Subscription[] = [mockSubscription];
    const userAides: Incentive[] = [mockAideCollectivite];
    try {
      citizenService.addSheetSubscriptions(workbook, userDemandes, userAides);
      const result = await workbook.xlsx.writeBuffer();
      expect(result).to.be.instanceof(Buffer);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check Buffer issue de la generation excel : success', async () => {
    const userDemandes: Subscription[] = [];
    const incentives: Incentive[] = [];
    const listMaas: string[] = [];
    const companyName = 'companyName';
    try {
      const result = await citizenService.generateExcelRGPD(
        citizen,
        companyName,
        userDemandes,
        incentives,
        listMaas,
      );
      expect(result).to.be.instanceof(Buffer);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('sendDeletionMail: successfull', () => {
    citizenService.sendDeletionMail(mailService, mockCitizen, '23/07/2022 à 12:12');
    mailService.stubs.sendMailAsHtml.resolves('success');
    expect(mailService.sendMailAsHtml.calledOnce).true();
    expect(
      mailService.sendMailAsHtml.calledWith(
        mockCitizen.email,
        'Votre compte MOB a été supprimé',
        'deletion-account-citizen',
        sinon.match.any,
      ),
    ).true();
  });

  it('checkProEmailExistence : successful', () => {
    citizenRepository.stubs.findOne.resolves(null);
    try {
      citizenService.checkProEmailExistence('test@test.com');
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('checkProEmailExistence : fail', () => {
    citizenRepository.stubs.findOne.resolves(mockCitizen);
    try {
      citizenService.checkProEmailExistence('test@outlook.com');
    } catch (error) {
      expect(error).to.deepEqual(expectedErrorEmailUnique);
    }
  });

  it('findEmployees: successfull', async () => {
    userEntityRepository.stubs.findOne.resolves(userEntity);
    userRepository.stubs.findById.resolves(mockUserWithCom);
    citizenRepository.stubs.findByParams.resolves([mockCitizen2, mockCitizen2]);

    citizenRepository.stubs.execute.resolves([{_id: null, count: 2}]);

    const result = await citizenService.findEmployees(AFFILIATION_STATUS.AFFILIATED);

    expect(result).to.deepEqual({
      employees: [mockCitizen2, mockCitizen2],
      employeesCount: 0,
    });
  });

  it('check getClientList : success', async () => {
    clientRepository.stubs.find.resolves(clients);
    try {
      const result: string[] = await citizenService.getClientList(
        'simulation-maas-client',
      );
      expect(result).to.deepEqual(clients);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check getClientList : fail', async () => {
    clientRepository.stubs.find.resolves(clients);
    try {
      citizenService.getClientList('simulation');
    } catch (error) {
      expect(error).to.deepEqual(expectedErrorClientId);
    }
  });
  it('sendInactifAccountDeletionMail: successfull', () => {
    citizenService.sendInactifAccountDeletionMail(mailService, mockCitizen);
    mailService.stubs.sendMailAsHtml.resolves('success');
    expect(mailService.sendMailAsHtml.calledOnce).true();
    expect(
      mailService.sendMailAsHtml.calledWith(
        mockCitizen.email,
        'Votre compte MOB inactif a été supprimé',
        'inactif-account-deletion',
        sinon.match.any,
      ),
    ).true();
  });
});

const expectedErrorNotValid = new ValidationError(
  'citizens.affiliation.not.valid',
  '/citizensAffiliationNotValid',
  StatusCode.UnprocessableEntity,
  ResourceName.Affiliation,
);

const expectedErrorBadStatus = new ValidationError(
  'citizens.affiliation.bad.status',
  '/citizensAffiliationBadStatus',
  StatusCode.PreconditionFailed,
  ResourceName.Affiliation,
);

const expectedErrorEmailFormat = new ValidationError(
  'citizen.email.professional.error.format',
  '/professionnalEmailBadFormat',
  StatusCode.PreconditionFailed,
  ResourceName.ProfessionalEmail,
);

const expectedErrorDisaffiliation = new ValidationError(
  'citizens.disaffiliation.impossible',
  '/citizensDisaffiliationImpossible',
  StatusCode.PreconditionFailed,
  ResourceName.Disaffiliation,
);
const expectedErrorClientId = new ValidationError(
  'client.id.notFound',
  '/clientIdNotFound',
  StatusCode.NotFound,
  ResourceName.Client,
);

const expectedErrorEmailUnique = new ValidationError(
  'citizen.email.error.unique',
  '/affiliation.enterpriseEmail',
  StatusCode.UnprocessableEntity,
  ResourceName.UniqueProfessionalEmail,
);

const MockUsers = [
  {
    username: 'bob@capgemini.com',
    emailVerified: false,
    firstName: 'bob',
    lastName: 'l’éponge',
    email: 'bob@capgemini.com',
  },
  {
    username: 'bob1@capgemini.com',
    emailVerified: false,
    firstName: 'bob1',
    lastName: 'l’éponge1',
    email: 'bob1@capgemini.com',
  },
];

const MockUserGroups = [
  {
    name: 'citoyens',
    paths: '/citoyens',
  },
];

const mockedToken = 'montoken';

const mockedDecodedToken = {
  id: 'randomInputId',
  enterpriseId: 'randomInputEnterpriseId',
};

const mockCitizen2 = new Citizen({
  id: 'randomInputId',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  password: 'password123123!',
  city: 'test',
  status: CITIZEN_STATUS.EMPLOYEE,
  birthdate: '1991-11-17',
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: 'funderId',
    enterpriseEmail: 'test@outlook.com',
    affiliationStatus: AFFILIATION_STATUS.AFFILIATED,
  }),
  getId: () => {},
  getIdObject: () => ({id: 'random'}),
  toJSON: () => ({id: 'random'}),
  toObject: () => ({id: 'random'}),
});

const mockCitizen = new Citizen({
  id: 'randomInputId',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  password: 'password123123!',
  city: 'test',
  status: CITIZEN_STATUS.EMPLOYEE,
  birthdate: '1991-11-17',
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: 'randomInputEnterpriseId',
    enterpriseEmail: 'test@outlook.com',
    affiliationStatus: AFFILIATION_STATUS.TO_AFFILIATE,
  }),
  getId: () => {},
  getIdObject: () => ({id: 'random'}),
  toJSON: () => ({id: 'random'}),
  toObject: () => ({id: 'random'}),
});

const mockEnterprise = new Enterprise({
  id: 'randomInputEnterpriseId',
  emailFormat: ['test@outlook.com', 'test@outlook.fr', 'test@outlook.xxx'],
  name: 'test',
  siretNumber: 50,
  employeesCount: 2345,
  budgetAmount: 102,
  getId: () => {},
  getIdObject: () => ({id: 'random'}),
  toJSON: () => ({id: 'random'}),
  toObject: () => ({id: 'random'}),
});

const mockUserWithCom = new User({
  id: 'idUser',
  email: 'random@random.fr',
  firstName: 'firstName',
  lastName: 'lastName',
  funderId: 'funderId',
  roles: ['gestionnaires'],
  communityIds: ['id1'],
});

const mockSubscription = new Subscription({
  id: 'randomInputId',
  incentiveId: 'incentiveId',
  funderName: 'funderName',
  incentiveType: 'AideEmployeur',
  incentiveTitle: 'incentiveTitle',
  citizenId: 'email@gmail.com',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  consent: true,
  incentiveTransportList: ['velo'],
  communityId: 'id1',
  status: SUBSCRIPTION_STATUS.TO_PROCESS,
  createdAt: new Date('2021-04-06T09:01:30.778Z'),
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
});

const mockDemandeWithJustificatifs = new Subscription({
  id: 'randomInputId',
  incentiveId: 'incentiveId',
  funderName: 'funderName',
  incentiveType: 'AideEmployeur',
  incentiveTitle: 'incentiveTitle',
  citizenId: 'email@gmail.com',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  consent: true,
  incentiveTransportList: ['velo'],
  communityId: 'id1',
  status: SUBSCRIPTION_STATUS.TO_PROCESS,
  createdAt: new Date('2021-04-06T09:01:30.778Z'),
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  attachments: [
    {
      originalName: 'originalName',
      mimeType: '',
      uploadDate: new Date(),
      proofType: '',
    },
  ],
});

const mockDemandeWithSpecefiqueFields = new Subscription({
  ...mockSubscription,
  specificFields: {
    specificField: 'value',
  },
});

const incentive = {
  id: 'incentiveId',
  specificFields: [{title: 'specificField', inputFormat: 'Numerique'}],
};

const tabs: Tab[] = [
  {
    title: 'incentiveId',
    header: [
      'Date de la demande',
      "Nom de l'aide",
      'Financeur',
      'Statut',
      'Nom des justificatifs transmis',
      'specificField',
    ],
    rows: [['06/04/2021', 'incentiveTitle', 'funderName', 'à traiter', '', 'value']],
  },
];
const tabsWithoutSF: Tab[] = [
  {
    title: 'incentiveId',
    header: [
      'Date de la demande',
      "Nom de l'aide",
      'Financeur',
      'Statut',
      'Nom des justificatifs transmis',
    ],
    rows: [['06/04/2021', 'incentiveTitle', 'funderName', 'à traiter', '']],
  },
];

const userEntity: UserEntity = {
  id: 'idUser',
  email: 'email@gmail.com',
  username: '',
  emailVerified: true,
  enabled: true,
  notBefore: 0,
  getId: () => {},
  getIdObject: () => new Object(),
  toObject: () => new Object(),
  toJSON: () => new Object(),
  keycloakGroups: [],
};

const offlineUserSession: OfflineUserSession = {
  userId: 'userId',
  userSessionId: 'sessionId',
  realmId: 'null',
  createdOn: 1,
  offlineFlag: '',
  lastSessionRefresh: 0,
  getId: () => {},
  getIdObject: () => new Object(),
  toObject: () => new Object(),
  toJSON: () => new Object(),
};

const offlineClientSession: OfflineClientSession = {
  clientId: 'clientId',
  userSessionId: 'sessionId',
  offlineFlag: '',
  getId: () => {},
  getIdObject: () => new Object(),
  toObject: () => new Object(),
  toJSON: () => new Object(),
  externalClientId: '',
  clientStorageProvider: '',
};

const client: Client = {
  id: 'clientId',
  name: 'name maas',
  clientId: 'clientIdMaas',
  alwaysDisplayInConsole: false,
  bearerOnly: false,
  consentRequired: false,
  enabled: false,
  fullScopeAllowed: false,
  publicClient: false,
  surrogateAuthRequired: false,
  frontchannelLogout: false,
  serviceAccountsEnabled: false,
  standardFlowEnabled: false,
  implicitFlowEnabled: false,
  getId: () => {},
  getIdObject: () => new Object(),
  toObject: () => new Object(),
  toJSON: () => new Object(),
  directAccessGrantsEnabled: false,
};

const clients: Client[] = [
  {
    id: 'clientId',
    name: 'simulation maas client',
    clientId: 'simulation-maas-client',
    alwaysDisplayInConsole: false,
    bearerOnly: false,
    consentRequired: false,
    enabled: false,
    fullScopeAllowed: false,
    publicClient: false,
    surrogateAuthRequired: false,
    frontchannelLogout: false,
    serviceAccountsEnabled: false,
    standardFlowEnabled: false,
    implicitFlowEnabled: false,
    getId: () => {},
    getIdObject: () => new Object(),
    toObject: () => new Object(),
    toJSON: () => new Object(),
    directAccessGrantsEnabled: false,
  },
  {
    id: 'clientId2',
    name: 'mulhouse maas client',
    clientId: 'mulhouse-maas-client',
    alwaysDisplayInConsole: false,
    bearerOnly: false,
    consentRequired: false,
    enabled: false,
    fullScopeAllowed: false,
    publicClient: false,
    surrogateAuthRequired: false,
    frontchannelLogout: false,
    serviceAccountsEnabled: false,
    standardFlowEnabled: false,
    implicitFlowEnabled: false,
    getId: () => {},
    getIdObject: () => new Object(),
    toObject: () => new Object(),
    toJSON: () => new Object(),
    directAccessGrantsEnabled: false,
  },
  {
    id: 'clientId3',
    name: 'paris maas client',
    clientId: 'paris-maas-client',
    alwaysDisplayInConsole: false,
    bearerOnly: false,
    consentRequired: false,
    enabled: false,
    fullScopeAllowed: false,
    publicClient: false,
    surrogateAuthRequired: false,
    frontchannelLogout: false,
    serviceAccountsEnabled: false,
    standardFlowEnabled: false,
    implicitFlowEnabled: false,
    getId: () => {},
    getIdObject: () => new Object(),
    toObject: () => new Object(),
    toJSON: () => new Object(),
    directAccessGrantsEnabled: false,
  },
];

const mockAideCollectivite = new Incentive({
  territoryName: 'Toulouse',
  additionalInfos: 'test',
  funderName: 'Mairie',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: 'incentiveId',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
});

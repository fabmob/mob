import {
  StubbedInstanceWithSinonAccessor,
  createStubInstance,
  expect,
  sinon,
} from '@loopback/testlab';
import {securityId, UserProfile} from '@loopback/security';
import {
  AffiliationService,
  JwtService,
  MailService,
  KeycloakService,
} from '../../services';
import {ValidationError} from '../../validationError';
import {AFFILIATION_STATUS, CITIZEN_STATUS, ResourceName, StatusCode} from '../../utils';
import {Citizen, Enterprise, UserEntity, User, Affiliation} from '../../models';
import {
  UserRepository,
  AffiliationRepository,
  EnterpriseRepository,
  SubscriptionRepository,
} from '../../repositories';

describe('Affiliation services', () => {
  let affiliationService: any = null;
  let userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    affiliationRepository: StubbedInstanceWithSinonAccessor<AffiliationRepository>,
    subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    enterpriseRepository: StubbedInstanceWithSinonAccessor<EnterpriseRepository>;
  let mailService: any = null;
  let jwtService: any = null;
  let keycloakService: any = null;

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

  const citizen = new Citizen({
    identity: {
      gender: {
        value: 1,
        source: 'moncomptemobilite.fr',
        certificationDate: new Date('2022-10-24'),
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
      firstName: {
        value: 'Xina',
        source: 'moncomptemobilite.fr',
        certificationDate: new Date('2022-10-24'),
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
      lastName: {
        value: 'Zhong',
        source: 'moncomptemobilite.fr',
        certificationDate: new Date('2022-10-24'),
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
      birthDate: {
        value: '1991-11-17',
        source: 'moncomptemobilite.fr',
        certificationDate: new Date('2022-10-24'),
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
      toJSON: () => ({id: 'random'}),
      toObject: () => ({id: 'random'}),
    },
  });

  beforeEach(() => {
    mailService = createStubInstance(MailService);
    keycloakService = createStubInstance(KeycloakService);
    userRepository = createStubInstance(UserRepository);
    userRepository = createStubInstance(UserRepository);
    affiliationRepository = createStubInstance(AffiliationRepository);
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    enterpriseRepository = createStubInstance(EnterpriseRepository);

    jwtService = new JwtService();
    affiliationService = new AffiliationService(
      affiliationRepository,
      userRepository,
      subscriptionRepository,
      enterpriseRepository,
      keycloakService,
      mailService,
      jwtService,
      currentUser,
    );
  });

  it('sendAffiliationMail: successfull', () => {
    mailService.stubs.sendMailAsHtml.resolves('success');
    affiliationService.sendAffiliationMail(mailService, mockCitizen, 'funderName');
    expect(mailService.sendMailAsHtml.calledOnce).true();
    expect(
      mailService.sendMailAsHtml.calledWith(
        'test@outlook.com',
        `Bienvenue dans votre communauté moB ${'funderName'}`,
        'citizen-affiliation',
        sinon.match.any,
      ),
    ).true();
  });

  it('isValidEmailProPattern : successful', () => {
    const isValidPattern = affiliationService.isValidEmailProPattern('rerer@toto.fr', [
      '@toto.fr',
      '@toto.com',
    ]);
    expect(isValidPattern).to.be.true;
  });

  it('isValidEmailProPattern : fail', () => {
    const isValidPattern = affiliationService.isValidEmailProPattern('rerer@titi.fr', [
      '@toto.fr',
      '@toto.com',
    ]);
    expect(isValidPattern).to.be.false;
  });

  it('Check Affiliation: OK', async () => {
    enterpriseRepository.stubs.findById.resolves(mockEnterprise);
    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(true);

    sinon.stub(jwtService, 'decodeAffiliationAccessToken').returns(mockedDecodedToken);

    const citizen = await affiliationService.checkAffiliation(mockCitizen, mockedToken);
    expect(citizen).to.deepEqual(mockCitizen);
  });

  it('Check Affiliation: Token KO', async () => {
    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(false);

    try {
      await affiliationService.checkAffiliation(mockCitizen, mockedToken);
    } catch (err) {
      expect(err).to.deepEqual(expectedErrorNotValid);
    }
  });

  it('Check Affiliation: Enterprise Repository KO', async () => {
    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(true);

    sinon.stub(jwtService, 'decodeAffiliationAccessToken').returns(mockedDecodedToken);

    try {
      await affiliationService.checkAffiliation(mockCitizen, mockedToken);
    } catch (err) {
      expect(err).to.deepEqual(expectedErrorNotValid);
    }
  });

  it('Check Affiliation: Citizen Affiliation KO', async () => {
    const mockCitizenAffliationKO = new Citizen({...mockCitizen});

    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(true);

    sinon.stub(jwtService, 'decodeAffiliationAccessToken').returns(mockedDecodedToken);

    try {
      await affiliationService.checkAffiliation(mockCitizenAffliationKO, mockedToken);
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

    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(true);

    sinon.stub(jwtService, 'decodeAffiliationAccessToken').returns(mockedDecodedToken);

    try {
      await affiliationService.checkAffiliation(mockCitizenAffliationKO, mockedToken);
    } catch (err) {
      expect(err).to.deepEqual(expectedErrorNotValid);
    }
  });

  it('Check Affiliation: Status KO', async () => {
    const mockCitizenAffliationKO: any = {
      ...mockCitizen,
      affiliation: {...mockCitizen.affiliation},
    };
    mockCitizenAffliationKO.affiliation!.status = AFFILIATION_STATUS.AFFILIATED;
    enterpriseRepository.stubs.findById.resolves(mockEnterprise);
    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(true);

    sinon.stub(jwtService, 'decodeAffiliationAccessToken').returns(mockedDecodedToken);

    try {
      await affiliationService.checkAffiliation(mockCitizenAffliationKO, mockedToken);
    } catch (err) {
      expect(err).to.deepEqual(expectedErrorBadStatus);
    }
  });

  it('sendDisaffiliationMail: successfull', () => {
    affiliationService.sendDisaffiliationMail(mailService, mockCitizen);
    mailService.stubs.sendMailAsHtml.resolves('success');
    expect(mailService.sendMailAsHtml.calledOnce).true();
    expect(
      mailService.sendMailAsHtml.calledWith(
        'email@gmail.com',
        'Votre affiliation employeur vient d’être supprimée',
        'disaffiliation-citizen',
      ),
    ).true();
  });
  it('sendRejectedAffiliation: successfull', () => {
    affiliationService.sendRejectedAffiliation(mockCitizen, 'enterpriseName');
    mailService.stubs.sendMailAsHtml.resolves('success');
    expect(mailService.sendMailAsHtml.calledOnce).true();
    expect(
      mailService.sendMailAsHtml.calledWith(
        'email@gmail.com',
        "Votre demande d'affiliation a été refusée",
        'affiliation-rejection',
      ),
    ).true();
  });
  it('sendValidatedAffiliation: successfull', () => {
    affiliationService.sendValidatedAffiliation(mockCitizen, 'enterpriseName');
    mailService.stubs.sendMailAsHtml.resolves('success');
    expect(mailService.sendMailAsHtml.calledOnce).true();
    expect(
      mailService.sendMailAsHtml.calledWith(
        'email@gmail.com',
        "Votre demande d'affiliation a été acceptée !",
        'affiliation-validation',
      ),
    ).true();
  });

  it('Check Disaffiliation: KO', async () => {
    userRepository.stubs.findOne.resolves(mockUserWithCom);

    try {
      await affiliationService.checkDisaffiliation('randomInputId');
    } catch (err) {
      expect(err).to.deepEqual(expectedErrorDisaffiliation);
    }
  });

  it('isEmailProExisting : email do not exist', async () => {
    try {
      affiliationRepository.stubs.findOne.resolves(null);
      const emailProExists = await affiliationService.isEmailProExisting('test@test.com');
      expect(emailProExists).to.be.false;
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('isEmailProExisting : email already exist', async () => {
    try {
      const mockAffiliation = {
        enterpriseEmail: 'test@test.com',
        enterpriseId: 'affId',
        status: AFFILIATION_STATUS.AFFILIATED,
      };
      affiliationRepository.stubs.findOne.resolves(mockAffiliation as Affiliation);
      const emailProExists = await affiliationService.isEmailProExisting('test@test.com');
      expect(emailProExists).to.be.true;
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('SendManualAffiliationMail: successfull', () => {
    userRepository.stubs.find.resolves([mockUserWithCom]);
    keycloakService.stubs.getUser.resolves(userEntity);
    affiliationService.sendManualAffiliationMail(mockCitizen, mockEnterprise);

    [mockUserWithCom].map(async singleFunder => {
      mailService.stubs.sendMailAsHtml.resolves('success');
      expect(mailService.sendMailAsHtml.calledOnce).true();
      expect(
        mailService.sendMailAsHtml.calledWith(
          singleFunder.email,
          `Vous avez une nouvelle demande d'affiliation !`,
          'manual-affiliation',
          sinon.match.any,
        ),
      ).true();
    });
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
  ResourceName.AffiliationBadStatus,
);

const expectedErrorDisaffiliation = new ValidationError(
  'citizens.disaffiliation.impossible',
  '/citizensDisaffiliationImpossible',
  StatusCode.PreconditionFailed,
  ResourceName.Disaffiliation,
);

const mockedToken = 'montoken';

const mockedDecodedToken = {
  id: 'randomInputId',
  enterpriseId: 'randomInputEnterpriseId',
};

const mockCitizen = new Citizen({
  id: 'randomInputId',
  identity: {
    gender: {
      value: 1,
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
      getId: () => {},
      getIdObject: () => ({id: 'random'}),
      toJSON: () => ({id: 'random'}),
      toObject: () => ({id: 'random'}),
    },
    firstName: {
      value: 'firstName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
      getId: () => {},
      getIdObject: () => ({id: 'random'}),
      toJSON: () => ({id: 'random'}),
      toObject: () => ({id: 'random'}),
    },
    lastName: {
      value: 'lastName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
      getId: () => {},
      getIdObject: () => ({id: 'random'}),
      toJSON: () => ({id: 'random'}),
      toObject: () => ({id: 'random'}),
    },
    birthDate: {
      value: '1991-11-17',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
      getId: () => {},
      getIdObject: () => ({id: 'random'}),
      toJSON: () => ({id: 'random'}),
      toObject: () => ({id: 'random'}),
    },
    toJSON: () => ({id: 'random'}),
    toObject: () => ({id: 'random'}),
  },
  personalInformation: Object.assign({
    email: Object.assign({
      value: 'email@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    }),
  }),
  city: 'test',
  status: CITIZEN_STATUS.EMPLOYEE,
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: 'randomInputEnterpriseId',
    enterpriseEmail: 'test@outlook.com',
    status: AFFILIATION_STATUS.TO_AFFILIATE,
  }),
  getId: () => {},
  getIdObject: () => ({id: 'random'}),
  toJSON: () => ({id: 'random'}),
  toObject: () => ({id: 'random'}),
});

const mockEnterprise = new Enterprise({
  id: 'randomInputIdEntreprise',
  emailFormat: ['test@outlook.com', 'test@outlook.fr', 'test@outlook.xxx'],
  name: 'nameEntreprise',
  siretNumber: 50,
  budgetAmount: 102,
  employeesCount: 100,
  hasManualAffiliation: true,
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
  toCitizen: () => new Citizen(),
  keycloakGroups: [],
  userAttributes: [],
};

import {StubbedInstanceWithSinonAccessor, createStubInstance, expect, sinon} from '@loopback/testlab';
import {securityId, UserProfile} from '@loopback/security';
import {AffiliationService, JwtService, MailService, KeycloakService} from '../../services';
import {AFFILIATION_STATUS, CITIZEN_STATUS, StatusCode} from '../../utils';
import {Citizen, UserEntity, User, Affiliation, Enterprise, EnterpriseDetails} from '../../models';
import {
  UserRepository,
  AffiliationRepository,
  SubscriptionRepository,
  FunderRepository,
} from '../../repositories';

describe('Affiliation services', () => {
  let affiliationService: any = null;
  let userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    affiliationRepository: StubbedInstanceWithSinonAccessor<AffiliationRepository>,
    subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>;
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

  beforeEach(() => {
    mailService = createStubInstance(MailService);
    keycloakService = createStubInstance(KeycloakService);
    userRepository = createStubInstance(UserRepository);
    userRepository = createStubInstance(UserRepository);
    affiliationRepository = createStubInstance(AffiliationRepository);
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    funderRepository = createStubInstance(FunderRepository);

    jwtService = new JwtService();
    affiliationService = new AffiliationService(
      affiliationRepository,
      userRepository,
      subscriptionRepository,
      funderRepository,
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
    funderRepository.stubs.getEnterpriseById.resolves(mockEnterprise);
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
      expect(err.message).to.equal('citizens.affiliation.not.valid');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('Check Affiliation: Enterprise Repository KO', async () => {
    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(true);

    sinon.stub(jwtService, 'decodeAffiliationAccessToken').returns(mockedDecodedToken);

    try {
      await affiliationService.checkAffiliation(mockCitizen, mockedToken);
    } catch (err) {
      expect(err.message).to.equal('citizens.affiliation.not.valid');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('Check Affiliation: Citizen Affiliation KO', async () => {
    const mockCitizenAffliationKO = new Citizen({...mockCitizen});

    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(true);

    sinon.stub(jwtService, 'decodeAffiliationAccessToken').returns(mockedDecodedToken);

    try {
      await affiliationService.checkAffiliation(mockCitizenAffliationKO, mockedToken);
    } catch (err) {
      expect(err.message).to.equal('citizens.affiliation.not.valid');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
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
      expect(err.message).to.equal('citizens.affiliation.not.valid');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('Check Affiliation: Status KO', async () => {
    const mockCitizenAffliationKO: any = {
      ...mockCitizen,
      affiliation: {...mockCitizen.affiliation},
    };
    mockCitizenAffliationKO.affiliation!.status = AFFILIATION_STATUS.AFFILIATED;
    funderRepository.stubs.getEnterpriseById.resolves(mockEnterprise);
    sinon.stub(jwtService, 'verifyAffiliationAccessToken').returns(true);

    sinon.stub(jwtService, 'decodeAffiliationAccessToken').returns(mockedDecodedToken);

    try {
      await affiliationService.checkAffiliation(mockCitizenAffliationKO, mockedToken);
    } catch (err) {
      expect(err.message).to.equal('citizens.affiliation.bad.status');
      expect(err.statusCode).to.equal(StatusCode.Conflict);
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
    funderRepository.stubs.getFunderByNameAndType.resolves(mockEnterprise);
    userRepository.stubs.findOne.resolves(mockUserWithCom);
    const result = await affiliationService.checkDisaffiliation('randomInputId');
    expect(result).to.equal(false);
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
  name: 'nameEntreprise',
  siretNumber: 50,
  mobilityBudget: 102,
  citizensCount: 100,
  enterpriseDetails: new EnterpriseDetails({
    emailDomainNames: ['test@outlook.com', 'test@outlook.fr', 'test@outlook.xxx'],
    hasManualAffiliation: true,
  }),
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

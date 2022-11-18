import * as Excel from 'exceljs';
import {
  StubbedInstanceWithSinonAccessor,
  createStubInstance,
  expect,
  sinon,
  stubServerRequest,
} from '@loopback/testlab';
import {securityId, UserProfile} from '@loopback/security';
import {
  CitizenService,
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
  Territory,
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
    citizenService.sendAffiliationMail(mailService, mockCitizen, 'funderName');
    mailService.stubs.sendMailAsHtml.resolves('success');
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
        'Votre affiliation employeur vient d’être supprimée',
        'disaffiliation-citizen',
      ),
    ).true();
  });
  it('sendRejectedAffiliation: successfull', () => {
    citizenService.sendRejectedAffiliation(mockCitizen, 'enterpriseName');
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
    citizenService.sendValidatedAffiliation(mockCitizen, 'enterpriseName');
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
        mockCitizen.personalInformation.email.value,
        'Votre compte a bien été supprimé',
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

    const employees = [{employees: [mockCitizen, mockCitizen2], employeesCount: 2}];

    citizenRepository.stubs.execute.resolves(employees);

    const result = citizenService
      .findEmployees(AFFILIATION_STATUS.AFFILIATED, 'lastName', 0, 10)
      .then((res: any) => res)
      .catch((err: any) => err);
    expect(result).deepEqual(
      new Promise(() => {
        return employees;
      }),
    );
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

  it('sendNonActivatedAccountDeletionMail: successfull', () => {
    citizenService.sendNonActivatedAccountDeletionMail(mailService, mockCitizen3);
    mailService.stubs.sendMailAsHtml.resolves('success');
    expect(mailService.sendMailAsHtml.calledOnce).true();
    expect(
      mailService.sendMailAsHtml.calledWith(
        mockCitizen3.email,
        'Votre compte moB vient d’être supprimé',
        'nonActivated-account-deletion',
        sinon.match.any,
      ),
    ).true();
  });

  it('SendManualAffiliationMail: successfull', () => {
    userRepository.stubs.find.resolves([mockUserWithCom]);
    keycloakService.stubs.getUser.resolves(userEntity);
    citizenService.sendManualAffiliationMail(mockCitizen, mockEnterprise);

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

  it('CreateCitizen Service  : fails because of create repository error', async () => {
    const errorRepository = 'can not add data in database';
    try {
      keycloakService.stubs.createUserKc.resolves({
        id: 'randomInputId',
      });
      citizenRepository.stubs.create.rejects(errorRepository);
      enterpriseRepository.stubs.findById.resolves(enterprise);
      keycloakService.stubs.deleteUserKc.resolves();

      await citizenService.createCitizen(salarie);
    } catch (err) {
      expect(err.name).to.equal(errorRepository);
    }

    keycloakService.stubs.createUserKc.restore();
    citizenRepository.stubs.create.restore();
    enterpriseRepository.stubs.findById.restore();
    keycloakService.stubs.deleteUserKc.restore();
  });

  it('CreateCitizen Service create salarie : successful', async () => {
    enterpriseRepository.stubs.findById.resolves(enterprise);
    keycloakService.stubs.createUserKc.resolves({
      id: 'randomInputId',
    });
    citizenRepository.stubs.create.resolves(createdSalarie);
    keycloakService.stubs.sendExecuteActionsEmailUserKc.resolves();

    const result = await citizenService.createCitizen(salarie);

    expect(result).to.deepEqual({
      id: 'randomInputId',
    });

    sinon.assert.calledWithExactly(
      citizenRepository.stubs.create,
      sinon.match(createdSalarie),
    );

    enterpriseRepository.stubs.findById.restore();
    keycloakService.stubs.createUserKc.restore();
    citizenRepository.stubs.create.restore();
    keycloakService.stubs.sendExecuteActionsEmailUserKc.restore();
  });

  it('CreateCitizen Service create salarie with manual affiliation : successful', async () => {
    enterpriseRepository.stubs.findById.resolves(mockEnterprise);
    keycloakService.stubs.createUserKc.resolves({
      id: 'randomInputId',
    });
    citizenRepository.stubs.create.resolves(createdSalarieNoProEmail);
    keycloakService.stubs.sendExecuteActionsEmailUserKc.resolves();
    const sendManualAff = sinon
      .stub(citizenService, 'sendManualAffiliationMail')
      .resolves(null);

    const result = await citizenService.createCitizen(salarieNoProEmail);

    expect(result).to.deepEqual({
      id: 'randomInputId',
    });

    sinon.assert.calledWithExactly(
      citizenRepository.stubs.create,
      sinon.match(createdSalarieNoProEmail),
    );

    enterpriseRepository.stubs.findById.restore();
    keycloakService.stubs.createUserKc.restore();
    citizenRepository.stubs.create.restore();
    keycloakService.stubs.sendExecuteActionsEmailUserKc.restore();
    sendManualAff.restore();
  });

  it('CreateCitizen Service create salarie no enterprise : successful', async () => {
    keycloakService.stubs.createUserKc.resolves({
      id: 'randomInputId',
    });
    citizenRepository.stubs.create.resolves(createdSalarieNoEnterprise);
    keycloakService.stubs.sendExecuteActionsEmailUserKc.resolves();

    const result = await citizenService.createCitizen(salarieNoEnterprise);

    expect(result).to.deepEqual({
      id: 'randomInputId',
    });

    sinon.assert.calledWithExactly(
      citizenRepository.stubs.create,
      sinon.match(createdSalarieNoEnterprise),
    );

    keycloakService.stubs.createUserKc.restore();
    citizenRepository.stubs.create.restore();
    keycloakService.stubs.sendExecuteActionsEmailUserKc.restore();
  });

  it('CreateCitizen Service create student : successful', async () => {
    keycloakService.stubs.createUserKc.resolves({
      id: 'randomInputId',
    });
    citizenRepository.stubs.create.resolves(createdStudent);
    keycloakService.stubs.sendExecuteActionsEmailUserKc.resolves();

    const result = await citizenService.createCitizen(student);

    expect(result).to.deepEqual({
      id: 'randomInputId',
    });

    const arg: any = {
      personalInformation: {
        email: {
          value: 'email@gmail.com',
          certificationDate: new Date('2022-11-03'),
          source: 'moncomptemobilite.fr',
        },
      },
      identity: {
        gender: {
          value: 1,
          source: 'moncomptemobilite.fr',
          certificationDate: new Date('2022-10-24'),
        },
        firstName: {
          value: 'firstName',
          source: 'moncomptemobilite.fr',
          certificationDate: new Date('2022-10-24'),
        },
        lastName: {
          value: 'lastName',
          source: 'moncomptemobilite.fr',
          certificationDate: new Date('2022-10-24'),
        },
        birthDate: {
          value: '1991-11-17',
          source: 'moncomptemobilite.fr',
          certificationDate: new Date('2022-10-24'),
        },
      },
      city: 'test',
      postcode: '31000',
      status: CITIZEN_STATUS.STUDENT,
      tos1: true,
      tos2: true,
      id: 'randomInputId',
      affiliation: {
        enterpriseId: null,
        enterpriseEmail: null,
        affiliationStatus: AFFILIATION_STATUS.UNKNOWN,
      },
    };

    sinon.assert.notCalled(enterpriseRepository.stubs.findById);
    keycloakService.stubs.createUserKc.restore();
    sinon.assert.calledWithExactly(citizenRepository.stubs.create, sinon.match(arg));
    citizenRepository.stubs.create.restore();
    keycloakService.stubs.sendExecuteActionsEmailUserKc.restore();
  });

  it('CreateCitizen Service createCitizenFc salarie : successful', async () => {
    enterpriseRepository.stubs.findById.resolves(enterprise);
    keycloakService.stubs.updateCitizenRole.resolves({
      id: 'randomInputId',
    });
    citizenRepository.stubs.create.resolves(createdSalarie);

    const result = await citizenService.createCitizen(salarie, 'randomInputId');

    expect(result).to.deepEqual({
      id: 'randomInputId',
    });

    sinon.assert.calledWithExactly(
      citizenRepository.stubs.create,
      sinon.match(createdSalarie),
    );

    enterpriseRepository.stubs.findById.restore();
    keycloakService.stubs.updateCitizenRole.restore();
    citizenRepository.stubs.create.restore();
  });

  it('CreateCitizenFc salarie no enterprise : successful', async () => {
    keycloakService.stubs.updateCitizenRole.resolves({
      id: 'randomInputId',
    });
    citizenRepository.stubs.create.resolves(createdSalarieNoEnterprise);
    keycloakService.stubs.sendExecuteActionsEmailUserKc.resolves();

    const result = await citizenService.createCitizen(
      salarieNoEnterprise,
      'randomInputId',
    );

    expect(result).to.deepEqual({
      id: 'randomInputId',
    });

    sinon.assert.calledWithExactly(
      citizenRepository.stubs.create,
      sinon.match(createdSalarieNoEnterprise),
    );

    keycloakService.stubs.updateCitizenRole.restore();
    citizenRepository.stubs.create.restore();
  });

  it('CreateCitizen Service createCitizenFc student : successful', async () => {
    keycloakService.stubs.updateCitizenRole.resolves({
      id: 'randomInputId',
    });
    citizenRepository.stubs.create.resolves(createdStudent);

    const result = await citizenService.createCitizen(student, 'randomInputId');

    expect(result).to.deepEqual({
      id: 'randomInputId',
    });

    const arg: any = {
      identity: {
        firstName: {
          value: 'firstName',
          source: 'moncomptemobilite.fr',
          certificationDate: new Date('2022-10-24'),
        },
        lastName: {
          value: 'lastName',
          source: 'moncomptemobilite.fr',
          certificationDate: new Date('2022-10-24'),
        },
        birthDate: {
          value: '1991-11-17',
          source: 'moncomptemobilite.fr',
          certificationDate: new Date('2022-10-24'),
        },
      },
      personalInformation: {
        email: {
          value: 'email@gmail.com',
          certificationDate: new Date('2022-11-03'),
          source: 'moncomptemobilite.fr',
        },
      },
      city: 'test',
      postcode: '31000',
      status: CITIZEN_STATUS.STUDENT,
      tos1: true,
      tos2: true,
      id: 'randomInputId',
      affiliation: {
        enterpriseId: null,
        enterpriseEmail: null,
        affiliationStatus: AFFILIATION_STATUS.UNKNOWN,
      },
    };

    sinon.assert.notCalled(enterpriseRepository.stubs.findById);
    keycloakService.stubs.updateCitizenRole.restore();
    sinon.assert.calledWithExactly(citizenRepository.stubs.create, sinon.match(arg));
    citizenRepository.stubs.create.restore();
  });

  it('CreateCitizen Service createCitizenFc etudiant keycloakResult undefined', async () => {
    keycloakService.stubs.updateCitizenRole.resolves({
      id: 'undefined',
    });

    const result = await citizenService.createCitizen(student);

    expect(result).to.deepEqual(undefined);

    keycloakService.stubs.updateCitizenRole.restore();
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

const mockedToken = 'montoken';

const mockedDecodedToken = {
  id: 'randomInputId',
  enterpriseId: 'randomInputEnterpriseId',
};

const mockCitizen2 = new Citizen({
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
  password: 'password123123!',
  city: 'test',
  status: CITIZEN_STATUS.EMPLOYEE,
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

const mockCitizen3 = {
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
  password: 'password123123!',
  city: 'test',
  status: CITIZEN_STATUS.EMPLOYEE,
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
  territory: {name: 'Toulouse', id: 'randomTerritoryId'} as Territory,
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

const salarie = Object.assign(new Citizen(), {
  identity: {
    gender: {
      value: 1,
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    },
    firstName: {
      value: 'firstName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    },
    lastName: {
      value: 'lastName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    },
    birthDate: {
      value: '1991-11-17',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    },
  },
  id: 'randomInputId',
  lastName: 'lastName',
  firstName: 'firstName',
  personalInformation: {
    email: {
      value: 'email@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    },
  },
  password: 'password123123!',
  city: 'test',

  status: CITIZEN_STATUS.EMPLOYEE,
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: 'enterpriseId',
    enterpriseEmail: 'enterpriseEmail@gmail.com',
  }),
  getId: () => {},
  getIdObject: () => ({id: 'random'}),
  toJSON: () => ({id: 'random'}),
  toObject: () => ({id: 'random'}),
});

const enterprise: Enterprise = new Enterprise({
  name: 'enterprise',
  emailFormat: ['@gmail.com', 'rr'],
});

const createdSalarie = Object.assign(new Citizen(), {
  id: 'randomInputId',
  identity: {
    gender: {
      value: 1,
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    },
    firstName: {
      value: 'firstName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    },
    lastName: {
      value: 'lastName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    },
    birthDate: {
      value: '1991-11-17',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    },
  },
  personalInformation: {
    email: {
      value: 'email@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    },
  },
  city: 'test',
  postcode: '31000',
  status: CITIZEN_STATUS.EMPLOYEE,
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: 'enterpriseId',
    enterpriseEmail: 'enterpriseEmail@gmail.com',
    affiliationStatus: AFFILIATION_STATUS.TO_AFFILIATE,
  }),
});

const createdSalarieNoEnterprise = Object.assign(new Citizen(), {
  id: 'randomInputId',
  identity: Object.assign({
    gender: Object.assign({
      value: 1,
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    firstName: Object.assign({
      value: 'firstName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    lastName: Object.assign({
      value: 'lastName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    birthDate: Object.assign({
      value: '1991-11-17',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
  }),
  personalInformation: {
    email: {
      value: 'email@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    },
  },
  city: 'test',
  postcode: '31000',
  status: CITIZEN_STATUS.EMPLOYEE,
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: null,
    enterpriseEmail: null,
    affiliationStatus: AFFILIATION_STATUS.UNKNOWN,
  }),
});

const salarieNoEnterprise = Object.assign(new Citizen(), {
  id: 'randomInputId',
  identity: Object.assign({
    gender: Object.assign({
      value: 1,
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    firstName: Object.assign({
      value: 'firstName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    lastName: Object.assign({
      value: 'lastName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    birthDate: Object.assign({
      value: '1991-11-17',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
  }),
  personalInformation: {
    email: {
      value: 'email@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    },
  },
  password: 'password123123!',
  city: 'test',
  status: CITIZEN_STATUS.EMPLOYEE,
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: '',
    enterpriseEmail: '',
  }),
});

const student = Object.assign(new Citizen(), {
  id: 'randomInputId',
  identity: Object.assign({
    gender: Object.assign({
      value: 1,
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    firstName: Object.assign({
      value: 'firstName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    lastName: Object.assign({
      value: 'lastName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    birthDate: Object.assign({
      value: '1991-11-17',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
  }),
  personalInformation: {
    email: {
      value: 'email@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    },
  },
  password: 'password123123!',
  city: 'test',
  status: CITIZEN_STATUS.STUDENT,
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: '',
    enterpriseEmail: '',
  }),
  getId: () => {},
  getIdObject: () => ({id: 'random'}),
  toJSON: () => ({id: 'random'}),
  toObject: () => ({id: 'random'}),
});

const createdStudent = Object.assign(new Citizen(), {
  id: 'randomInputId',
  identity: Object.assign({
    gender: Object.assign({
      value: 1,
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    firstName: Object.assign({
      value: 'firstName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    lastName: Object.assign({
      value: 'lastName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    birthDate: Object.assign({
      value: '1991-11-17',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
  }),
  personalInformation: {
    email: {
      value: 'email@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    },
  },
  password: 'password123123!',
  city: 'test',
  status: CITIZEN_STATUS.STUDENT,
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: null,
    enterpriseEmail: null,
    affiliationStatus: AFFILIATION_STATUS.UNKNOWN,
  }),
  getId: () => {},
  getIdObject: () => ({id: 'random'}),
  toJSON: () => ({id: 'random'}),
  toObject: () => ({id: 'random'}),
});

const createdSalarieNoProEmail = new Citizen({
  id: 'randomInputId',
  identity: Object.assign({
    gender: Object.assign({
      value: 1,
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    firstName: Object.assign({
      value: 'firstName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    lastName: Object.assign({
      value: 'lastName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    birthDate: Object.assign({
      value: '1991-11-17',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
  }),
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
    enterpriseId: 'enterpriseId',
    enterpriseEmail: null,
  }),
});

const salarieNoProEmail = new Citizen({
  id: 'randomInputId',
  identity: Object.assign({
    gender: Object.assign({
      value: 1,
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    firstName: Object.assign({
      value: 'firstName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    lastName: Object.assign({
      value: 'lastName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
    birthDate: Object.assign({
      value: '1991-11-17',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    }),
  }),
  personalInformation: Object.assign({
    email: Object.assign({
      value: 'email@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    }),
  }),
  password: 'password123123!',
  city: 'test',
  status: CITIZEN_STATUS.EMPLOYEE,
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: 'enterpriseId',
    enterpriseEmail: null,
    affiliationStatus: AFFILIATION_STATUS.UNKNOWN,
  }),
});

import * as Excel from 'exceljs';
import {cloneDeep} from 'lodash';
import {StubbedInstanceWithSinonAccessor, createStubInstance, expect, sinon} from '@loopback/testlab';
import {securityId, UserProfile} from '@loopback/security';
import {CitizenService, JwtService, MailService, KeycloakService, AffiliationService} from '../../services';
import {
  AFFILIATION_STATUS,
  CITIZEN_STATUS,
  EmployeesQueryParams,
  GROUPS,
  Roles,
  StatusCode,
  SUBSCRIPTION_STATUS,
  Tab,
} from '../../utils';
import {
  Incentive,
  Citizen,
  Subscription,
  UserEntity,
  OfflineUserSession,
  OfflineClientSession,
  Client,
  UserAttribute,
  Affiliation,
  Enterprise,
  EnterpriseDetails,
  KeycloakGroup,
  User,
} from '../../models';
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
} from '../../repositories';
import {RequiredActionAlias} from 'keycloak-admin/lib/defs/requiredActionProviderRepresentation';

describe('Citizen services', () => {
  let citizenService: any = null;
  let funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>,
    userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    userEntityRepository: StubbedInstanceWithSinonAccessor<UserEntityRepository>,
    userAttributeRepository: StubbedInstanceWithSinonAccessor<UserAttributeRepository>,
    clientRepository: StubbedInstanceWithSinonAccessor<ClientRepository>,
    offlineClientSessionRepository: StubbedInstanceWithSinonAccessor<OfflineClientSessionRepository>,
    offlineUserSessionRepository: StubbedInstanceWithSinonAccessor<OfflineUserSessionRepository>,
    affiliationRepository: StubbedInstanceWithSinonAccessor<AffiliationRepository>,
    affiliationService: StubbedInstanceWithSinonAccessor<AffiliationService>;

  const currentUser: UserProfile = {
    id: 'idUser',
    emailVerified: true,
    maas: undefined,
    membership: ['/entreprise/capgemini'],
    roles: ['offline_access', 'uma_authorization', 'citoyens'],
    incentiveType: 'AideEmployeur',
    funderName: 'funderName',
    scopes: ['openid', 'profile'],
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
    affiliationService = createStubInstance(AffiliationService);
    funderRepository = createStubInstance(FunderRepository);
    userRepository = createStubInstance(UserRepository);
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    userRepository = createStubInstance(UserRepository);
    userEntityRepository = createStubInstance(UserEntityRepository);
    userAttributeRepository = createStubInstance(UserAttributeRepository);
    clientRepository = createStubInstance(ClientRepository);
    offlineClientSessionRepository = createStubInstance(OfflineClientSessionRepository);
    offlineUserSessionRepository = createStubInstance(OfflineUserSessionRepository);
    affiliationRepository = createStubInstance(AffiliationRepository);

    jwtService = new JwtService();
    citizenService = new CitizenService(
      funderRepository,
      userRepository,
      subscriptionRepository,
      userEntityRepository,
      userAttributeRepository,
      clientRepository,
      offlineClientSessionRepository,
      offlineUserSessionRepository,
      jwtService,
      affiliationService,
      currentUser,
      keycloakService,
      mailService,
      affiliationRepository,
    );
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
      const excepted: string[] = ['06/04/2021', 'incentiveTitle', 'funderName', 'à traiter', 'value'];
      const result: string[] = await citizenService.generateRow(mockDemandeWithSpecefiqueFields, header);
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
      const excepted: string[] = ['06/04/2021', 'incentiveTitle', 'funderName', 'à traiter', 'originalName'];

      const result: string[] = await citizenService.generateRow(mockDemandeWithJustificatifs, header);
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
      const result = await citizenService.generateExcelGDPR(
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

  it('sendDeletionMail: successful', () => {
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

  it('check getClientList : success', async () => {
    clientRepository.stubs.find.resolves(clients);
    try {
      const result: string[] = await citizenService.getClientList('simulation-maas-client');
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
      expect(error.message).to.equal('client.id.notFound');
      expect(error.statusCode).to.equal(StatusCode.NotFound);
    }
  });

  it('sendNonActivatedAccountDeletionMail: successfull', () => {
    citizenService.sendNonActivatedAccountDeletionMail(
      mailService,
      mockCitizen3.email,
      mockCitizen3.firstName,
    );
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

  it('CreateCitizen Service  : fails because of Affiliation Repository error', async () => {
    const errorRepository = 'can not add data in database';
    try {
      keycloakService.stubs.createUserKc.resolves({
        id: 'randomInputId',
      });
      funderRepository.stubs.getEnterpriseById.resolves(enterprise);
      affiliationRepository.stubs.createAffiliation.rejects(errorRepository);
      affiliationRepository.stubs.findOne.resolves(
        Object.assign({
          citizenId: 'randomInputId',
        }),
      );
      affiliationRepository.stubs.deleteById.resolves();
      keycloakService.stubs.deleteUserKc.resolves();
      await citizenService.createCitizen(salarie);
    } catch (err) {
      expect(err.name).to.equal(errorRepository);
    }

    keycloakService.stubs.createUserKc.restore();
    funderRepository.stubs.getEnterpriseById.restore();
    affiliationRepository.stubs.createAffiliation.restore();
    affiliationRepository.stubs.findOne.restore();
    keycloakService.stubs.deleteUserKc.restore();
  });

  it('CreateCitizen Service create salarie : successful', async () => {
    funderRepository.stubs.getEnterpriseById.resolves(enterprise);
    keycloakService.stubs.createUserKc.resolves({
      id: 'randomInputId',
    });

    affiliationRepository.stubs.createAffiliation.resolves(
      Object.assign({
        citizenId: 'randomInputId',
        enterpriseId: 'enterpriseId',
        enterpriseEmail: 'enterpriseEmail@gmail.com',
        status: AFFILIATION_STATUS.TO_AFFILIATE,
      }),
    );
    keycloakService.stubs.sendExecuteActionsEmailUserKc.resolves();

    const result = await citizenService.createCitizen(salarie);

    expect(result).to.deepEqual({
      id: 'randomInputId',
    });

    sinon.assert.calledWithExactly(
      affiliationRepository.stubs.createAffiliation,
      sinon.match(new Citizen(expectedSalarieToBeCalledWith)),
      sinon.match(enterprise.enterpriseDetails.hasManualAffiliation as Boolean),
    );

    sinon.assert.calledWithExactly(
      keycloakService.stubs.createUserKc,
      sinon.match(new Citizen(expectedSalarieToBeCalledWith)),
      sinon.match([GROUPS.citizens]),
      sinon.match([RequiredActionAlias.VERIFY_EMAIL]),
    );

    funderRepository.stubs.getEnterpriseById.restore();
    affiliationRepository.stubs.createAffiliation.restore();
    keycloakService.stubs.createUserKc.restore();
    keycloakService.stubs.sendExecuteActionsEmailUserKc.restore();
  });

  it('CreateCitizen Service create salarie with manual affiliation : successful', async () => {
    funderRepository.stubs.getEnterpriseById.resolves(mockEnterprise);
    keycloakService.stubs.createUserKc.resolves({
      id: 'randomInputId',
    });

    affiliationRepository.stubs.createAffiliation.resolves(
      Object.assign({
        citizenId: 'randomInputId',
        enterpriseId: salarieNoProEmail.affiliation.enterpriseId,
        enterpriseEmail: salarieNoProEmail.affiliation.enterpriseEmail,
        status: AFFILIATION_STATUS.TO_AFFILIATE,
      }),
    );
    keycloakService.stubs.sendExecuteActionsEmailUserKc.resolves();
    const sendManualAff = affiliationService.stubs.sendManualAffiliationMail.resolves(undefined);

    const result = await citizenService.createCitizen(salarieNoProEmail);

    expect(result).to.deepEqual({
      id: 'randomInputId',
    });

    sinon.assert.calledWith(
      affiliationRepository.stubs.createAffiliation,
      sinon.match.has(
        'affiliation',
        sinon.match.has('enterpriseId', salarieNoProEmail.affiliation.enterpriseId),
      ) &&
        sinon.match.has(
          'affiliation',
          sinon.match.has('enterpriseEmail', salarieNoProEmail.affiliation.enterpriseEmail),
        ),
      sinon.match(mockEnterprise.enterpriseDetails.hasManualAffiliation as Boolean),
    );

    sinon.assert.calledWithExactly(
      keycloakService.stubs.createUserKc,
      sinon.match(new Citizen(expectedSalarieNoProEmailToBeCalledWith)),
      sinon.match([GROUPS.citizens]),
      sinon.match([RequiredActionAlias.VERIFY_EMAIL]),
    );

    affiliationRepository.stubs.createAffiliation.restore();
    funderRepository.stubs.getEnterpriseById.restore();
    keycloakService.stubs.createUserKc.restore();
    keycloakService.stubs.sendExecuteActionsEmailUserKc.restore();
    sendManualAff.restore();
  });

  it('CreateCitizen Service create salarie no enterprise : successful', async () => {
    keycloakService.stubs.createUserKc.resolves({
      id: 'randomInputId',
    });
    affiliationRepository.stubs.createAffiliation.resolves(
      Object.assign({
        citizenId: 'randomInputId',
        enterpriseId: salarieNoEnterprise.affiliation.enterpriseId,
        enterpriseEmail: salarieNoEnterprise.affiliation.enterpriseEmail,
        status: AFFILIATION_STATUS.UNKNOWN,
      }),
    );
    keycloakService.stubs.sendExecuteActionsEmailUserKc.resolves();

    const result = await citizenService.createCitizen(salarieNoEnterprise);

    expect(result).to.deepEqual({
      id: 'randomInputId',
    });

    sinon.assert.calledWithExactly(
      affiliationRepository.stubs.createAffiliation,
      sinon.match.has(
        'affiliation',
        sinon.match.has('enterpriseId', salarieNoEnterprise.affiliation.enterpriseId),
      ) &&
        sinon.match.has(
          'affiliation',
          sinon.match.has('enterpriseEmail', salarieNoEnterprise.affiliation.enterpriseEmail),
        ),
      sinon.match(false as Boolean),
    );

    sinon.assert.calledWithExactly(
      keycloakService.stubs.createUserKc,
      sinon.match(expectedSalarieNoEnterpriseToBeCalledWith),
      sinon.match([GROUPS.citizens]),
      sinon.match([RequiredActionAlias.VERIFY_EMAIL]),
    );

    sinon.assert.notCalled(funderRepository.stubs.getEnterpriseById);

    keycloakService.stubs.createUserKc.restore();
    affiliationRepository.stubs.createAffiliation.restore();
    keycloakService.stubs.sendExecuteActionsEmailUserKc.restore();
  });

  it('CreateCitizen Service create student : successful', async () => {
    keycloakService.stubs.createUserKc.resolves({
      id: 'randomInputId',
    });
    affiliationRepository.stubs.createAffiliation.resolves(
      Object.assign({
        citizenId: 'randomInputId',
        enterpriseId: student.affiliation.enterpriseId,
        enterpriseEmail: student.affiliation.enterpriseEmail,
        status: AFFILIATION_STATUS.UNKNOWN,
      }),
    );
    keycloakService.stubs.sendExecuteActionsEmailUserKc.resolves();

    const result = await citizenService.createCitizen(student);

    expect(result).to.deepEqual({
      id: 'randomInputId',
    });

    sinon.assert.calledWithExactly(
      affiliationRepository.stubs.createAffiliation,
      sinon.match.has('affiliation', sinon.match.has('enterpriseId', student.affiliation.enterpriseId)) &&
        sinon.match.has(
          'affiliation',
          sinon.match.has('enterpriseEmail', student.affiliation.enterpriseEmail),
        ),
      sinon.match(false as Boolean),
    );

    sinon.assert.calledWithExactly(
      keycloakService.stubs.createUserKc,
      sinon.match(expectedStudentToBeCalledWith),
      sinon.match([GROUPS.citizens]),
      sinon.match([RequiredActionAlias.VERIFY_EMAIL]),
    );

    sinon.assert.notCalled(funderRepository.stubs.getEnterpriseById);

    affiliationRepository.stubs.createAffiliation.restore();
    keycloakService.stubs.createUserKc.restore();
    keycloakService.stubs.sendExecuteActionsEmailUserKc.restore();
  });

  it('Account Deletion Service : ERROR', async () => {
    try {
      userAttributeRepository.stubs.find.rejects('Error');
      await citizenService.accountDeletionService();
    } catch (err) {
      expect(err.message).to.equal('Error');
      expect(err.statusCode).to.equal(StatusCode.InternalServerError);
    }
  });

  it('Account Deletion Service Citizen: successful', async () => {
    const mockCitizenUserEntity = new UserEntity({
      id: 'randomInputId',
      userAttributes: [
        new UserAttribute({
          name: 'identity.firstName',
          value: JSON.stringify('firstName'),
        }),
        new UserAttribute({
          name: 'personalInformation.email',
          value: JSON.stringify('email'),
        }),
        new UserAttribute({
          name: 'lastLoginAt',
          value: '1110000',
        }),
      ],
      keycloakGroups: [
        new KeycloakGroup({
          name: GROUPS.citizens,
        }),
      ],
    });
    const affiliation: Affiliation = {
      id: 'affiliationId',
      citizenId: 'randomInputId',
      enterpriseEmail: '',
      enterpriseId: '',
      status: AFFILIATION_STATUS.UNKNOWN,
    } as Affiliation;

    userEntityRepository.stubs.find.resolves([mockCitizenUserEntity]);
    userEntityRepository.stubs.getUserWithAttributes.resolves(mockCitizenUserEntity);
    affiliationRepository.stubs.findOne.resolves(affiliation);
    affiliationRepository.stubs.deleteById.resolves();
    mailService.stubs.sendMailAsHtml.resolves();
    keycloakService.stubs.deleteUserKc.resolves();
    await citizenService.accountDeletionService();
    expect(keycloakService.stubs.deleteUserKc.calledOnce).true();
    expect(affiliationRepository.stubs.deleteById.calledOnce).true();
  });

  it('Account Deletion Service Funder: successful', async () => {
    const mockUserFunderEntity = new UserEntity({
      id: 'randomInputId',
      userAttributes: [
        new UserAttribute({
          name: 'firstName',
          value: 'firstName',
        }),
        new UserAttribute({
          name: 'email',
          value: 'email',
        }),
      ],
      keycloakGroups: [
        new KeycloakGroup({
          name: Roles.MANAGERS,
        }),
      ],
    });

    userEntityRepository.stubs.find.resolves([mockUserFunderEntity]);
    userRepository.stubs.findById.resolves(new User({email: 'email', firstName: 'firstName'}));
    mailService.stubs.sendMailAsHtml.resolves();
    keycloakService.stubs.deleteUserKc.resolves();
    await citizenService.accountDeletionService();
    expect(keycloakService.stubs.deleteUserKc.calledOnce).true();
    expect(userRepository.stubs.deleteById.calledOnce).true();
  });

  it('Notify Inactive Account : ERROR', async () => {
    try {
      userAttributeRepository.stubs.find.rejects('Error');
      await citizenService.notifyInactiveAccount();
    } catch (err) {
      expect(err.message).to.equal('Error');
      expect(err.statusCode).to.equal(StatusCode.InternalServerError);
    }
  });

  it('Notify Inactive Account : successful', async () => {
    const mockCitizenUserEntity = new UserEntity({
      id: 'randomInputId',
      userAttributes: [
        new UserAttribute({
          name: 'identity.firstName',
          value: JSON.stringify('firstName'),
        }),
        new UserAttribute({
          name: 'personalInformation.email',
          value: JSON.stringify('email'),
        }),
        new UserAttribute({
          name: 'lastLoginAt',
          value: '1110000',
        }),
      ],
    });
    userAttributeRepository.stubs.find
      .onCall(0)
      .resolves([new UserAttribute({userId: 'randomOtherInputId'})]);
    userAttributeRepository.stubs.find.onCall(1).resolves([new UserAttribute({userId: 'randomInputId'})]);
    userEntityRepository.stubs.getUserWithAttributes.resolves(mockCitizenUserEntity);
    mailService.stubs.sendMailAsHtml.resolves();
    keycloakService.stubs.updateUserKC.resolves();
    await citizenService.notifyInactiveAccount();
    expect(keycloakService.stubs.updateUserKC.calledOnce).true();
  });

  it('Delete Inactive Account : ERROR', async () => {
    try {
      userAttributeRepository.stubs.find.rejects('Error');
      await citizenService.deleteInactiveAccount();
    } catch (err) {
      expect(err.message).to.equal('Error');
      expect(err.statusCode).to.equal(StatusCode.InternalServerError);
    }
  });

  it('Delete Inactive Account without affiliation and subscription: successful', async () => {
    const mockCitizenUserEntity = new UserEntity({
      id: 'randomInputId',
      userAttributes: [
        new UserAttribute({
          name: 'identity.firstName',
          value: JSON.stringify('firstName'),
        }),
        new UserAttribute({
          name: 'personalInformation.email',
          value: JSON.stringify('email'),
        }),
        new UserAttribute({
          name: 'lastLoginAt',
          value: '1110000',
        }),
      ],
    });
    userAttributeRepository.stubs.find
      .onCall(0)
      .resolves([new UserAttribute({userId: 'randomOtherInputId'})]);
    userAttributeRepository.stubs.find.onCall(1).resolves([new UserAttribute({userId: 'randomInputId'})]);
    userEntityRepository.stubs.getUserWithAttributes.resolves(mockCitizenUserEntity);
    subscriptionRepository.stubs.find.resolves([]);
    affiliationRepository.stubs.findOne.resolves(undefined);
    mailService.stubs.sendMailAsHtml.resolves();
    keycloakService.stubs.deleteUserKc.resolves();
    await citizenService.deleteInactiveAccount();
    expect(subscriptionRepository.stubs.updateById.calledOnce).false();
    expect(keycloakService.stubs.deleteUserKc.calledOnce).true();
  });

  it('Delete Inactive Account with affiliation and subscription: successful', async () => {
    const mockCitizenUserEntity = new UserEntity({
      id: 'randomInputId',
      userAttributes: [
        new UserAttribute({
          name: 'identity.firstName',
          value: JSON.stringify('firstName'),
        }),
        new UserAttribute({
          name: 'personalInformation.email',
          value: JSON.stringify('email'),
        }),
        new UserAttribute({
          name: 'lastLoginAt',
          value: '1110000',
        }),
      ],
    });

    const affiliation: Affiliation = {
      id: 'affiliationId',
      citizenId: 'randomInputId',
      enterpriseEmail: '',
      enterpriseId: '',
      status: AFFILIATION_STATUS.UNKNOWN,
    } as Affiliation;

    userAttributeRepository.stubs.find.onCall(0).resolves([]);
    userAttributeRepository.stubs.find.onCall(1).resolves([new UserAttribute({userId: 'randomInputId'})]);
    userEntityRepository.stubs.getUserWithAttributes.resolves(mockCitizenUserEntity);
    subscriptionRepository.stubs.find.resolves([new Subscription({id: 'randomSubscriptionId'})]);
    subscriptionRepository.stubs.updateById.resolves();
    affiliationRepository.stubs.findOne.resolves(affiliation);
    affiliationRepository.stubs.deleteById.resolves();
    mailService.stubs.sendMailAsHtml.resolves();
    keycloakService.stubs.deleteUserKc.resolves();
    await citizenService.deleteInactiveAccount();
    expect(keycloakService.stubs.deleteUserKc.calledOnce).true();
    expect(affiliationRepository.stubs.deleteById.calledOnce).true();
    expect(subscriptionRepository.stubs.updateById.calledOnce).true();
  });

  it('getCitizenWithAffiliationById: successful', async () => {
    const mockCitizenUserEntity = new UserEntity({
      id: 'randomInputId',
      userAttributes: [
        new UserAttribute({
          name: 'lastName',
          value: 'lastName',
        }),
        new UserAttribute({
          name: 'firstName',
          value: 'firstName',
        }),
      ],
    });

    const affiliation: Affiliation = {
      id: 'affiliationId',
      citizenId: 'randomInputId',
      enterpriseEmail: '',
      enterpriseId: '',
      status: AFFILIATION_STATUS.UNKNOWN,
    } as Affiliation;

    const citizenWithAffiliationResult: Citizen = Object.assign(new Citizen(), {
      id: 'randomInputId',
      lastName: 'lastName',
      firstName: 'firstName',
      affiliation: affiliation,
    });

    userEntityRepository.stubs.getUserWithAttributes.resolves(mockCitizenUserEntity);
    affiliationRepository.stubs.findOne.resolves(affiliation);

    const result = await citizenService.getCitizenWithAffiliationById('randomInputId');
    expect(result).to.deepEqual(citizenWithAffiliationResult);
  });

  it('getCitizenByFilter : returns a citizen with user attributes and affiliation', async () => {
    const mockCitizenUserEntity = new UserEntity({
      id: 'randomInputId',
      userAttributes: [
        new UserAttribute({
          name: 'identity.lastName',
          value: JSON.stringify({
            value: 'lastName',
            source: 'moncomptemobilite.fr',
            certificationDate: '2023-01-19T15:53:25.888Z',
          }),
        }),
        new UserAttribute({
          name: 'identity.fistName',
          value: JSON.stringify({
            value: 'firstName',
            source: 'moncomptemobilite.fr',
            certificationDate: '2023-01-19T15:53:25.888Z',
          }),
        }),
      ],
    });

    const affiliation: Affiliation = {
      id: 'affiliationId',
      citizenId: 'randomInputId',
      enterpriseEmail: 'enterpriseEmail',
      enterpriseId: 'enterpriseId',
      status: AFFILIATION_STATUS.AFFILIATED,
    } as Affiliation;

    const expectedCitizen: Citizen = Object.assign(new Citizen(), {
      id: 'randomInputId',
      identity: {
        lastName: {
          value: 'lastName',
          source: 'moncomptemobilite.fr',
          certificationDate: '2023-01-19T15:53:25.888Z',
        },
        fistName: {
          value: 'firstName',
          source: 'moncomptemobilite.fr',
          certificationDate: '2023-01-19T15:53:25.888Z',
        },
      },
      affiliation,
    });

    const citizenFilter = {fields: {id: true, identity: true, personalInformation: true, affiliation: true}};

    userEntityRepository.stubs.getUserWithAttributes.resolves(mockCitizenUserEntity);
    affiliationRepository.stubs.findOne.resolves(affiliation);

    const result = await citizenService.getCitizenByFilter('randomInputId', citizenFilter);

    expect(result).to.eql(expectedCitizen);
    sinon.assert.calledWith(
      userEntityRepository.stubs.getUserWithAttributes,
      'randomInputId',
      GROUPS.citizens,
      {
        where: {
          or: [
            {
              name: {
                inq: [
                  'identity.lastName',
                  'identity.firstName',
                  'identity.middleNames',
                  'identity.gender',
                  'identity.birthDate',
                  'identity.birthPlace',
                  'identity.birthCountry',
                ],
              },
            },
          ],
        },
      },
    );
    sinon.assert.calledWith(affiliationRepository.stubs.findOne, {where: {citizenId: 'randomInputId'}});
  });

  it('getEnterpriseEmployees : returns list of employees OK', async () => {
    const stub = sinon.stub(CitizenService.prototype, 'findCitizenWithAffiliation').resolves([]);

    const queryParams: EmployeesQueryParams = {
      funderId: 'funderId',
      status: AFFILIATION_STATUS.AFFILIATED,
      lastName: 'lastName',
      skip: 0,
      limit: 10,
    };

    const response = await citizenService.getEnterpriseEmployees(queryParams);

    expect(response).to.eql([]);

    sinon.assert.calledWithExactly(
      stub,
      sinon.match({
        order: ['lastName ASC'],
        where: {lastName: {regexp: /.*lastName.*/i}},
        fields: {id: true},
        include: [{relation: 'userAttributes'}],
      }),
      sinon.match({
        where: {
          enterpriseId: 'funderId',
          status: AFFILIATION_STATUS.AFFILIATED,
        },
        limit: 10,
        skip: 0,
      }),
    );

    stub.restore();
  });

  it('getEnterpriseEmployees : returns list of employees without unknown affilations OK', async () => {
    const stub = sinon.stub(CitizenService.prototype, 'findCitizenWithAffiliation').resolves([]);

    const queryParams: EmployeesQueryParams = {
      funderId: 'funderId',
      lastName: 'lastName',
      skip: 0,
      limit: 10,
    };

    const response = await citizenService.getEnterpriseEmployees(queryParams);

    expect(response).to.eql([]);

    sinon.assert.calledWithExactly(
      stub,
      sinon.match({
        order: ['lastName ASC'],
        where: {lastName: {regexp: /.*lastName.*/i}},
        fields: {id: true},
        include: [{relation: 'userAttributes'}],
      }),
      sinon.match({
        where: {
          enterpriseId: 'funderId',
          status: {neq: AFFILIATION_STATUS.UNKNOWN},
        },
        limit: 10,
        skip: 0,
      }),
    );

    stub.restore();
  });

  it('getEnterpriseEmployeesCount : returns count when lastName is provided OK', async () => {
    const stub = sinon.stub(CitizenService.prototype, 'findCitizenWithAffiliation').resolves([]);

    const queryParams: EmployeesQueryParams = {
      funderId: 'funderId',
      status: AFFILIATION_STATUS.AFFILIATED,
      lastName: 'lastName',
    };

    const response = await citizenService.getEnterpriseEmployeesCount(queryParams);

    expect(response).to.eql({count: 0});

    sinon.assert.calledWithExactly(
      stub,
      sinon.match({
        where: {lastName: {regexp: /.*lastName.*/i}},
        fields: {id: true},
        include: [{relation: 'userAttributes'}],
      }),
      sinon.match({
        where: {
          enterpriseId: 'funderId',
          status: AFFILIATION_STATUS.AFFILIATED,
        },
      }),
    );

    stub.restore();
  });

  it('getEnterpriseEmployeesCount : returns count when lastName is not provided OK', async () => {
    const queryParams: EmployeesQueryParams = {
      funderId: 'funderId',
      status: AFFILIATION_STATUS.AFFILIATED,
    };
    affiliationRepository.stubs.count.resolves({count: 3});

    const result = await citizenService.getEnterpriseEmployeesCount(queryParams);

    expect(result).to.eql({count: 3});
    sinon.assert.calledWithExactly(affiliationRepository.stubs.count, {
      enterpriseId: 'funderId',
      status: AFFILIATION_STATUS.AFFILIATED,
    });
  });

  it('getEnterpriseEmployeesCount : returns count exluding unknown affiliation when status\
   is not provided OK', async () => {
    const queryParams: EmployeesQueryParams = {
      funderId: 'funderId',
    };
    affiliationRepository.stubs.count.resolves({count: 3});

    const result = await citizenService.getEnterpriseEmployeesCount(queryParams);

    expect(result).to.eql({count: 3});
    sinon.assert.calledWithExactly(affiliationRepository.stubs.count, {
      enterpriseId: 'funderId',
      status: {neq: AFFILIATION_STATUS.UNKNOWN},
    });
  });
});

const mockCitizen3 = {
  id: 'randomInputId',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  city: 'test',
  status: CITIZEN_STATUS.EMPLOYEE,
  birthdate: '1991-11-17',
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: 'funderId',
    enterpriseEmail: 'test@outlook.com',
    status: AFFILIATION_STATUS.AFFILIATED,
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
    header: ['Date de la demande', "Nom de l'aide", 'Financeur', 'Statut', 'Nom des justificatifs transmis'],
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
  toCitizen: () => new Citizen(),
  keycloakGroups: [],
  userAttributes: [],
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
  territoryIds: ['randomTerritoryId'],
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
  lastName: 'lastName',
  firstName: 'firstName',
  personalInformation: {
    email: {
      value: 'email@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    },
  },
  city: 'test',
  status: CITIZEN_STATUS.EMPLOYEE,
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: {
    enterpriseId: 'enterpriseId',
    enterpriseEmail: 'enterpriseEmail@gmail.com',
  },
});

const expectedSalarieToBeCalledWith = cloneDeep(salarie);

const enterprise: Enterprise = new Enterprise({
  name: 'enterprise',
  enterpriseDetails: new EnterpriseDetails({
    emailDomainNames: ['@gmail.com', 'rr'],
    hasManualAffiliation: false,
  }),
});

const salarieNoEnterprise = Object.assign(new Citizen(), {
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
  lastName: 'lastName',
  firstName: 'firstName',
  personalInformation: {
    email: {
      value: 'email@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    },
  },
  city: 'test',
  status: CITIZEN_STATUS.EMPLOYEE,
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: {
    enterpriseId: '',
    enterpriseEmail: '',
  },
});
const expectedSalarieNoEnterpriseToBeCalledWith = cloneDeep(salarieNoEnterprise);

const student = Object.assign(new Citizen(), {
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
  status: CITIZEN_STATUS.STUDENT,
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: {
    enterpriseId: '',
    enterpriseEmail: '',
  },
});

const expectedStudentToBeCalledWith = cloneDeep(student);

const salarieNoProEmail = Object.assign(new Citizen(), {
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
  lastName: 'lastName',
  firstName: 'firstName',
  personalInformation: {
    email: {
      value: 'email@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    },
  },
  city: 'test',
  status: CITIZEN_STATUS.EMPLOYEE,
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: {
    enterpriseId: 'randomInputIdEntreprise',
    enterpriseEmail: '',
  },
});

const expectedSalarieNoProEmailToBeCalledWith = cloneDeep(salarieNoProEmail);

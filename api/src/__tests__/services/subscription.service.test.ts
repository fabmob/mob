import {expect, sinon, StubbedInstanceWithSinonAccessor, createStubInstance} from '@loopback/testlab';
import {securityId, UserProfile} from '@loopback/security';
import {Express} from 'express';
import axios from 'axios';

import {SubscriptionService, MailService, S3Service, KeycloakService, CitizenService} from '../../services';
import {
  AffiliationRepository,
  CommunityRepository,
  FunderRepository,
  IncentiveRepository,
  SubscriptionRepository,
  SubscriptionTimestampRepository,
  UserEntityRepository,
  UserRepository,
} from '../../repositories';
import {
  Subscription,
  AttachmentType,
  Community,
  Citizen,
  Affiliation,
  Incentive,
  UserEntity,
  UserAttribute,
  Enterprise,
  EnterpriseDetails,
  User,
} from '../../models';
import {
  AFFILIATION_STATUS,
  INCENTIVE_TYPE,
  ISubscriptionBusError,
  OperatorData,
  REJECTION_REASON,
  SEND_MODE,
  SOURCES,
  StatusCode,
  SUBSCRIPTION_STATUS,
} from '../../utils';
import {Readable} from 'stream';
import {
  ValidationMultiplePayment,
  ValidationNoPayment,
  ValidationSinglePayment,
} from '../../models/subscription/subscriptionValidation.model';
import {NoReason} from '../../models/subscription/subscriptionRejection.model';
import {Identity} from '../../models/citizen/identity.model';

describe('Subscriptions service', () => {
  let subscriptionService: any = null;
  let subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    subscriptionTimestampRepository: StubbedInstanceWithSinonAccessor<SubscriptionTimestampRepository>,
    s3Service: StubbedInstanceWithSinonAccessor<S3Service>,
    funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>,
    affiliationRepository: StubbedInstanceWithSinonAccessor<AffiliationRepository>,
    communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>,
    keycloakService: StubbedInstanceWithSinonAccessor<KeycloakService>,
    citizenService: StubbedInstanceWithSinonAccessor<CitizenService>,
    userEntityRepository: StubbedInstanceWithSinonAccessor<UserEntityRepository>,
    incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    userRepository: StubbedInstanceWithSinonAccessor<UserRepository>;

  let mailService: any = null;

  beforeEach(() => {
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    funderRepository = createStubInstance(FunderRepository);
    subscriptionTimestampRepository = createStubInstance(SubscriptionTimestampRepository);
    communityRepository = createStubInstance(CommunityRepository);
    affiliationRepository = createStubInstance(AffiliationRepository);
    citizenService = createStubInstance(CitizenService);
    incentiveRepository = createStubInstance(IncentiveRepository);
    s3Service = createStubInstance(S3Service);
    userEntityRepository = createStubInstance(UserEntityRepository);
    keycloakService = createStubInstance(KeycloakService);
    userRepository = createStubInstance(UserRepository);
    mailService = createStubInstance(MailService);

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

    subscriptionService = new SubscriptionService(
      s3Service,
      subscriptionRepository,
      subscriptionTimestampRepository,
      communityRepository,
      funderRepository,
      affiliationRepository,
      userEntityRepository,
      userRepository,
      mailService,
      citizenService,
      keycloakService,
      incentiveRepository,
      currentUser,
    );
  });

  it('check versement : aucun versement', () => {
    const payment = {
      mode: 'aucun',
    } as ValidationNoPayment;

    try {
      subscriptionService.checkPayment(payment);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check versement : versement unique ok', () => {
    const payment = {
      mode: 'unique',
    } as ValidationSinglePayment;

    // Absence du montant
    try {
      const result = subscriptionService.checkPayment(payment);
      expect(result).deepEqual(payment);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check versement : versement unique avec des informations du versement multiple', () => {
    // Presence de la frequency
    const payment = {
      mode: 'unique',
      frequency: undefined,
    };

    try {
      subscriptionService.checkPayment(payment);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.equal('is not allowed to have the additional property "frequency"');
    }

    // Presence de la date
    const paymentSecond = {
      mode: 'unique',
      lastPayment: '2021-01-01',
    };

    try {
      subscriptionService.checkPayment(paymentSecond);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.equal('is not allowed to have the additional property "lastPayment"');
    }
  });

  it('check versement : versement multiple ok', () => {
    try {
      const payment = {
        mode: 'multiple',
        lastPayment: '2025-01-01',
        frequency: 'mensuelle',
        amount: 1,
      } as ValidationMultiplePayment;
      const result = subscriptionService.checkPayment(payment);
      expect(result).deepEqual(payment);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check versement : versement multiple - absence information', () => {
    const payment = {
      mode: 'multiple',
    } as ValidationMultiplePayment;

    try {
      subscriptionService.checkPayment(payment);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.equal('requires property "frequency"');
    }

    payment.lastPayment = '2025-01-01';
    try {
      subscriptionService.checkPayment(payment);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.equal('requires property "frequency"');
    }

    payment.frequency = 'mensuelle';
    payment.amount = 1;

    try {
      const result = subscriptionService.checkPayment(payment);
      expect(result).deepEqual(payment);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check versement : versement multiple avec des informations du versement unique', () => {
    try {
      const payment = {
        mode: 'multiple',
        lastPayment: '2021-01-01',
        frequency: 'mensuelle',
        amount: 3,
      } as ValidationMultiplePayment;
      subscriptionService.checkPayment(payment);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.equal(
        'The date of the last payment must be greater than two months from the validation date',
      );
    }
  });

  it('check versement : versement multiple avec une date de dernier versement au mauvais format', () => {
    try {
      const payment = {
        mode: 'multiple',
        lastPayment: '0101/2021',
        frequency: 'mensuelle',
        amount: 1,
      } as ValidationMultiplePayment;
      subscriptionService.checkPayment(payment);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.equal('does not conform to the "date" format');
    }
  });

  it('check versement : versement multiple avec une date de dernier versement incorrecte', () => {
    try {
      const payment = {
        mode: 'multiple',
        lastPayment: '2021-01-01',
        frequency: 'mensuelle',
        amount: 3,
      } as ValidationMultiplePayment;
      subscriptionService.checkPayment(payment);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.equal(
        'The date of the last payment must be greater than two months from the validation date',
      );
    }
  });

  it('check motif : ConditionsNonRespectees motif: success', () => {
    const reason = {
      type: 'ConditionsNonRespectees',
    } as NoReason;

    try {
      const result = subscriptionService.checkRefusMotif(reason);
      expect(result).deepEqual(reason);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check motif : Autre motif without autre text : error', () => {
    const reason = {
      type: 'Autre',
    };

    try {
      subscriptionService.checkRefusMotif(reason);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.equal('requires property "other"');
    }
  });

  it('check Buffer genereation: generation excel : success', async () => {
    const input: Subscription[] = [];
    input.push(firstSubscription);
    try {
      const result = await subscriptionService.generateExcelValidatedIncentives(input);
      expect(result).to.be.instanceof(Buffer);
    } catch (error) {
      sinon.assert.fail();
    }
  });

  it('check Buffer generation: generation excel with specificFields : success', async () => {
    const input = [];
    input.push(secondDemande);
    const result = await subscriptionService.generateExcelValidatedIncentives(input);
    expect(result).to.be.instanceof(Buffer);
  });

  it('getCitizensWithSubscription: successful', async () => {
    // Mock
    const mockCitizensQueryParams = {
      funderId: 'funderId',
      lastName: 'lastName',
      skip: 10,
      limit: 10,
    };

    // Arrange
    const expected = [
      {id: 'citizenId', count: 1, firstName: 'fistName', lastName: 'lastName', isCitizenDeleted: false},
    ];

    // Setup stubs
    userRepository.stubs.findOne.resolves(new User({communityIds: ['communityId']}));
    subscriptionRepository.stubs.execute.resolves({get: () => expected});

    // Act
    const result = await subscriptionService.getCitizensWithSubscription(mockCitizensQueryParams);

    // Assert
    expect(result).to.eql(expected);
  });

  const sendMode = [SEND_MODE.VALIDATION, SEND_MODE.REJECTION];
  sendMode.forEach(mode => {
    it('sendValidationOrRejectionMail: successfull', () => {
      subscriptionService.sendValidationOrRejectionMail(
        mode,
        mailService,
        'Aide 1',
        '23/05/2022',
        'email@email.com',
        'username',
        'subscriptionRejectionMessage',
        'comments',
      );
      mailService.stubs.sendMailAsHtml.resolves('success');
      expect(mailService.sendMailAsHtml.calledOnce).true();
      expect(
        mailService.sendMailAsHtml.calledWith(
          'email@email.com',
          `Votre demande d’aide a été ${mode}`,
          mode === SEND_MODE.VALIDATION ? 'subscription-validation' : 'subscription-rejection',
        ),
      ).true();
    });
  });

  it('handleMessage citizenId not matching: Error', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(citizenSubscription);
      await subscriptionService.handleMessage(objError);
    } catch (error) {
      expect(error.message).to.equal('CitizenID does not match');
    }
  });

  it('check formatAttachments: success', async () => {
    const result = await subscriptionService.formatAttachments(attachmentFiles);
    const formattedAttachemnts = attachmentFiles;
    formattedAttachemnts[1].originalname = 'file(1).pdf';
    formattedAttachemnts[2].originalname = 'file(2).pdf';
    expect(result).deepEqual(formattedAttachemnts);
  });

  it('check formatAttachments no file: fail', async () => {
    const result = await subscriptionService.formatAttachments([]);
    expect(result).to.Null;
  });

  it('check formatAttachments no extension: fail', async () => {
    const result = await subscriptionService.formatAttachments(attachmentWithoutExtension);
    expect(result).to.Null;
  });

  it('handleMessage REJECTED payload : success', async () => {
    subscriptionRepository.stubs.findById.resolves(RejectSubscription);
    s3Service.stubs.deleteObjectFile.resolves('any');
    incentiveRepository.stubs.findById.resolves(mockIncentive);
    const result = await subscriptionService.handleMessage(objReject1);
    expect(result).to.Null;
  });

  it('handleMessage VALIDATED payload : success', async () => {
    subscriptionRepository.stubs.findById.resolves(validateSubscription);
    incentiveRepository.stubs.findById.resolves(mockIncentiveNoNotification);
    const result = await subscriptionService.handleMessage(objValidated);
    expect(result).to.Null;
  });

  it('handleMessage VALIDATED status fail : Error', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(errorSubscription);
      await subscriptionService.handleMessage(objValidated);
    } catch (error) {
      expect(error.message).to.equal('subscriptions.error.bad.status');
      expect(error.statusCode).to.equal(StatusCode.Conflict);
    }
  });

  it('getSubscriptionPayload test : Success', async () => {
    subscriptionRepository.stubs.findById.resolves(RejectSubscription);
    funderRepository.stubs.getEnterpriseById.resolves(enterprise);
    communityRepository.stubs.findById.resolves(community);
    affiliationRepository.stubs.findOne.resolves({
      id: 'affId',
      citizenId: 'citizenId',
      enterpriseId: 'incentiveId',
      enterpriseEmail: 'test@gmail.com',
      status: AFFILIATION_STATUS.AFFILIATED,
    } as Affiliation);

    const result = await subscriptionService.getSubscriptionPayload('randomInputId', {
      message: 'string',
      property: 'string',
      code: 'string',
    } as ISubscriptionBusError);
    expect(result).deepEqual(subscriptionCompare);
  });

  it('rejectSubscription test : Success', async () => {
    const objValidated = {
      status: SUBSCRIPTION_STATUS.REJECTED,
      type: REJECTION_REASON.CONDITION,
      comment: 'test',
    };
    s3Service.stubs.deleteObjectFile.resolves('any');
    incentiveRepository.stubs.findById.resolves(mockIncentiveNoNotification);
    const result = await subscriptionService.rejectSubscription(objValidated, RejectWithAttachments);
    expect(result).to.Null;
  });

  it('rejectSubscription test : fail', async () => {
    try {
      const objValidated = {
        status: SUBSCRIPTION_STATUS.TO_PROCESS,
        type: 'Error',
        comment: 'test',
      };
      s3Service.stubs.deleteObjectFile.resolves('any');
      citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);
      await subscriptionService.rejectSubscription(objValidated, RejectSubscription);
    } catch (error) {
      expect(error.message).to.deepEqual('subscriptionRejection.type.not.found');
    }
  });

  it('validateSubscription test : success', async () => {
    const objValidated = {
      status: SUBSCRIPTION_STATUS.VALIDATED,
      mode: 'aucun',
    };
    citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);
    subscriptionRepository.stubs.updateById.resolves();
    incentiveRepository.stubs.findById.resolves(mockIncentive);
    await subscriptionService.validateSubscription(objValidated, validateSubscriptionTest);
  });

  it('handleMessage Error status payload : success', async () => {
    subscriptionRepository.stubs.findById.resolves(validateSubscription);
    incentiveRepository.stubs.findById.resolves(mockIncentive);

    const result = await subscriptionService.handleMessage(objValidatedError);
    expect(result).to.Null;
  });

  it('preparePayLoad  payload : success', async () => {
    communityRepository.stubs.findById.resolves(community);
    affiliationRepository.stubs.findOne.resolves({
      id: 'affId',
      citizenId: 'citizenId',
      enterpriseId: 'incentiveId',
      enterpriseEmail: 'test@gmail.com',
      status: AFFILIATION_STATUS.AFFILIATED,
    } as Affiliation);
    incentiveRepository.stubs.findById.resolves(mockIncentive);

    const result = await subscriptionService.preparePayLoad(RejectWithAttachment, {
      message: 'string',
      property: 'string',
      code: 'string',
    } as ISubscriptionBusError);
    expect(result).to.Null;
  });

  it('preparePayLoad no attachments payload : success', async () => {
    communityRepository.stubs.findById.resolves(community2);
    affiliationRepository.stubs.findOne.resolves({
      id: 'affId',
      citizenId: 'citizenId',
      enterpriseId: 'incentiveId',
      enterpriseEmail: 'test@gmail.com',
      status: AFFILIATION_STATUS.AFFILIATED,
    } as Affiliation);

    await subscriptionService.preparePayLoad(RejectSubscriptionNoAttachment, {
      message: 'string',
      property: 'string',
      code: 'string',
    } as ISubscriptionBusError);
  });

  it('checkRefusMotif error payload : fail', async () => {
    try {
      await subscriptionService.checkRefusMotif({
        comment: 'test',
      });
    } catch (error) {
      expect(error.message).to.deepEqual('requires property "type"');
    }
  });

  it('checkPayment error payload : fail', async () => {
    try {
      await subscriptionService.checkPayment({
        comment: 'test',
      });
    } catch (error) {
      expect(error.message).to.deepEqual('requires property "mode"');
    }
  });

  it('checkRPCAPI success ', async () => {
    const applicationInfo = {
      datetime: 0,
      uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      journey_id: 0,
      status: 'string',
      token: 'signature(sha512(13002526500013/short/051227308989/2022-11-22T08:54:19Z))',
    };

    const axiosPost = sinon.stub(axios, 'post').resolves({
      status: StatusCode.Created,
      data: applicationInfo,
    });

    const result = await subscriptionService.callCEEApi(apiUrl, requestBodyExample, 'token');
    expect(result).to.deepEqual({
      code: StatusCode.Created,
      status: 'success',
      data: applicationInfo,
    });
    axiosPost.restore();
  });

  it('checkRPCAPI error Conflict 409', async () => {
    const applicationInfo = {
      datetime: 0,
      uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    };

    const axiosPost = sinon.stub(axios, 'post').throws({
      response: {
        status: StatusCode.Conflict,
        data: applicationInfo,
      },
    });

    const result = await subscriptionService.callCEEApi(apiUrl, requestBodyExample, 'token');
    expect(result).to.deepEqual({
      code: StatusCode.Conflict,
      status: 'error',
      data: applicationInfo,
      message: 'La demande est déjà enregistrée',
    });
    axiosPost.restore();
  });

  it('checkRPCAPI error Not found 404', async () => {
    const axiosPost = sinon.stub(axios, 'post').throws({
      response: {
        status: StatusCode.NotFound,
        data: {message: 'Not found'},
      },
    });

    const result = await subscriptionService.callCEEApi(apiUrl, requestBodyExample, 'token');
    expect(result).to.deepEqual({
      code: StatusCode.NotFound,
      status: 'error',
      message: 'Not found',
    });
    axiosPost.restore();
  });

  it('checkRPCAPI default Error ', async () => {
    const axiosPost = sinon.stub(axios, 'post').throws({
      response: {status: StatusCode.InternalServerError, data: 'Authorization'},
    });

    const result = await subscriptionService.callCEEApi(apiUrl, requestBodyExample, 'token');
    expect(result).to.deepEqual({
      message: 'Authorization',
      code: StatusCode.InternalServerError,
      status: 'error',
    });
    axiosPost.restore();
  });

  it('checkRPCAPI Error no response ', async () => {
    const axiosPost = sinon.stub(axios, 'post').throws({
      message: 'no response returned',
    });

    const result = await subscriptionService.callCEEApi(apiUrl, requestBodyExample, 'token');
    expect(result).to.deepEqual({
      message: 'no response returned',
      status: 'error',
    });
    axiosPost.restore();
  });

  it('createSubscriptionTimestamp success ', async () => {
    const result = await subscriptionService.createSubscriptionTimestamp(
      citizenSubscription,
      'POST v1/maas/subscriptions',
      'platform',
    );
    expect(result).to.Null;
  });

  it('checkFranceConnectIdentity :  should return true ', async () => {
    userEntityRepository.stubs.getUserWithAttributes.resolves(mockFranceConnectUser);

    const mockToCitizen = sinon.stub().returns(mockFranceConnectCitizen);
    const sandbox = sinon.createSandbox();
    sandbox.stub(UserEntity.prototype, 'toCitizen').callsFake(mockToCitizen);

    const result = await subscriptionService.checkFranceConnectIdentity('randomInputId');

    expect(result).to.eql(true);
    sandbox.restore();
  });

  it('checkFranceConnectIdentity :  should return false ', async () => {
    userEntityRepository.stubs.getUserWithAttributes.resolves(mockNoneFranceConnectUser);

    const mockToCitizen = sinon.stub().returns(mockNoneFranceConnectCitizen);
    const sandbox = sinon.createSandbox();
    sandbox.stub(UserEntity.prototype, 'toCitizen').callsFake(mockToCitizen);

    const result = await subscriptionService.checkFranceConnectIdentity('randomInputId');

    expect(result).to.eql(false);
    sandbox.restore();
  });

  it('checkCEEValidity: No Token stocked in group ', async () => {
    keycloakService.stubs.getAttributesFromGroup.resolves({});

    try {
      await subscriptionService.checkCEEValidity(mockIncentive, mockSubscription);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.equal('group.token.notFound');
    }
  });

  it('checkCEEValidity: return success status', async () => {
    keycloakService.stubs.getAttributesFromGroup.resolves({RPC_CEE_TOKEN: 'token'});
    const stub = sinon.stub(SubscriptionService.prototype, 'callCEEApi').resolves({
      status: 'success',
      code: 201,
      data: {
        uuid: 'id',
        datetime: '2022-12-05T00:00:00.000Z',
        token: 'token',
      },
    });

    const result = await subscriptionService.checkCEEValidity(mockIncentive, mockSubscription);
    expect(result).to.eql({
      status: 'success',
      code: 201,
      data: {
        uuid: 'id',
        datetime: '2022-12-05T00:00:00.000Z',
        token: 'token',
      },
    });

    stub.restore();
  });

  const mockFranceConnectCitizen = new Citizen({
    id: 'randomInputId',
    identity: {
      lastName: {
        value: 'lastName',
        source: SOURCES.FRANCE_CONNECT,
        certificationDate: new Date('2022-10-18T17:13:37.432Z'),
      },
      firstName: {
        value: 'firstName',
        source: SOURCES.FRANCE_CONNECT,
        certificationDate: new Date('2022-10-18T17:13:37.432Z'),
      },
      birthDate: {
        value: '1970-01-01',
        source: SOURCES.FRANCE_CONNECT,
        certificationDate: new Date('2022-10-18T17:13:37.432Z'),
      },
    } as Identity,
  });

  const mockNoneFranceConnectCitizen = new Citizen({
    id: 'randomInputId',
    identity: {
      lastName: {
        value: 'lastName',
        source: SOURCES.MOB,
        certificationDate: new Date('2022-10-18T17:13:37.432Z'),
      },
      firstName: {
        value: 'firstName',
        source: SOURCES.MOB,
        certificationDate: new Date('2022-10-18T17:13:37.432Z'),
      },
      birthDate: {
        value: '1970-01-01',
        source: SOURCES.MOB,
        certificationDate: new Date('2022-10-18T17:13:37.432Z'),
      },
    } as Identity,
  });

  const mockFranceConnectUser = new UserEntity({
    id: 'randomInputId',
    userAttributes: [
      new UserAttribute({
        name: 'lastName',
        value: JSON.stringify({
          value: 'lastName',
          source: SOURCES.FRANCE_CONNECT,
          certificationDate: '2022-10-18T17:13:37.432Z',
        }),
      }),
      new UserAttribute({
        name: 'firstName',
        value: JSON.stringify({
          value: 'firstName',
          source: SOURCES.FRANCE_CONNECT,
          certificationDate: '2022-10-18T17:13:37.432Z',
        }),
      }),
      new UserAttribute({
        name: 'birthDate',
        value: JSON.stringify({
          value: '1970-01-01',
          source: SOURCES.FRANCE_CONNECT,
          certificationDate: '2022-10-18T17:13:37.432Z',
        }),
      }),
    ],
  });

  const mockNoneFranceConnectUser = new UserEntity({
    id: 'randomInputId',
    userAttributes: [
      new UserAttribute({
        name: 'lastName',
        value: JSON.stringify({
          value: 'lastName',
          source: SOURCES.FRANCE_CONNECT,
          certificationDate: '2022-10-18T17:13:37.432Z',
        }),
      }),
      new UserAttribute({
        name: 'firstName',
        value: JSON.stringify({
          value: 'firstName',
          source: SOURCES.MOB,
          certificationDate: '2022-10-18T17:13:37.432Z',
        }),
      }),
      new UserAttribute({
        name: 'birthDate',
        value: JSON.stringify({
          value: '1970-01-01',
          source: SOURCES.MOB,
          certificationDate: '2022-10-18T17:13:37.432Z',
        }),
      }),
    ],
  });

  const mockIncentive = new Incentive({
    territoryIds: ['test'],
    additionalInfos: 'test',
    funderName: 'nameTerritoire',
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
    id: '606c236a624cec2becdef276',
    conditions: 'Vivre à TOulouse',
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
    isMCMStaff: true,
    subscriptionLink: 'http://link.com',
    isCitizenNotificationsDisabled: true,
  });

  const mockIncentiveNoNotification = new Incentive({
    territoryIds: ['test'],
    additionalInfos: 'test',
    funderName: 'nameTerritoire',
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
    id: '606c236a624cec2becdef276',
    conditions: 'Vivre à TOulouse',
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
    isMCMStaff: false,
    subscriptionLink: 'http://link.com',
    isCitizenNotificationsDisabled: false,
  });

  const subscriptionCompare = {
    subscription: {
      lastName: 'lastName',
      firstName: 'firstName',
      birthdate: undefined,
      citizenId: 'email@gmail.com',
      incentiveId: 'incentiveId',
      subscriptionId: 'randomInputId',
      email: 'test@gmail.com',
      status: 'A_TRAITER',
      communityName: '',
      specificFields: '',
      attachments: [],
      error: {message: 'string', property: 'string', code: 'string'},
      encryptedAESKey: undefined,
      encryptedIV: undefined,
      encryptionKeyId: undefined,
      encryptionKeyVersion: undefined,
    },
    enterprise: 'enterprise',
  };

  const enterprise = new Enterprise({
    id: 'incentiveId',
    name: 'enterprise',
    enterpriseDetails: new EnterpriseDetails({
      emailDomainNames: ['@gmail.com'],
    }),
  });
  const community2 = new Community({
    id: 'incentiveId',
    funderId: 'incentiveId',
  });
  const community = {
    id: 'incentiveId',
    name: 'enterprise',
    funderId: 'incentiveId',
  } as Community;
  const citizen = Object.assign(new Citizen(), {
    id: 'email@gmail.com',
    affiliation: {
      citizenId: 'email@gmail.com',
      enterpriseId: 'incentiveId',
      enterpriseEmail: 'test@gmail.com',
      status: AFFILIATION_STATUS.AFFILIATED,
    },
  });
  const objReject1 = {
    citizenId: 'email@gmail.com',
    subscriptionId: 'randomInputId',
    status: SUBSCRIPTION_STATUS.REJECTED,
    type: 'ConditionsNonRespectees',
  };

  const objValidated = {
    citizenId: 'email@gmail.com',
    subscriptionId: 'randomInputId',
    status: SUBSCRIPTION_STATUS.VALIDATED,
    mode: 'unique',
    amount: 1,
  };
  const objValidatedError = {
    citizenId: 'email@gmail.com',
    subscriptionId: 'randomInputId',
    status: 'ERREUR',
    mode: 'unique',
    amount: 1,
  };
  const objError = {
    citizenId: 'random',
    subscriptionId: 'randomInputId',
    status: SUBSCRIPTION_STATUS.VALIDATED,
    mode: 'aucun',
  };
  const firstSubscription = new Subscription({
    id: 'randomInputId',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    incentiveTitle: 'incentiveTitle',
    citizenId: 'email@gmail.com',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    consent: true,
    status: SUBSCRIPTION_STATUS.VALIDATED,
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  });

  const citizenSubscription = new Subscription({
    id: 'randomInputId',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    incentiveTitle: 'incentiveTitle',
    citizenId: 'email@gmail.com',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    consent: true,
    status: SUBSCRIPTION_STATUS.TO_PROCESS,
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  });
  const RejectSubscription = new Subscription({
    id: 'randomInputId',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    incentiveTitle: 'incentiveTitle',
    citizenId: 'email@gmail.com',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    consent: true,
    status: SUBSCRIPTION_STATUS.TO_PROCESS,
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  });
  const RejectWithAttachment = new Subscription({
    id: 'randomInputId',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    incentiveTitle: 'incentiveTitle',
    citizenId: 'email@gmail.com',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    consent: true,
    communityId: 'incentiveId',
    attachments: [
      {
        originalName: 'uploadedAttachment.pdf',
        uploadDate: new Date('2022-01-01 00:00:00.000Z'),
        proofType: 'Passport',
        mimeType: 'application/pdf',
      } as AttachmentType,
    ],
    status: SUBSCRIPTION_STATUS.TO_PROCESS,
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
    specificFields: [
      {
        title: 'newField1',
        inputFormat: 'listeChoix',
        choiceList: {
          possibleChoicesNumber: 2,
          inputChoiceList: [
            {
              inputChoice: 'newField1',
            },
            {
              inputChoice: 'newField11',
            },
          ],
        },
      },
      {
        title: 'newField2',
        inputFormat: 'Texte',
      },
    ],
  });

  const RejectWithAttachments = new Subscription({
    id: 'randomInputId',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    incentiveTitle: 'incentiveTitle',
    citizenId: 'email@gmail.com',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    consent: true,
    communityId: 'incentiveId',
    attachments: [
      {
        originalName: 'uploadedAttachment.pdf',
        uploadDate: new Date('2022-01-01 00:00:00.000Z'),
        proofType: 'Passport',
        mimeType: 'application/pdf',
      } as AttachmentType,
    ],
    status: SUBSCRIPTION_STATUS.TO_PROCESS,
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
    specificFields: [
      {
        title: 'newField1',
        inputFormat: 'listeChoix',
        choiceList: {
          possibleChoicesNumber: 2,
          inputChoiceList: [
            {
              inputChoice: 'newField1',
            },
            {
              inputChoice: 'newField11',
            },
          ],
        },
      },
      {
        title: 'newField2',
        inputFormat: 'Texte',
      },
    ],
  });
  const RejectSubscriptionNoAttachment = new Subscription({
    id: 'randomInputId',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    incentiveTitle: 'incentiveTitle',
    citizenId: 'email@gmail.com',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    consent: true,
    status: SUBSCRIPTION_STATUS.TO_PROCESS,
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  });
  const validateSubscription = new Subscription({
    id: 'randomInputId',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    incentiveTitle: 'incentiveTitle',
    citizenId: 'email@gmail.com',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    consent: true,
    status: SUBSCRIPTION_STATUS.TO_PROCESS,
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  });

  const validateSubscriptionTest = new Subscription({
    id: 'randomInputId',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
    incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
    incentiveTitle: 'incentiveTitle',
    citizenId: 'email@gmail.com',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    consent: true,
    status: SUBSCRIPTION_STATUS.TO_PROCESS,
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  });

  const errorSubscription = new Subscription({
    id: 'randomInputId',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    incentiveTitle: 'incentiveTitle',
    citizenId: 'email@gmail.com',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    consent: true,
    status: SUBSCRIPTION_STATUS.VALIDATED,
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  });

  const secondDemande = new Subscription({
    id: 'randomInputId',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    incentiveTitle: 'incentiveTitle',
    citizenId: 'email@gmail.com',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    consent: true,
    specificFields: [
      {
        title: 'newField1',
        inputFormat: 'listeChoix',
        choiceList: {
          possibleChoicesNumber: 2,
          inputChoiceList: [
            {
              inputChoice: 'newField1',
            },
            {
              inputChoice: 'newField11',
            },
          ],
        },
      },
      {
        title: 'newField2',
        inputFormat: 'Texte',
      },
    ],
    status: SUBSCRIPTION_STATUS.VALIDATED,
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
    subscriptionValidation: {
      mode: 'multipe',
      amount: 11,
      frequency: 'test',
      lastPayment: '11-11-2022',
    } as ValidationMultiplePayment,
  });

  const attachmentFiles: Express.Multer.File[] = [
    {
      originalname: 'file.pdf',
      buffer: Buffer.from('test de buffer'),
      mimetype: 'application/pdf/png',
      fieldname: 'fieldname',
      size: 4000,
      encoding: '7bit',
      stream: new Readable(),
      destination: 'string',
      filename: 'fileName',
      path: 'test',
    },
    {
      originalname: 'file.pdf',
      buffer: Buffer.from('test de buffer'),
      mimetype: 'application/pdf/png',
      fieldname: 'fieldname',
      size: 4000,
      encoding: '7bit',
      stream: new Readable(),
      destination: 'string',
      filename: 'fileName',
      path: 'test',
    },
    {
      originalname: 'file.pdf',
      buffer: Buffer.from('test de buffer'),
      mimetype: 'application/pdf/png',
      fieldname: 'fieldname',
      size: 4000,
      encoding: '7bit',
      stream: new Readable(),
      destination: 'string',
      filename: 'fileName',
      path: 'test',
    },
  ];

  const attachmentWithoutExtension: Express.Multer.File[] = [
    {
      originalname: 'file',
      buffer: Buffer.from('test de buffer'),
      mimetype: 'application/pdf/png',
      fieldname: 'fieldname',
      size: 4000,
      encoding: '7bit',
      stream: new Readable(),
      destination: 'string',
      filename: 'fileName',
      path: 'test',
    },
    {
      originalname: 'file',
      buffer: Buffer.from('test de buffer'),
      mimetype: 'application/pdf/png',
      fieldname: 'fieldname',
      size: 4000,
      encoding: '7bit',
      stream: new Readable(),
      destination: 'string',
      filename: 'fileName',
      path: 'test',
    },
    {
      originalname: 'file',
      buffer: Buffer.from('test de buffer'),
      mimetype: 'application/pdf/png',
      fieldname: 'fieldname',
      size: 4000,
      encoding: '7bit',
      stream: new Readable(),
      destination: 'string',
      filename: 'fileName',
      path: 'test',
    },
  ];

  const apiUrl: string = 'https://api-example.com/v3/';

  const requestBodyExample: OperatorData = {
    journey_type: 'short',
    identity_key: 'f44ff5364363e53da750d8b7b44fa3176ea36228c5f951a9c1e606c915093d30',
    driving_license: '051227308989',
    last_name_trunc: 'TTT',
    operator_journey_id: 'operator_journey_id',
    application_timestamp: '2023-01-10T13:45:06.540Z',
  };

  const mockSubscription = new Subscription({
    id: 'subscriptionId',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
    incentiveType: 'AideNationale',
    incentiveTitle: 'Test titre',
    incentiveTransportList: ['voiture'],
    citizenId: 'randomId',
    lastName: 'lastname',
    firstName: 'firstname',
    email: 'email@email.com',
    city: 'Paris',
    postcode: '75000',
    consent: true,
    specificFields: {
      'Numéro de permis de conduire': '2334876523',
      'Type de trajet': ['Long'],
      'Numéro de téléphone': '0123456789',
      'Date de partage des frais': '05/12/2022',
    },
    isCitizenDeleted: false,
    enterpriseEmail: 'email.pro@mcm.com',
  });
});

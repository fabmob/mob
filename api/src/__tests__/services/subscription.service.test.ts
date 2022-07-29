import {
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
  createStubInstance,
} from '@loopback/testlab';
import {AnyObject} from '@loopback/repository';
import {Express} from 'express';

import {SubscriptionService, MailService, S3Service} from '../../services';
import {
  CitizenRepository,
  CommunityRepository,
  EnterpriseRepository,
  SubscriptionRepository,
} from '../../repositories';
import {
  Subscription,
  AttachmentType,
  Enterprise,
  Community,
  Citizen,
  Affiliation,
} from '../../models';
import {ValidationError} from '../../validationError';
import {
  INCENTIVE_TYPE,
  ISubscriptionBusError,
  REJECTION_REASON,
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

const expectedErrorPayment = new ValidationError(
  'requires property "amount"',
  '/subscriptionBadPayment',
  StatusCode.PreconditionFailed,
);

const expectedErrorBuffer = new ValidationError(
  'subscriptions.error.bad.buffer',
  '/subscriptionBadBuffer',
  StatusCode.PreconditionFailed,
);

describe('Subscriptions service', () => {
  let subscriptionService: any = null;
  let subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    citizenRepository: StubbedInstanceWithSinonAccessor<CitizenRepository>,
    s3Service: StubbedInstanceWithSinonAccessor<S3Service>,
    enterpriseRepository: StubbedInstanceWithSinonAccessor<EnterpriseRepository>,
    communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>;

  let mailService: any = null;

  beforeEach(() => {
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    enterpriseRepository = createStubInstance(EnterpriseRepository);
    citizenRepository = createStubInstance(CitizenRepository);
    communityRepository = createStubInstance(CommunityRepository);
    s3Service = createStubInstance(S3Service);
    subscriptionService = new SubscriptionService(
      s3Service,
      subscriptionRepository,
      citizenRepository,
      mailService,
      communityRepository,
      enterpriseRepository,
    );
    mailService = createStubInstance(MailService);
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

  it('check versement : versement unique - absence information', () => {
    const payment = {
      mode: 'unique',
    } as ValidationSinglePayment;

    // Absence du montant
    try {
      subscriptionService.checkPayment(payment);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.equal(expectedErrorPayment.message);
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
      expect(error.message).to.equal(expectedErrorPayment.message);
    }

    // Presence de la date
    const paymentSecond = {
      mode: 'unique',
      frequency: undefined,
      lastPayment: '2021-01-01',
    };

    try {
      subscriptionService.checkPayment(paymentSecond);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.equal(expectedErrorPayment.message);
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
    try {
      subscriptionService.checkPayment(payment);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.deepEqual(expectedErrorPayment.message);
    }

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

  it('check Buffer genereation: generation excel avec une liste vide : error', async () => {
    const input: Subscription[] = [];
    try {
      await subscriptionService.generateExcelValidatedIncentives(input);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.equal(expectedErrorBuffer.message);
    }
  });

  it('check Buffer generation: generation excel with specificFields : success', async () => {
    const input = [];
    input.push(secondDemande);
    const result = await subscriptionService.generateExcelValidatedIncentives(input);
    expect(result).to.be.instanceof(Buffer);
  });

  it('get citizens with subscriptions: success', () => {
    subscriptionRepository.stubs.execute.resolves(mockSubscriptions);
    const match = [
      {funderType: 'AideNationale'},
      {funderName: 'simulation-maas'},
      {status: {$ne: 'BROUILLON'}},
    ];
    const result = subscriptionService
      .getCitizensWithSubscription(match, 0)
      .then((res: any) => res)
      .catch((err: any) => err);
    expect(result).deepEqual(mockCitizens);
  });

  const sendMode = ['Validation', 'Rejet'];
  sendMode.forEach(mode => {
    it('sendValidationOrRejectionMail: successfull', () => {
      subscriptionService.sendValidationOrRejectionMail(
        mode,
        mailService,
        'Aide 1',
        '23/05/2022',
        'Capgemini',
        'entreprise',
        'email@email.com',
        'subscriptionRejectionMessage',
        'comments',
      );
      mailService.stubs.sendMailAsHtml.resolves('success');
      expect(mailService.sendMailAsHtml.calledOnce).true();
      expect(
        mailService.sendMailAsHtml.calledWith(
          'email@email.com',
          `${mode} de votre demande d'aide`,
          mode === 'Validation' ? 'subscription-validation' : 'subscription-rejection',
        ),
      ).true();
    });
  });

  it('handleMessage citizenId not matching: Error', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(citizenSubscription);
      await subscriptionService.handleMessage(objError);
    } catch (error) {
      expect(error.message).to.deepEqual('CitizenID does not match');
    }
  });

  it('check generateFormattedAttachments: success', async () => {
    const result = await subscriptionService.generateFormattedAttachments(
      attachmentFiles,
    );
    const formattedAttachemnts = attachmentFiles;
    formattedAttachemnts[1].originalname = 'file(1).pdf';
    formattedAttachemnts[2].originalname = 'file(2).pdf';
    expect(result).deepEqual(formattedAttachemnts);
  });
  it('check generateFormattedAttachments no file: fail', async () => {
    const result = await subscriptionService.generateFormattedAttachments([]);
    console.log('resultresultresultresult', result);
    expect(result).to.Null;
  });
  it('check generateFormattedAttachments no extension: fail', async () => {
    const result = await subscriptionService.generateFormattedAttachments(
      attachmentWithoutExtension,
    );
    expect(result).to.Null;
  });
  it('handleMessage REJECTED payload : success', async () => {
    subscriptionRepository.stubs.findById.resolves(RejectSubscription);
    s3Service.stubs.deleteObjectFile.resolves('any');

    const result = await subscriptionService.handleMessage(objReject1);
    expect(result).to.Null;
  });

  it('handleMessage VALIDATED payload : success', async () => {
    subscriptionRepository.stubs.findById.resolves(validateSubscription);
    const result = await subscriptionService.handleMessage(objValidated);
    expect(result).to.Null;
  });
  it('handleMessage VALIDATED status fail : Error', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(errorSubscription);
      await subscriptionService.handleMessage(objValidated);
    } catch (error) {
      expect(error.message).to.deepEqual('subscriptions.error.bad.status');
    }
  });
  it('sendPublishPayload test : Success', async () => {
    subscriptionRepository.stubs.findById.resolves(RejectSubscription);
    enterpriseRepository.stubs.findById.resolves(enterprise);
    communityRepository.stubs.findById.resolves(community);
    citizenRepository.stubs.findById.resolves(citizen);

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
    const result = await subscriptionService.rejectSubscription(
      objValidated,
      RejectWithAttachments,
    );
    expect(result).to.Null;
  });
  it('rejectSubscription without aide type : Success', async () => {
    const objValidated = {
      status: SUBSCRIPTION_STATUS.REJECTED,
      type: REJECTION_REASON.CONDITION,
      comment: 'test',
    };
    s3Service.stubs.deleteObjectFile.resolves('any');
    citizenRepository.stubs.findById.resolves(citizenNoAffilation);
    const result = await subscriptionService.rejectSubscription(
      objValidated,
      RejectWithoutIncentive,
    );
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
      citizenRepository.stubs.findById.resolves(citizen);
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
    citizenRepository.stubs.findById.resolves(citizen);
    subscriptionRepository.stubs.updateById.resolves();
    await subscriptionService.validateSubscription(
      objValidated,
      validateSubscriptionTest,
    );
  });
  it('validateSubscription test diffrent type : success', async () => {
    const objValidated = {
      status: SUBSCRIPTION_STATUS.TO_PROCESS,
      mode: 'aucun',
    };
    citizenRepository.stubs.findById.resolves(citizen);
    subscriptionRepository.stubs.updateById.resolves();
    await subscriptionService.validateSubscription(
      objValidated,
      validateSubscriptionOtherStatus,
    );
  });
  it('handleMessage Error status payload : success', async () => {
    subscriptionRepository.stubs.findById.resolves(validateSubscription);
    const result = await subscriptionService.handleMessage(objValidatedError);
    expect(result).to.Null;
  });
  it('preparePayLoad  payload : success', async () => {
    communityRepository.stubs.findById.resolves(community);
    citizenRepository.stubs.findById.resolves(citizen);
    const result = await subscriptionService.preparePayLoad(RejectWithAttachment, {
      message: 'string',
      property: 'string',
      code: 'string',
    } as ISubscriptionBusError);
    expect(result).to.Null;
  });
  it('preparePayLoad no attachments payload : success', async () => {
    communityRepository.stubs.findById.resolves(community2);
    citizenRepository.stubs.findById.resolves(citizenNoEnterpriseMail);
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
    },
    enterprise: 'enterprise',
  };

  const enterprise = new Enterprise({
    id: 'incentiveId',
    name: 'enterprise',
    emailFormat: ['@gmail.com'],
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
  const citizen = new Citizen({
    id: 'email@gmail.com',
    affiliation: {
      enterpriseId: 'incentiveId',
      enterpriseEmail: 'test@gmail.com',
      affiliationStatus: 'AFFILIE',
    } as Affiliation,
  });
  const citizenNoAffilation = new Citizen({
    id: 'email@gmail.com',
  });
  const citizenNoEnterpriseMail = new Citizen({
    id: 'email@gmail.com',
    affiliation: {
      enterpriseId: 'incentiveId',
      affiliationStatus: 'AFFILIE',
    } as Affiliation,
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
  const RejectWithoutIncentive = new Subscription({
    id: 'randomInputId',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
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
  const validateSubscriptionOtherStatus = new Subscription({
    id: 'randomInputId',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
    incentiveType: 'test',
    incentiveTitle: 'incentiveTitle',
    citizenId: 'email@gmail.com',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    consent: true,
    status: SUBSCRIPTION_STATUS.REJECTED,
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

  const mockSubscriptions: Record<string, unknown>[] = [
    {
      id: 'randomInputId',
      incentiveId: 'incentiveId',
      funderName: 'funderName',
      incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
      incentiveTitle: 'incentiveTitle',
      citizenId: '260a6356-3261-4335-bca8-4c1f8257613d',
      lastName: 'lastName',
      firstName: 'firstName',
      email: 'email@gmail.com',
      consent: true,
      status: SUBSCRIPTION_STATUS.VALIDATED,
      createdAt: new Date('2021-04-06T09:01:30.778Z'),
      updatedAt: new Date('2021-04-06T09:01:30.778Z'),
    },
    {
      id: 'randomInputId1',
      incentiveId: 'incentiveId',
      funderName: 'funderName',
      incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
      incentiveTitle: 'incentiveTitle',
      citizenId: '260a6356-3261-4335-bca8-4c1f8257613d',
      lastName: 'lastName',
      firstName: 'firstName',
      email: 'email@gmail.com',
      consent: true,
      status: SUBSCRIPTION_STATUS.VALIDATED,
      createdAt: new Date('2021-04-06T09:01:30.778Z'),
      updatedAt: new Date('2021-04-06T09:01:30.778Z'),
    },
  ];

  const mockCitizens: Promise<AnyObject> = new Promise(() => {
    return [
      {
        citizensData: [
          {
            citizenId: '260a6356-3261-4335-bca8-4c1f8257613d',
            lastName: 'leYellow',
            firstName: 'Bob',
          },
        ],
        totalCitizens: 1,
      },
    ];
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
});

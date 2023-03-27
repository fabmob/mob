import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import {securityId} from '@loopback/security';
const amqp = require('amqplib');
import {Readable} from 'stream';

import {
  CommunityRepository,
  IncentiveRepository,
  MetadataRepository,
  SubscriptionRepository,
  UserRepository,
  SubscriptionTimestampRepository,
  IncentiveEligibilityChecksRepository,
  FunderRepository,
} from '../../repositories';
import {SubscriptionController} from '../../controllers';
import {
  Subscription,
  Community,
  User,
  Metadata,
  AttachmentMetadata,
  Citizen,
  Incentive,
  IncentiveEligibilityChecks,
  EligibilityCheck,
  ValidationSinglePayment,
  CommonRejection,
  SubscriptionTimestamp,
  CreateSubscription,
  Funder,
  Enterprise,
  EnterpriseDetails,
  PrivateKeyAccess,
  EncryptionKey,
} from '../../models';
import {S3Service, SubscriptionService, MailService, CitizenService, RabbitmqService} from '../../services';
import {
  AFFILIATION_STATUS,
  ELIGIBILITY_CHECKS_LABEL,
  FUNDER_TYPE,
  INCENTIVE_TYPE,
  IUser,
  REJECTION_REASON,
  StatusCode,
  SUBSCRIPTION_CHECK_MODE,
  SUBSCRIPTION_STATUS,
} from '../../utils';
import * as invoiceUtils from '../../utils/invoice';

describe('SubscriptionController', () => {
  let s3Service: StubbedInstanceWithSinonAccessor<S3Service>,
    subscriptionService: StubbedInstanceWithSinonAccessor<SubscriptionService>,
    controller: SubscriptionController,
    communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>,
    subscriptionTimestampRepository: StubbedInstanceWithSinonAccessor<SubscriptionTimestampRepository>,
    userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    metadataRepository: StubbedInstanceWithSinonAccessor<MetadataRepository>,
    incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    mailService: StubbedInstanceWithSinonAccessor<MailService>,
    citizenService: StubbedInstanceWithSinonAccessor<CitizenService>,
    incentiveChecksRepository: StubbedInstanceWithSinonAccessor<IncentiveEligibilityChecksRepository>,
    funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>,
    rabbitmqService: StubbedInstanceWithSinonAccessor<RabbitmqService>,
    input: any;

  const response: any = {
    status: function () {
      return this;
    },
    contentType: function () {
      return this;
    },
    send: (body: any) => body,
  };

  const mockAttachmentWithoutFiles = {
    body: {
      data: JSON.stringify({
        metadataId: 'randomMetadataId',
      }),
    },
    files: [],
  };

  const inputSubscription = new CreateSubscription({
    incentiveId: 'incentiveId',
    consent: true,
  });

  const mockCitizen = new Citizen({
    id: 'citizenId',
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
        value: 'test@test.com',
        certificationDate: new Date('2022-11-03'),
        source: 'moncomptemobilite.fr',
      }),
    }),
    affiliation: Object.assign({
      enterpriseEmail: 'enterprise@email.com',
    }),
  });

  const newSubscription = new Subscription({
    id: '619e3ff38dd34e1774b60789',
    incentiveId: 'incentiveId',
    funderName: 'Rabat',
    funderId: 'funderId',
    incentiveTitle: "Bonus Ecologique pour l'achat d'un vélo électrique",
    status: SUBSCRIPTION_STATUS.VALIDATED,
    createdAt: new Date('2021-11-24T13:36:51.423Z'),
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  });

  const fileList: any[] = [
    {
      originalname: 'test1.txt',
      buffer: Buffer.from('test de buffer'),
      mimetype: 'image/png',
      fieldname: 'test',
      size: 4000,
      encoding: '7bit',
      stream: new Readable(),
      destination: 'string',
      filename: 'fileName',
      path: 'test',
    },
    {
      originalname: 'test2.txt',
      buffer: Buffer.from('test de buffer'),
      mimetype: 'image/png',
      fieldname: 'test',
      size: 4000,
      encoding: '7bit',
      stream: new Readable(),
      destination: 'string',
      filename: 'fileName',
      path: 'test',
    },
  ];

  const mockAttachment = {
    body: {
      data: JSON.stringify({
        metadataId: 'randomMetadataId',
      }),
    },
    files: fileList,
  };

  const mockAttachmentWithoutMetadata = {
    body: '',
    files: fileList,
  };

  const mockAttachmentWithoutMetadataWithoutFiles = {
    body: '',
    files: [],
  };

  const attachmentDataMock: Metadata = Object.assign(new Metadata(), {
    attachmentMetadata: {
      invoices: [
        {
          enterprise: {
            enterpriseName: 'IDF Mobilités',
            sirenNumber: '362521879',
            siretNumber: '36252187900034',
            apeCode: '4711D',
            enterpriseAddress: {
              zipCode: 75018,
              city: 'Paris',
              street: '6 rue Lepic',
            },
          },
          customer: {
            customerId: '123789',
            customerName: 'DELOIN',
            customerSurname: 'Alain',
          },
          transaction: {
            orderId: '30723',
            purchaseDate: new Date('2021-03-03T14:54:18+01:00'),
            amountInclTaxes: 7520,
            amountExclTaxes: 7520,
          },
          products: [
            {
              productName: 'Forfait Navigo Mois',
              quantity: 1,
              amountInclTaxes: 7520,
              amountExclTaxes: 7520,
              percentTaxes: 10,
              productDetails: {
                periodicity: 'Mensuel',
                zoneMin: 1,
                zoneMax: 5,
              },
            },
          ],
        },
      ],
    },
  });

  const invoiceMock = {
    originalname: 'invoice.pdf',
    buffer: Buffer.from('test de buffer'),
    mimetype: 'application/pdf/png',
    fieldname: 'test',
    size: 4000,
    encoding: '7bit',
    stream: new Readable(),
    destination: 'string',
    filename: 'fileName',
    path: 'test',
  };

  beforeEach(() => {
    givenStubbedRepository();
    givenStubbedService();
    controller = new SubscriptionController(
      subscriptionRepository,
      s3Service,
      subscriptionService,
      citizenService,
      communityRepository,
      metadataRepository,
      userRepository,
      incentiveRepository,
      incentiveChecksRepository,
      funderRepository,
      rabbitmqService,
      subscriptionTimestampRepository,
      currentUser,
      response,
      mailService,
    );
    input = {...initInput};
  });

  // unit tests for post subscriptions
  it('SubscriptionController create : successful', async () => {
    subscriptionRepository.stubs.create.resolves(inputRepo);
    incentiveRepository.stubs.findById.resolves(mockIncentive);
    citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);
    const result = await controller.createSubscription(input);

    expect(result.id).to.equal(inputRepo.id);
  });

  it('SubscriptionController create : successful timestamp', async () => {
    mockIncentive.isCertifiedTimestampRequired = true;
    subscriptionRepository.stubs.create.resolves(inputRepo);
    incentiveRepository.stubs.findById.resolves(mockIncentive);
    citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);
    subscriptionService.stubs.createSubscriptionTimestamp.resolves();

    const result = await controller.createSubscription(input);

    expect(result.id).to.equal(inputRepo.id);
    mockIncentive.isCertifiedTimestampRequired = false;
  });

  it('SubscriptionController create : error', async () => {
    try {
      subscriptionRepository.stubs.create.rejects('Error');
      incentiveRepository.stubs.findById.resolves(mockIncentive);
      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);
      await controller.createSubscription(input);
    } catch (err) {
      expect(err.name).to.equal('Error');
    }
  });

  // unit tests for post attachements

  it('SubscriptionController addAttachments : successful with metadata, without files', async () => {
    subscriptionRepository.stubs.findById.resolves(newSubscription);
    funderRepository.stubs.findById.resolves(mockFunder);
    const citizenFindByIdStub = citizenService.stubs.getCitizenWithAffiliationById.resolves(
      new Citizen({id: 'Citizen'}),
    );
    const metadataFindByIdStub = metadataRepository.stubs.findById.resolves(attachmentDataMock);
    const metadataDeleteByIdStub = metadataRepository.stubs.deleteById.resolves();
    const subscriptionUpdateByIdStub = subscriptionRepository.stubs.updateById.resolves();
    const invoiceStub = sinon.stub(invoiceUtils, 'generatePdfInvoices').resolves([invoiceMock]);
    s3Service.stubs.uploadFileListIntoBucket.resolves(['ok']);
    const result = await controller.addAttachmentsToSubscription('randomInputId', mockAttachmentWithoutFiles);
    expect(result.id).to.equal(inputRepo.id);
    sinon.assert.calledOnce(citizenFindByIdStub);
    sinon.assert.calledOnce(metadataFindByIdStub);
    sinon.assert.calledOnce(metadataDeleteByIdStub);
    sinon.assert.calledOnce(subscriptionUpdateByIdStub);
    invoiceStub.restore();
  });

  it('SubscriptionController addAttachments : successful with files, without metadata', async () => {
    subscriptionRepository.stubs.findById.resolves(newSubscription);
    funderRepository.stubs.findById.resolves(mockFunder);
    const citizenFindByIdStub = citizenService.stubs.getCitizenWithAffiliationById.resolves(
      new Citizen({id: 'Citizen'}),
    );
    const metadataFindByIdStub = metadataRepository.stubs.findById.resolves(undefined);
    const metadataDeleteByIdStub = metadataRepository.stubs.deleteById.resolves();
    const subscriptionUpdateByIdStub = subscriptionRepository.stubs.updateById.resolves();
    const invoiceStub = sinon.stub(invoiceUtils, 'generatePdfInvoices').resolves([]);
    s3Service.stubs.uploadFileListIntoBucket.resolves(['ok']);
    const result = await controller.addAttachmentsToSubscription(
      'randomInputId',
      mockAttachmentWithoutMetadata,
    );
    expect(result.id).to.equal(inputRepo.id);
    sinon.assert.calledOnce(citizenFindByIdStub);
    sinon.assert.notCalled(metadataFindByIdStub);
    sinon.assert.notCalled(metadataDeleteByIdStub);
    sinon.assert.calledOnce(subscriptionUpdateByIdStub);
    sinon.assert.notCalled(invoiceStub);
    invoiceStub.restore();
  });

  it('SubscriptionController addAttachments : successful with metadata and files', async () => {
    subscriptionRepository.stubs.findById.resolves(newSubscription);
    funderRepository.stubs.findById.resolves(mockFunder);
    const citizenFindByIdStub = citizenService.stubs.getCitizenWithAffiliationById.resolves(
      new Citizen({id: 'Citizen'}),
    );
    const metadataFindByIdStub = metadataRepository.stubs.findById.resolves(attachmentDataMock);
    const metadataDeleteByIdStub = metadataRepository.stubs.deleteById.resolves();
    const subscriptionUpdateByIdStub = subscriptionRepository.stubs.updateById.resolves();
    const invoiceStub = sinon.stub(invoiceUtils, 'generatePdfInvoices').resolves([invoiceMock]);
    s3Service.stubs.uploadFileListIntoBucket.resolves(['ok']);
    const result = await controller.addAttachmentsToSubscription('randomInputId', mockAttachment);
    expect(result.id).to.equal(inputRepo.id);
    sinon.assert.calledOnce(citizenFindByIdStub);
    sinon.assert.calledOnce(metadataFindByIdStub);
    sinon.assert.calledOnce(metadataDeleteByIdStub);
    sinon.assert.calledOnce(subscriptionUpdateByIdStub);
    invoiceStub.restore();
  });

  it('SubscriptionController addAttachments : successful without metadata, without files', async () => {
    subscriptionRepository.stubs.findById.resolves(newSubscription);
    funderRepository.stubs.findById.resolves(mockFunder);
    const citizenFindByIdStub = citizenService.stubs.getCitizenWithAffiliationById.resolves(
      new Citizen({id: 'Citizen'}),
    );
    const metadataFindByIdStub = metadataRepository.stubs.findById.resolves(attachmentDataMock);
    const metadataDeleteByIdStub = metadataRepository.stubs.deleteById.resolves();
    const subscriptionUpdateByIdStub = subscriptionRepository.stubs.updateById.resolves();
    const invoiceStub = sinon.stub(invoiceUtils, 'generatePdfInvoices').resolves([]);
    s3Service.stubs.uploadFileListIntoBucket.resolves(['ok']);
    const result = await controller.addAttachmentsToSubscription(
      'randomInputId',
      mockAttachmentWithoutMetadataWithoutFiles,
    );
    expect(result.id).to.equal(inputRepo.id);
    sinon.assert.calledOnce(citizenFindByIdStub);
    sinon.assert.notCalled(metadataFindByIdStub);
    sinon.assert.notCalled(metadataDeleteByIdStub);
    sinon.assert.notCalled(subscriptionUpdateByIdStub);
    sinon.assert.notCalled(invoiceStub);
    invoiceStub.restore();
  });

  it('SubscriptionController addFiles : error', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(newSubscription);
      funderRepository.stubs.findById.resolves(mockFunder);
      citizenService.stubs.getCitizenWithAffiliationById.rejects('Error');
      await controller.addAttachmentsToSubscription('randomInputId', mockAttachment);
    } catch (err) {
      expect(err.name).to.equal('Error');
      sinon.restore();
    }
  });

  it('SubscriptionController find : successful', async () => {
    subscriptionRepository.stubs.find.resolves([input]);
    userRepository.stubs.findOne.resolves(user);
    funderRepository.stubs.getFunderByNameAndType.resolves({
      name: 'funderName',
      type: FUNDER_TYPE.ENTERPRISE,
      id: 'random',
    } as Funder);
    communityRepository.stubs.findByFunderId.resolves([
      new Community({id: 'idCommunity', funderId: 'random'}),
      new Community({id: 'idCommunity1', funderId: 'random'}),
    ]);

    const result = await controller.find(
      'A_TRAITER',
      'incentiveId',
      'incentiveType',
      'idCommunity',
      'lastName',
      '',
      '2021',
    );

    expect(result).to.deepEqual([input]);
  });

  it('SubscriptionController find with citizenId: successful', async () => {
    subscriptionRepository.stubs.find.resolves([input]);
    userRepository.stubs.findOne.resolves(user);
    funderRepository.stubs.getFunderByNameAndType.resolves({
      name: 'Capgemini',
      type: FUNDER_TYPE.ENTERPRISE,
      id: 'random',
    } as Funder);
    communityRepository.stubs.findByFunderId.resolves([
      new Community({id: 'idCommunity', funderId: 'random'}),
      new Community({id: 'idCommunity1', funderId: 'random'}),
    ]);

    const count = subscriptionRepository.stubs.count.resolves();

    const result = await controller.find(
      'A_TRAITER',
      'incentiveId',
      'incentiveType',
      'idCommunity',
      'lastName',
      'email@gmail.com',
    );

    const res = {
      subscriptions: [input],
      ...count,
    };

    expect(result).to.deepEqual(res);
  });

  it('SubscriptionController find : community mismatch', async () => {
    subscriptionRepository.stubs.find.resolves([input]);
    userRepository.stubs.findOne.resolves(user);
    funderRepository.stubs.getFunderByNameAndType.resolves({
      name: 'funderName',
      type: FUNDER_TYPE.ENTERPRISE,
      id: 'random',
    } as Funder);
    try {
      await controller.find('A_TRAITER', 'incentiveId', 'idCommunity', 'lastName');
    } catch (err) {
      expect(err.message).to.equal(`Access denied`);
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('SubscriptionController findById : successful', async () => {
    subscriptionRepository.stubs.findById.resolves(input);
    const result = await controller.findById('someRandomId');

    expect(result).to.deepEqual(input);
  });

  it('SubscriptionController validate : error', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId1').resolves(initInput1);
    // Invokes business
    try {
      await controller.validate('randomInputId1', {
        mode: 'unique',
        amount: 1,
      } as ValidationSinglePayment);
    } catch (error) {
      // Checks
      expect(subscriptionRepository.stubs.updateById.notCalled).true();
      expect(subscriptionService.stubs.checkPayment.calledOnce).false();

      expect(error.message).to.equal('subscriptions.error.bad.status');
      expect(error.statusCode).to.equal(StatusCode.Conflict);
    }
  });

  it('SubscriptionController validate : successful', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId').resolves(input);
    // Invokes business
    const payment = {
      mode: 'unique',
      amount: 1,
    } as ValidationSinglePayment;
    subscriptionService.stubs.checkPayment.resolves(payment);
    subscriptionService.stubs.validateSubscription.resolves();
    const result = await controller.validate('randomInputId', payment);
    // Checks
    expect(result).to.Null;
  });

  it('SubscriptionController reject : error', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId1').resolves(initInput1);
    // Invokes business

    try {
      await controller.reject('randomInputId1', {
        type: 'ConditionsNonRespectees',
      } as CommonRejection);
    } catch (error) {
      // Checks
      expect(subscriptionRepository.stubs.updateById.notCalled).true();
      expect(subscriptionService.stubs.checkRefusMotif.calledOnce).false();
      expect(error.message).to.equal('subscriptions.error.bad.status');
      expect(error.statusCode).to.equal(StatusCode.Conflict);
    }
  });

  it('SubscriptionController reject : successful', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId').resolves(input);

    // Invokes business
    const reason = {
      type: REJECTION_REASON.CONDITION,
    } as CommonRejection;
    subscriptionService.stubs.checkRefusMotif.resolves(reason);
    subscriptionService.stubs.rejectSubscription.resolves();
    const result = await controller.reject('randomInputId', reason);
    // Checks
    expect(result).to.Null;
  });
  it('SubscriptionController getSubscriptionFileByName : successful', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId').resolves(input);
    s3Service.stubs.downloadFileBuffer.resolves({});

    const result = await controller.getSubscriptionFileByName('randomInputId', 'helloworld.jpg');

    sinon.assert.calledOnceWithExactly(
      s3Service.stubs.downloadFileBuffer,
      'email@gmail.com',
      'randomInputId',
      'helloworld.jpg',
    );
    expect(result).to.deepEqual({});
  });

  it('SubscriptionController getSubscriptionFileByName : error', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId').resolves(input);
    try {
      s3Service.stubs.downloadFileBuffer.rejects({});
      await controller.getSubscriptionFileByName('randomInputId', 'helloworld.jpg');
      sinon.assert.fail();
    } catch (error) {
      expect(error).to.deepEqual({});
    }
  });

  it('SubscriptionController subscriptions/export : error funder not found', async () => {
    try {
      funderRepository.stubs.getFunderByNameAndType.resolves(null);
      await controller.generateExcel(response);
    } catch (error) {
      expect(error.message).to.equal('Funder not found');
      expect(error.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('SubscriptionController subscriptions/export : error', async () => {
    // Stub method
    try {
      funderRepository.stubs.getFunderByNameAndType.resolves({
        name: 'Capgemini',
        type: FUNDER_TYPE.ENTERPRISE,
        id: 'random',
      } as Funder);
      userRepository.stubs.findOne.resolves(user);
      subscriptionRepository.stubs.find.resolves([]);
      const response: any = {};
      await controller.generateExcel(response);
    } catch (error) {
      expect(error.message).to.equal('Aucune demande validée à télécharger');
      expect(error.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('SubscriptionController getMetadata : successful', async () => {
    metadataRepository.stubs.findById.resolves(mockMetadataFindById);
    const result = await controller.getMetadata('randomMetadataId');
    expect(result).to.deepEqual(mockMetadataReturnOK);
  });

  it('SubscriptionController getMetadata : error', async () => {
    try {
      metadataRepository.stubs.findById.rejects('Error');
      await controller.getMetadata('randomMetadataId');
    } catch (err) {
      expect(err.name).to.equal('Error');
    }
  });

  it('SubscriptionController createMetadata : successful', async () => {
    metadataRepository.stubs.create.resolves(new Metadata({id: 'randomMetadataId'}));
    const result: any = await controller.createMetadata(mockMetadata);
    expect(result.metadataId).to.equal('randomMetadataId');
  });

  it('SubscriptionController createMetadata : error', async () => {
    try {
      metadataRepository.stubs.create.rejects('Error');
      await controller.createMetadata(mockMetadata);
    } catch (err) {
      expect(err.name).to.equal('Error');
    }
  });

  it('SubscriptionController updateById : ERROR', async () => {
    try {
      subscriptionRepository.stubs.findById.rejects(new Error('Error'));
      await controller.updateById('id', {TextField: 'text', DateField: '02/06/2022'});
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
  });

  it('SubscriptionController updateById : success', async () => {
    subscriptionRepository.stubs.findById
      .withArgs('id')
      .resolves(new Subscription({id: 'id', specificFields: {TextField: 'toto'}}));
    subscriptionRepository.stubs.updateById.resolves();
    await controller.updateById('id', {TextField: 'text', DateField: '02/06/2022'});
  });

  it('SubscriptionController updateById timestamp ON: success', async () => {
    subscriptionRepository.stubs.findById
      .withArgs('id')
      .resolves(new Subscription({id: 'id', specificFields: {TextField: 'toto'}}));
    incentiveRepository.stubs.findById.resolves(mockIncentiveAutomaticTimestamp);
    subscriptionService.stubs.createSubscriptionTimestamp.resolves();
    subscriptionRepository.stubs.updateById.resolves();
    await controller.updateById('id', {TextField: 'text', DateField: '02/06/2022'});
  });

  it('SubscriptionController getTimestamps : Mongo ERROR', async () => {
    try {
      subscriptionTimestampRepository.stubs.find.rejects(new Error('Error'));
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
  });

  it('SubscriptionController getTimestamps : success', async () => {
    const funders = new Funder({
      id: '4af6d9de-108a-47ac-b293-cec94b19662e',
      name: 'mobicoop',
      type: 'Collectivité',
      clientId: undefined,
      siretNumber: undefined,
      citizensCount: undefined,
      mobilityBudget: undefined,
      enterpriseDetails: undefined,
    });
    funderRepository.stubs.find.resolves([funders]);

    subscriptionTimestampRepository.stubs.find.resolves([mockSubscriptionTimestamp]);
    const result = await controller.getTimestamps();

    expect(result).to.deepEqual([mockSubscriptionTimestamp]);
  });

  it('SubscriptionController finalizeSubscription - Manual Mode : successful', async () => {
    subscriptionRepository.stubs.findById.resolves(inputRepoDraft);
    incentiveRepository.stubs.findById.resolves(mockIncentiveNoNotification);
    subscriptionRepository.stubs.updateById.resolves();
    funderRepository.stubs.getEnterpriseById.resolves(hrisFalse);
    mailService.stubs.sendMailAsHtml.resolves('ok');
    const result = await controller.finalizeSubscription('randomInputId');
    sinon.assert.calledOnceWithExactly(subscriptionRepository.stubs.updateById, 'randomInputId', {
      status: SUBSCRIPTION_STATUS.TO_PROCESS,
    });

    sinon.assert.calledOnceWithExactly(
      mailService.stubs.sendMailAsHtml,
      inputRepoDraft.email,
      'Confirmation d’envoi de la demande',
      'requests-to-process',
      sinon.match.any,
    );
    expect(result.id).to.equal(inputRepo.id);
  });

  it('SubscriptionController finalizeSubscription hris true - Manual Mode: successful', async () => {
    subscriptionRepository.stubs.findById.resolves(inputRepoDraft);
    incentiveRepository.stubs.findById.resolves(mockIncentiveNoNotification);
    subscriptionRepository.stubs.updateById.resolves();
    funderRepository.stubs.getEnterpriseById.resolves(hrisFalse);
    communityRepository.stubs.findById.resolves(name);
    citizenService.stubs.getCitizenWithAffiliationById.resolves(citoyen);
    const connection: any = {
      createChannel: () => {
        return channel;
      },
      close: () => {},
    };
    const channel: any = {
      publish: () => {
        return true;
      },
      close: () => {},
    };
    const amqpTest = sinon.stub(amqp, 'connect').resolves(connection);
    await rabbitmqService.publishMessage(subscriptionPayload, 'header');
    const result = await controller.finalizeSubscription('randomInputId');
    expect(result.id).to.equal('randomInputId');
    amqpTest.restore();
  });

  it('SubscriptionController finalizeSubscription hris true && commaunityId \
   - Manual Mode : successful', async () => {
    subscriptionRepository.stubs.findById.resolves(inputRepoDraft1);
    incentiveRepository.stubs.findById.resolves(mockIncentiveNoNotification);
    subscriptionRepository.stubs.updateById.resolves();
    funderRepository.stubs.getEnterpriseById.resolves(hrisTrue);
    communityRepository.stubs.findById.resolves(name);
    citizenService.stubs.getCitizenWithAffiliationById.resolves(citoyen);
    const connection: any = {
      createChannel: () => {
        return channel;
      },
      close: () => {},
    };
    const channel: any = {
      publish: () => {
        return true;
      },
      close: () => {},
    };
    const amqpTest = sinon.stub(amqp, 'connect').resolves(connection);
    await rabbitmqService.publishMessage(subscriptionPayload, 'header');
    const result = await controller.finalizeSubscription('randomInputId');
    expect(result.id).to.equal('randomInputId');
    amqpTest.restore();
  });

  it('SubscriptionController finalizeSubscription diffrent funderType \
   - Manual Mode: successful', async () => {
    subscriptionRepository.stubs.findById.resolves(inputRepoDraft2);
    incentiveRepository.stubs.findById.resolves(mockIncentiveNoNotification);
    subscriptionRepository.stubs.updateById.resolves();
    funderRepository.stubs.getEnterpriseById.resolves(hrisTrue);
    communityRepository.stubs.findById.resolves(name);
    citizenService.stubs.getCitizenWithAffiliationById.resolves(citoyen);
    await rabbitmqService.publishMessage(subscriptionPayload, 'header');
    const result = await controller.finalizeSubscription('randomInputId');
    expect(result.id).to.equal('randomInputId');
  });

  it('SubscriptionController finalizeSubscription without entreprise - Manual Mode : error', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputRepoDraft1);
      incentiveRepository.stubs.findById.resolves(mockIncentiveNoNotification);
      subscriptionRepository.stubs.updateById.resolves();
      communityRepository.stubs.findById.resolves(name);
      citizenService.stubs.getCitizenWithAffiliationById.resolves(citoyen);
      await rabbitmqService.publishMessage(subscriptionPayload, 'header');
      await controller.finalizeSubscription('randomInputId');
    } catch (err) {
      expect(err.id).to.equal('randomInputId');
    }
  });

  it('SubscriptionController finalizeSubscription - Manual Mode : error', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputRepoDraft);
      incentiveRepository.stubs.findById.resolves(mockIncentive);
      subscriptionRepository.stubs.updateById.rejects('Error');
      await controller.finalizeSubscription('randomInputId');
    } catch (err) {
      expect(err.name).to.equal('Error');
    }
  });

  it('SubscriptionController finalizeSubscription - Automatic Mode : validate', async () => {
    subscriptionRepository.stubs.findById.resolves(subscriptionDraft);
    incentiveRepository.stubs.findById.resolves(mockIncentiveAutomaticControl);
    incentiveChecksRepository.stubs.find.resolves(incentiveEligibilityChecks as IncentiveEligibilityChecks[]);

    subscriptionService.stubs.checkFranceConnectIdentity.resolves(true);
    subscriptionService.stubs.checkCEEValidity.resolves({
      status: 'success',
      code: 201,
      data: {
        uuid: 'id',
        datetime: '2022-12-05T00:00:00.000Z',
        token: 'token',
      },
    });
    subscriptionService.stubs.validateSubscription.resolves();

    const result = await controller.finalizeSubscription('randomInputId');
    expect(result).to.containEql({
      id: 'randomInputId',
      status: SUBSCRIPTION_STATUS.VALIDATED,
    });
  });

  it('SubscriptionController finalizeSubscription - Automatic Mode : reject first control', async () => {
    subscriptionRepository.stubs.findById.resolves(subscriptionDraft);
    incentiveRepository.stubs.findById.resolves(mockIncentiveAutomaticControl);
    incentiveChecksRepository.stubs.find.resolves(incentiveEligibilityChecks as IncentiveEligibilityChecks[]);

    subscriptionService.stubs.checkFranceConnectIdentity.resolves(false);
    subscriptionService.stubs.rejectSubscription.resolves();

    const result = await controller.finalizeSubscription('randomInputId');
    expect(result).to.containEql({
      id: 'randomInputId',
      status: SUBSCRIPTION_STATUS.REJECTED,
      rejectionReason: REJECTION_REASON.NOT_FRANCECONNECT,
    });
  });

  it('SubscriptionController finalizeSubscription - Automatic Mode : \
   reject second control', async () => {
    subscriptionRepository.stubs.findById.resolves(subscriptionDraft);
    incentiveRepository.stubs.findById.resolves(mockIncentiveAutomaticTimestamp);
    incentiveChecksRepository.stubs.find.resolves(incentiveEligibilityChecks as IncentiveEligibilityChecks[]);

    subscriptionService.stubs.checkFranceConnectIdentity.resolves(true);
    subscriptionService.stubs.checkCEEValidity.resolves({
      status: 'error',
      code: 404,
      message: 'Not Found',
    });
    subscriptionService.stubs.rejectSubscription.resolves();

    const result = await controller.finalizeSubscription('randomInputId');
    expect(result).to.containEql({
      id: 'randomInputId',
      status: SUBSCRIPTION_STATUS.REJECTED,
      rejectionReason: REJECTION_REASON.INVALID_RPC_CEE_REQUEST,
      comments: 'HTTP 404 - Not Found',
    });
  });

  function givenStubbedRepository() {
    communityRepository = createStubInstance(CommunityRepository);
    userRepository = createStubInstance(UserRepository);
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    metadataRepository = createStubInstance(MetadataRepository);
    incentiveRepository = createStubInstance(IncentiveRepository);
    incentiveChecksRepository = createStubInstance(IncentiveEligibilityChecksRepository);
    funderRepository = createStubInstance(FunderRepository);
    subscriptionTimestampRepository = createStubInstance(SubscriptionTimestampRepository);
    funderRepository = createStubInstance(FunderRepository);
  }

  function givenStubbedService() {
    s3Service = createStubInstance(S3Service);
    citizenService = createStubInstance(CitizenService);
    subscriptionService = createStubInstance(SubscriptionService);
    rabbitmqService = createStubInstance(RabbitmqService);
    mailService = createStubInstance(MailService);
  }
});

const initInput = new Subscription({
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
  incentiveTransportList: ['velo'],
  communityId: 'id1',
  status: SUBSCRIPTION_STATUS.TO_PROCESS,
  createdAt: new Date('2021-04-06T09:01:30.778Z'),
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
});

const initInput1 = new Subscription({
  id: 'randomInputId1',
  incentiveId: 'incentiveId',
  funderName: 'funderName',
  incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
  incentiveTitle: 'incentiveTitle',
  citizenId: 'email@gmail.com',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  consent: true,
  incentiveTransportList: ['velo'],
  status: SUBSCRIPTION_STATUS.VALIDATED,
  createdAt: new Date('2021-04-06T09:01:30.778Z'),
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
});

const currentUser: IUser = {
  id: 'idUser',
  emailVerified: true,
  maas: undefined,
  membership: ['/entreprises/Capgemini'],
  roles: ['gestionnaires'],
  [securityId]: 'idEnterprise',
  funderName: 'Capgemini',
};

const user = new User({
  id: 'idUser',
  email: 'random@random.fr',
  firstName: 'firstName',
  lastName: 'lastName',
  funderId: 'random',
  roles: ['gestionnaires'],
  communityIds: ['id1', 'id2'],
});

const mockMetadataFindById = new Metadata({
  id: 'randomMetadataId',
  incentiveId: 'randomAidId',
  citizenId: 'randomCitizenId',
  attachmentMetadata: new AttachmentMetadata(
    Object.assign({
      invoices: [
        {
          customer: {
            customerName: 'name',
            customerSurname: 'surname',
          },
          transaction: {
            purchaseDate: new Date('2021-03-03'),
          },
          products: [
            {
              productName: 'fileName',
            },
          ],
        },
      ],
      totalElements: 1,
    }),
  ),
});

const mockMetadataReturnOK = {
  incentiveId: 'randomAidId',
  citizenId: 'randomCitizenId',
  attachmentMetadata: [{fileName: '03-03-2021_fileName_surname_name.pdf'}],
};

const mockMetadata = new Metadata({
  incentiveId: 'randomAidId',
  citizenId: 'randomCitizenId',
  attachmentMetadata: new AttachmentMetadata({}),
});

const inputRepoDraft = new Subscription({
  id: 'randomInputId',
  citizenId: 'citizenId',
  email: 'email@gmail.com',
  status: SUBSCRIPTION_STATUS.DRAFT,
  incentiveType: 'AideEmployeur',
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

const hrisFalse = new Enterprise({
  id: 'randomInputId',
  enterpriseDetails: new EnterpriseDetails({
    isHris: false,
  }),
});

const inputRepo = new Subscription({
  id: 'randomInputId',
  incentiveId: 'incentiveId',
  incentiveTitle: 'incentiveTitle',
  citizenId: 'citizenId',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  consent: true,
  incentiveTransportList: ['velo'],
  status: SUBSCRIPTION_STATUS.TO_PROCESS,
  createdAt: new Date('2021-04-06T09:01:30.778Z'),
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
});

const hrisTrue = new Enterprise({
  id: 'randomInputId',
  enterpriseDetails: new EnterpriseDetails({
    isHris: true,
  }),
});

const name: Community = new Community({
  id: 'randomInputId',
  name: 'RabbitCo',
});

const citoyen: Citizen = new Citizen({
  id: 'test',
  affiliation: Object.assign({
    enterpriseId: 'test',
    enterpriseEmail: 'test@gmail.com',
    status: AFFILIATION_STATUS.AFFILIATED,
  }),
});

const inputRepoDraft1 = new Subscription({
  id: 'randomInputId',
  citizenId: 'citizenId',
  email: 'email@gmail.com',
  status: SUBSCRIPTION_STATUS.DRAFT,
  communityId: 'randomInputId',
  incentiveType: 'AideEmployeur',
  specificFields: ['test', 'test2'],
});

const inputRepoDraft2 = new Subscription({
  id: 'randomInputId',
  citizenId: 'citizenId',
  email: 'email@gmail.com',
  status: SUBSCRIPTION_STATUS.DRAFT,
  communityId: 'randomInputId',
  incentiveType: 'AideEmployeur1',
  specificFields: ['test', 'test2'],
});

const subscriptionPayload = {
  lastName: 'test',
  firstName: 'test',
  birthdate: 'test',
  citizenId: 'test',
  incentiveId: 'test',
  subscriptionId: 'test',
  email: 'test',
  status: SUBSCRIPTION_STATUS.TO_PROCESS,
  communityName: 'test',
  specificFields: JSON.stringify(['test', 'test']),
  attachments: ['urlTest', 'urlTest'],
  encryptedAESKey: 'encryptedAESKey',
  encryptedIV: 'encryptedIV',
  encryptionKeyId: 'encryptionKeyId',
  encryptionKeyVersion: 1,
};

const subscriptionDraft = new Subscription({
  id: 'randomInputId',
  citizenId: 'citizenId',
  email: 'email@gmail.com',
  status: SUBSCRIPTION_STATUS.DRAFT,
  incentiveType: 'AideEmployeur',
});

const mockIncentiveAutomaticControl = new Incentive({
  isCitizenNotificationsDisabled: false,
  subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.AUTOMATIC,
  eligibilityChecks: [
    {
      id: 'uuid1',
      value: [],
      active: true,
    },
    {
      id: 'uuid2',
      value: ['6399c12d3003a25dc82c92af'],
      active: false,
    },
    {
      id: 'uuid3',
      value: [],
      active: true,
    },
  ] as EligibilityCheck[],
});

const mockIncentiveAutomaticTimestamp = new Incentive({
  isCitizenNotificationsDisabled: false,
  subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.AUTOMATIC,
  eligibilityChecks: [
    {
      id: 'uuid1',
      value: [],
      active: true,
    },
    {
      id: 'uuid2',
      value: ['6399c12d3003a25dc82c92af'],
      active: false,
    },
    {
      id: 'uuid3',
      value: [],
      active: true,
    },
  ] as EligibilityCheck[],
  isCertifiedTimestampRequired: true,
});

const incentiveEligibilityChecks = [
  {
    id: 'uuid1',
    name: 'Identité FranceConnect',
    label: ELIGIBILITY_CHECKS_LABEL.FRANCE_CONNECT,
    description: "Les données d'identité doivent être fournies/certifiées par FranceConnect",
    type: 'boolean',
    motifRejet: 'CompteNonFranceConnect',
  },
  {
    id: 'uuid3',
    name: 'Demande CEE au RPC',
    label: 'RPCCEERequest',
    description: '1 seule demande par dispositif CEE, enregistrée dans le Registre de Preuve de Covoiturage',
    type: 'boolean',
    motifRejet: 'RPCCEEDemandeInvalide',
  },
];

const mockIncentive = new Incentive({
  id: 'incentiveId',
  title: 'incentiveTitle',
  transportList: ['velo'],
  contact: 'Contactez le numéro vert au 05 206 308',
  subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.MANUAL,
});

const mockSubscriptionTimestamp = new SubscriptionTimestamp({
  id: '63c673f42926ff4458f71b71',
  subscriptionId: '63c673f32926ff4458f71b70',
  hashedSubscription: 'b28c94b2195c8ed259f0b415aaee3f39b0b2920a4537611499fa044956917a21',
  subscription: new Subscription({
    id: '63c673f32926ff4458f71b70',
    incentiveId: '63c00d1588b45c1c403189e5',
    funderName: 'mobicoop',
    incentiveType: 'AideNationale',
    incentiveTitle: 'Aide horodaté',
    incentiveTransportList: ['velo'],
    citizenId: '902d6f22-fe4e-401d-9fed-d04620d49fea',
    lastName: 'Rasovsky',
    firstName: 'Bob',
    email: 'etudiant.mcm@yopmail.com',
    city: 'Paris',
    postcode: '75000',
    birthdate: '1970-01-01T00:00:00.000Z',
    communityId: '63c006d088b45c1c403189cc',
    consent: true,
    status: SUBSCRIPTION_STATUS.DRAFT,
    createdAt: new Date('2023-01-17T10:09:55.910Z'),
    updatedAt: new Date('2023-01-17T10:09:55.910Z'),
    funderId: '82174bc5-323b-4035-a190-f45481005861',
    isCitizenDeleted: false,
  }),
  timestampedData: '',
  timestampToken: Buffer.from('b28c94b2195c8ed259f0b415aaee3f39b0b2920a4537611499fa044956917a21', 'utf8'),
  request: Object.assign({
    client: 'mobicoop',
    endpoint: 'PATCH v1/subscriptions',
  }),
  signingTime: new Date('2023-01-17T10:09:56.562Z'),
  createdAt: new Date('2023-01-17T10:09:56.562Z'),
});

const today = new Date();
const expirationDate = new Date(today.setMonth(today.getMonth() + 3));

const mockencryptionKeyValid = new EncryptionKey({
  id: '62977dc80929474f84c403de',
  version: 1,
  publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApkUKTww771tjeFsYFCZq
n76SSpOzolmtf9VntGlPfbP5j1dEr6jAuTthQPoIDaEed6P44yyL3/1GqWJMgRbf
n8qqvnu8dH8xB+c9+er0tNezafK9eK37RqzsTj7FNW2Dpk70nUYncTiXxjf+ofLq
sokEIlp2zHPEZce2o6jAIoFOV90MRhJ4XcCik2w3IljxdJSIfBYX2/rDgEVN0T85
OOd9ChaYpKCPKKfnpvhjEw+KdmzUFP1u8aao2BNKyI2C+MHuRb1wSIu2ZAYfHgoG
X6FQc/nXeb1cAY8W5aUXOP7ITU1EtIuCD8WuxXMflS446vyfCmJWt+OFyveqgJ4n
owIDAQAB
-----END PUBLIC KEY-----
`,
  expirationDate,
  lastUpdateDate: new Date(),
  privateKeyAccess: new PrivateKeyAccess({loginURL: 'loginURL', getKeyURL: 'getKeyURL'}),
});

const mockFunder = new Funder({
  id: '2b6ee373-4c5b-403b-afe5-3bf3cbd2473',
  encryptionKey: mockencryptionKeyValid,
});

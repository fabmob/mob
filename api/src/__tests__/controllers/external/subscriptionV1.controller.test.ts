import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {Readable} from 'stream';
const amqp = require('amqplib');

import {
  SubscriptionRepository,
  IncentiveRepository,
  MetadataRepository,
  CommunityRepository,
  EnterpriseRepository,
  CollectivityRepository,
  IncentiveEligibilityChecksRepository,
} from '../../../repositories';
import {SubscriptionV1Controller} from '../../../controllers/external';
import {
  Subscription,
  Citizen,
  Incentive,
  Metadata,
  CreateSubscription,
  EncryptionKey,
  Collectivity,
  PrivateKeyAccess,
  Territory,
  EligibilityCheck,
  IncentiveEligibilityChecks,
} from '../../../models';
import {
  CitizenService,
  MailService,
  RabbitmqService,
  S3Service,
  SubscriptionService,
} from '../../../services';
import * as invoiceUtils from '../../../utils/invoice';
import {
  AFFILIATION_STATUS,
  ELIGIBILITY_CHECKS_LABEL,
  IUser,
  REJECTION_REASON,
  SUBSCRIPTION_CHECK_MODE,
  SUBSCRIPTION_STATUS,
} from '../../../utils';
import {Enterprise} from '../../../models/enterprise';
import {Community} from '../../../models/community';

describe('SubscriptionController (unit)', () => {
  let subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    collectivityRepository: StubbedInstanceWithSinonAccessor<CollectivityRepository>,
    incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    metadataRepository: StubbedInstanceWithSinonAccessor<MetadataRepository>,
    enterpriseRepository: StubbedInstanceWithSinonAccessor<EnterpriseRepository>,
    communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>,
    incentiveChecksRepository: StubbedInstanceWithSinonAccessor<IncentiveEligibilityChecksRepository>,
    rabbitmqService: StubbedInstanceWithSinonAccessor<RabbitmqService>,
    s3Service: StubbedInstanceWithSinonAccessor<S3Service>,
    mailService: StubbedInstanceWithSinonAccessor<MailService>,
    subscptionService: StubbedInstanceWithSinonAccessor<SubscriptionService>,
    citizenService: StubbedInstanceWithSinonAccessor<CitizenService>,
    controller: SubscriptionV1Controller;

  const mockIncentiveNoNotification = new Incentive({
    territory: {name: 'Toulouse', id: 'test'} as Territory,
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

  const currentUser: IUser = {
    id: 'citizenId',
    emailVerified: true,
    maas: undefined,
    membership: ['/citizens'],
    roles: ['offline_access', 'uma_authorization'],
    [securityId]: 'citizenId',
  };

  const input = new CreateSubscription({
    incentiveId: 'incentiveId',
    consent: true,
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

  const inputRepoDraft = new Subscription({
    id: 'randomInputId',
    citizenId: 'citizenId',
    email: 'email@gmail.com',
    status: SUBSCRIPTION_STATUS.DRAFT,
    incentiveType: 'AideEmployeur',
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

  const hrisFalse = new Enterprise({
    id: 'randomInputId',
    isHris: false,
  });

  const hrisTrue = new Enterprise({
    id: 'randomInputId',
    isHris: true,
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

  const mockAttachmentWithoutFiles = {
    body: {
      data: JSON.stringify({
        metadataId: 'randomMetadataId',
      }),
    },
    files: [],
  };

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

  beforeEach(() => {
    givenStubbedRepository();
    controller = new SubscriptionV1Controller(
      subscriptionRepository,
      incentiveRepository,
      metadataRepository,
      enterpriseRepository,
      communityRepository,
      collectivityRepository,
      incentiveChecksRepository,
      rabbitmqService,
      s3Service,
      mailService,
      currentUser,
      subscptionService,
      citizenService,
    );
  });

  describe('SubscriptionController', () => {
    it('SubscriptionV1Controller create : successful', async () => {
      subscriptionRepository.stubs.create.resolves(inputRepo);
      incentiveRepository.stubs.findById.resolves(mockIncentive);
      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);
      const result = await controller.createSubscription(input);

      expect(result.id).to.equal(inputRepo.id);
    });

    it('SubscriptionV1Controller create : error', async () => {
      try {
        subscriptionRepository.stubs.create.rejects('Error');
        incentiveRepository.stubs.findById.resolves(mockIncentive);
        citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);
        await controller.createSubscription(input);
      } catch (err) {
        expect(err.name).to.equal('Error');
      }
    });

    it('SubscriptionV1Controller addAttachments : successful with metadata, without files', async () => {
      subscriptionRepository.stubs.findById.resolves(newSubscription);
      collectivityRepository.stubs.findOne.resolves(mockCollectivity);
      enterpriseRepository.stubs.findOne.resolves(undefined);
      const citizenFindByIdStub =
        citizenService.stubs.getCitizenWithAffiliationById.resolves(
          new Citizen({id: 'Citizen'}),
        );
      const metadataFindByIdStub =
        metadataRepository.stubs.findById.resolves(attachmentDataMock);
      const metadataDeleteByIdStub = metadataRepository.stubs.deleteById.resolves();
      const subscriptionUpdateByIdStub =
        subscriptionRepository.stubs.updateById.resolves();
      const invoiceStub = sinon
        .stub(invoiceUtils, 'generatePdfInvoices')
        .resolves([invoiceMock]);
      s3Service.stubs.uploadFileListIntoBucket.resolves(['ok']);
      const result = await controller.addAttachments(
        'randomInputId',
        mockAttachmentWithoutFiles,
      );
      expect(result.id).to.equal(inputRepo.id);
      sinon.assert.calledOnce(citizenFindByIdStub);
      sinon.assert.calledOnce(metadataFindByIdStub);
      sinon.assert.calledOnce(metadataDeleteByIdStub);
      sinon.assert.calledOnce(subscriptionUpdateByIdStub);
      invoiceStub.restore();
    });

    it('SubscriptionV1Controller addAttachments : successful with files, without metadata', async () => {
      subscriptionRepository.stubs.findById.resolves(newSubscription);
      collectivityRepository.stubs.findOne.resolves(mockCollectivity);
      enterpriseRepository.stubs.findOne.resolves(undefined);
      const citizenFindByIdStub =
        citizenService.stubs.getCitizenWithAffiliationById.resolves(
          new Citizen({id: 'Citizen'}),
        );
      const metadataFindByIdStub = metadataRepository.stubs.findById.resolves(undefined);
      const metadataDeleteByIdStub = metadataRepository.stubs.deleteById.resolves();
      const subscriptionUpdateByIdStub =
        subscriptionRepository.stubs.updateById.resolves();
      const invoiceStub = sinon.stub(invoiceUtils, 'generatePdfInvoices').resolves([]);
      s3Service.stubs.uploadFileListIntoBucket.resolves(['ok']);
      const result = await controller.addAttachments(
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

    it('SubscriptionV1Controller addAttachments : successful with metadata and files', async () => {
      subscriptionRepository.stubs.findById.resolves(newSubscription);
      collectivityRepository.stubs.findOne.resolves(mockCollectivity);
      enterpriseRepository.stubs.findOne.resolves(undefined);
      const citizenFindByIdStub =
        citizenService.stubs.getCitizenWithAffiliationById.resolves(
          new Citizen({id: 'Citizen'}),
        );
      const metadataFindByIdStub =
        metadataRepository.stubs.findById.resolves(attachmentDataMock);
      const metadataDeleteByIdStub = metadataRepository.stubs.deleteById.resolves();
      const subscriptionUpdateByIdStub =
        subscriptionRepository.stubs.updateById.resolves();
      const invoiceStub = sinon
        .stub(invoiceUtils, 'generatePdfInvoices')
        .resolves([invoiceMock]);
      s3Service.stubs.uploadFileListIntoBucket.resolves(['ok']);
      const result = await controller.addAttachments('randomInputId', mockAttachment);
      expect(result.id).to.equal(inputRepo.id);
      sinon.assert.calledOnce(citizenFindByIdStub);
      sinon.assert.calledOnce(metadataFindByIdStub);
      sinon.assert.calledOnce(metadataDeleteByIdStub);
      sinon.assert.calledOnce(subscriptionUpdateByIdStub);
      invoiceStub.restore();
    });

    it('SubscriptionV1Controller addAttachments : successful without metadata, without files', async () => {
      subscriptionRepository.stubs.findById.resolves(newSubscription);
      collectivityRepository.stubs.findOne.resolves(mockCollectivity);
      enterpriseRepository.stubs.findOne.resolves(undefined);
      const citizenFindByIdStub =
        citizenService.stubs.getCitizenWithAffiliationById.resolves(
          new Citizen({id: 'Citizen'}),
        );
      const metadataFindByIdStub =
        metadataRepository.stubs.findById.resolves(attachmentDataMock);
      const metadataDeleteByIdStub = metadataRepository.stubs.deleteById.resolves();
      const subscriptionUpdateByIdStub =
        subscriptionRepository.stubs.updateById.resolves();
      const invoiceStub = sinon.stub(invoiceUtils, 'generatePdfInvoices').resolves([]);
      s3Service.stubs.uploadFileListIntoBucket.resolves(['ok']);
      const result = await controller.addAttachments(
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

    it('SubscriptionV1Controller addFiles : error', async () => {
      try {
        subscriptionRepository.stubs.findById.resolves(newSubscription);
        collectivityRepository.stubs.findOne.resolves(mockCollectivity);
        enterpriseRepository.stubs.findOne.resolves(undefined);
        citizenService.stubs.getCitizenWithAffiliationById.rejects('Error');
        await controller.addAttachments('randomInputId', mockAttachment);
      } catch (err) {
        expect(err.name).to.equal('Error');
        sinon.restore();
      }
    });

    it('SubscriptionV1Controller finalizeSubscription - Manual Mode : successful', async () => {
      subscriptionRepository.stubs.findById.resolves(inputRepoDraft);
      incentiveRepository.stubs.findById.resolves(mockIncentiveNoNotification);
      subscriptionRepository.stubs.updateById.resolves();
      enterpriseRepository.stubs.findById.resolves(hrisFalse);
      mailService.stubs.sendMailAsHtml.resolves('ok');
      const result = await controller.finalizeSubscription('randomInputId');
      sinon.assert.calledOnceWithExactly(
        subscriptionRepository.stubs.updateById,
        'randomInputId',
        {status: SUBSCRIPTION_STATUS.TO_PROCESS},
      );

      sinon.assert.calledOnceWithExactly(
        mailService.stubs.sendMailAsHtml,
        inputRepoDraft.email,
        'Confirmation d’envoi de la demande',
        'requests-to-process',
        sinon.match.any,
      );
      expect(result.id).to.equal(inputRepo.id);
    });

    it('SubscriptionV1Controller finalizeSubscription hris true - Manual Mode: successful', async () => {
      subscriptionRepository.stubs.findById.resolves(inputRepoDraft);
      incentiveRepository.stubs.findById.resolves(mockIncentiveNoNotification);
      subscriptionRepository.stubs.updateById.resolves();
      enterpriseRepository.stubs.findById.resolves(hrisTrue);
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

    it('SubscriptionV1Controller finalizeSubscription hris true && commaunityId \
     - Manual Mode : successful', async () => {
      subscriptionRepository.stubs.findById.resolves(inputRepoDraft1);
      incentiveRepository.stubs.findById.resolves(mockIncentiveNoNotification);
      subscriptionRepository.stubs.updateById.resolves();
      enterpriseRepository.stubs.findById.resolves(hrisTrue);
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

    it('SubscriptionV1Controller finalizeSubscription diffrent funderType \
     - Manual Mode: successful', async () => {
      subscriptionRepository.stubs.findById.resolves(inputRepoDraft2);
      incentiveRepository.stubs.findById.resolves(mockIncentiveNoNotification);
      subscriptionRepository.stubs.updateById.resolves();
      enterpriseRepository.stubs.findById.resolves(hrisTrue);
      communityRepository.stubs.findById.resolves(name);
      citizenService.stubs.getCitizenWithAffiliationById.resolves(citoyen);
      await rabbitmqService.publishMessage(subscriptionPayload, 'header');
      const result = await controller.finalizeSubscription('randomInputId');
      expect(result.id).to.equal('randomInputId');
    });

    it('SubscriptionV1Controller finalizeSubscription without entreprise - Manual Mode : error', async () => {
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

    it('SubscriptionV1Controller finalizeSubscription - Manual Mode : error', async () => {
      try {
        subscriptionRepository.stubs.findById.resolves(inputRepoDraft);
        incentiveRepository.stubs.findById.resolves(mockIncentive);
        subscriptionRepository.stubs.updateById.rejects('Error');
        await controller.finalizeSubscription('randomInputId');
      } catch (err) {
        expect(err.name).to.equal('Error');
      }
    });

    it('SubscriptionV1Controller finalizeSubscription - Automatic Mode : validate', async () => {
      subscriptionRepository.stubs.findById.resolves(subscriptionDraft);
      incentiveRepository.stubs.findById.resolves(mockIncentiveAutomaticControl);
      incentiveChecksRepository.stubs.find.resolves(
        incentiveEligibilityChecks as IncentiveEligibilityChecks[],
      );

      subscptionService.stubs.checkFranceConnectIdentity.resolves(true);
      subscptionService.stubs.checkCEEValidity.resolves({
        status: 'success',
        code: 201,
        data: {
          uuid: 'id',
          datetime: '2022-12-05T00:00:00.000Z',
          token: 'token',
        },
      });
      subscptionService.stubs.validateSubscription.resolves();

      const result = await controller.finalizeSubscription('randomInputId');
      expect(result).to.containEql({
        id: 'randomInputId',
        status: SUBSCRIPTION_STATUS.VALIDATED,
      });
    });

    it('SubscriptionV1Controller finalizeSubscription - Automatic Mode : reject first control', async () => {
      subscriptionRepository.stubs.findById.resolves(subscriptionDraft);
      incentiveRepository.stubs.findById.resolves(mockIncentiveAutomaticControl);
      incentiveChecksRepository.stubs.find.resolves(
        incentiveEligibilityChecks as IncentiveEligibilityChecks[],
      );

      subscptionService.stubs.checkFranceConnectIdentity.resolves(false);
      subscptionService.stubs.rejectSubscription.resolves();

      const result = await controller.finalizeSubscription('randomInputId');
      expect(result).to.containEql({
        id: 'randomInputId',
        status: SUBSCRIPTION_STATUS.REJECTED,
        rejectionReason: REJECTION_REASON.NOT_FRANCECONNECT,
      });
    });

    it('SubscriptionV1Controller finalizeSubscription - Automatic Mode\
     Timestamp On : reject second control', async () => {
      subscriptionRepository.stubs.findById.resolves(subscriptionDraft);
      incentiveRepository.stubs.findById.resolves(mockIncentiveAutomaticTimestamp);
      incentiveChecksRepository.stubs.find.resolves(
        incentiveEligibilityChecks as IncentiveEligibilityChecks[],
      );

      subscptionService.stubs.checkFranceConnectIdentity.resolves(true);
      subscptionService.stubs.checkCEEValidity.resolves({
        status: 'error',
        code: 404,
        message: 'Not Found',
      });
      subscptionService.stubs.rejectSubscription.resolves();
      subscptionService.stubs.createSubscriptionTimestamp.resolves();

      const result = await controller.finalizeSubscription('randomInputId');
      expect(result).to.containEql({
        id: 'randomInputId',
        status: SUBSCRIPTION_STATUS.REJECTED,
        rejectionReason: REJECTION_REASON.INVALID_RPC_CEE_REQUEST,
        comment: 'HTTP 404 - Not Found',
      });
    });

    // get subscription TU
    it('get(v1/maas/subscriptions)', async () => {
      subscriptionRepository.stubs.find.resolves([newSubscription]);
      incentiveRepository.stubs.find.resolves([mockIncentive]);
      const result = await controller.findMaasSubscription();
      expect(result).to.deepEqual([mockSubscription]);
    });
  });

  function givenStubbedRepository() {
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    collectivityRepository = createStubInstance(CollectivityRepository);
    incentiveRepository = createStubInstance(IncentiveRepository);
    citizenService = createStubInstance(CitizenService);
    metadataRepository = createStubInstance(MetadataRepository);
    enterpriseRepository = createStubInstance(EnterpriseRepository);
    communityRepository = createStubInstance(CommunityRepository);
    incentiveChecksRepository = createStubInstance(IncentiveEligibilityChecksRepository);
    rabbitmqService = createStubInstance(RabbitmqService);
    s3Service = createStubInstance(S3Service);
    mailService = createStubInstance(MailService);
    subscptionService = createStubInstance(SubscriptionService);
  }
});

const mockIncentive = new Incentive({
  id: 'incentiveId',
  title: 'incentiveTitle',
  transportList: ['velo'],
  contact: 'Contactez le numéro vert au 05 206 308',
  subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.MANUAL,
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

const mockSubscription = {
  id: '619e3ff38dd34e1774b60789',
  incentiveId: 'incentiveId',
  funderName: 'Rabat',
  incentiveTitle: "Bonus Ecologique pour l'achat d'un vélo électrique",
  status: SUBSCRIPTION_STATUS.VALIDATED,
  createdAt: new Date('2021-11-24T13:36:51.423Z'),
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  contact: 'Contactez le numéro vert au 05 206 308',
  funderId: 'funderId',
};

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

const mockCollectivity = new Collectivity({
  id: '2b6ee373-4c5b-403b-afe5-3bf3cbd2473',
  encryptionKey: mockencryptionKeyValid,
});

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
    description:
      "Les données d'identité doivent être fournies/certifiées par FranceConnect",
    type: 'boolean',
    motifRejet: 'CompteNonFranceConnect',
  },
  {
    id: 'uuid3',
    name: 'Demande CEE au RPC',
    label: 'RPCCEERequest',
    description:
      '1 seule demande par dispositif CEE, enregistrée dans le Registre de Preuve de Covoiturage',
    type: 'boolean',
    motifRejet: 'RPCCEEDemandeInvalide',
  },
];

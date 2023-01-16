import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {
  AffiliationRepository,
  CommunityRepository,
  EnterpriseRepository,
  IncentiveRepository,
  MetadataRepository,
  SubscriptionRepository,
  UserRepository,
  SubscriptionTimestampRepository,
  UserEntityRepository,
} from '../../repositories';
import {SubscriptionController} from '../../controllers';
import {
  Subscription,
  Community,
  User,
  Metadata,
  AttachmentMetadata,
  Citizen,
  ValidationSinglePayment,
  CommonRejection,
  OtherReason,
} from '../../models';
import {
  S3Service,
  SubscriptionService,
  FunderService,
  MailService,
  KeycloakService,
  CitizenService,
} from '../../services';
import {ValidationError} from '../../validationError';
import {
  CITIZEN_STATUS,
  INCENTIVE_TYPE,
  IUser,
  REJECTION_REASON,
  ResourceName,
  StatusCode,
  SUBSCRIPTION_STATUS,
} from '../../utils';

describe('SubscriptionController', () => {
  let s3Service: StubbedInstanceWithSinonAccessor<S3Service>,
    subscriptionService: SubscriptionService,
    controller: SubscriptionController,
    funderService: StubbedInstanceWithSinonAccessor<FunderService>,
    communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>,
    subscriptionTimestampRepository: StubbedInstanceWithSinonAccessor<SubscriptionTimestampRepository>,
    userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    metadataRepository: StubbedInstanceWithSinonAccessor<MetadataRepository>,
    enterpriseRepository: StubbedInstanceWithSinonAccessor<EnterpriseRepository>,
    affiliationRepository: StubbedInstanceWithSinonAccessor<AffiliationRepository>,
    incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    mailService: MailService,
    keycloakService: KeycloakService,
    citizenService: StubbedInstanceWithSinonAccessor<CitizenService>,
    userEntityRepository: StubbedInstanceWithSinonAccessor<UserEntityRepository>,
    spy: any,
    input: any,
    input1: any,
    input2: any;

  const response: any = {
    status: function () {
      return this;
    },
    contentType: function () {
      return this;
    },
    send: (body: any) => body,
  };

  beforeEach(() => {
    givenStubbedRepository();
    givenStubbedService();
    subscriptionService = new SubscriptionService(
      s3Service,
      subscriptionRepository,
      subscriptionTimestampRepository,
      communityRepository,
      enterpriseRepository,
      affiliationRepository,
      userEntityRepository,
      mailService,
      citizenService,
      keycloakService,
      incentiveRepository,
    );
    spy = sinon.spy(subscriptionService);
    controller = new SubscriptionController(
      subscriptionRepository,
      s3Service,
      spy,
      funderService,
      communityRepository,
      metadataRepository,
      userRepository,
      currentUser,
      response,
      mailService,
    );
    input = {...initInput};
    input1 = {...initInput1};
    input2 = {...initInput2};
  });

  it('SubscriptionController find : successful', async () => {
    subscriptionRepository.stubs.find.resolves([input]);
    userRepository.stubs.findOne.resolves(user);
    funderService.stubs.getFunderByName.resolves({
      name: 'funderName',
      funderType: 'entreprise',
      id: 'random',
    });
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
    funderService.stubs.getFunderByName.resolves({
      name: 'funderName',
      funderType: 'entreprise',
      id: 'random',
    });
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
    funderService.stubs.getFunderByName.resolves({
      name: 'funderName',
      funderType: 'entreprise',
      id: 'random',
    });
    try {
      await controller.find('A_TRAITER', 'incentiveId', 'idCommunity', 'lastName');
    } catch (err) {
      expect(err).to.deepEqual(mismatchCommunityError);
    }
  });

  it('SubscriptionController findById : successful', async () => {
    subscriptionRepository.stubs.findById.resolves(input);
    const result = await controller.findById('someRandomId');

    expect(result).to.deepEqual(input);
  });

  it('SubscriptionController validate : error', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId1').resolves(input1);
    // Invokes business
    try {
      await controller.validate('randomInputId1', {
        mode: 'unique',
        amount: 1,
      } as ValidationSinglePayment);
      sinon.assert.fail();
    } catch (error) {
      // Checks
      expect(subscriptionRepository.stubs.updateById.notCalled).true();
      expect(spy.checkPayment.calledOnce).false();
      expect(error.message).to.equal(expectedError.message);
      expect(error.path).to.equal(expectedError.path);
    }
  });

  it('SubscriptionController validate with funderType=Enterprise : successful', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId').resolves(input);
    citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);

    incentiveRepository.stubs.findById.resolves(input);
    // Invokes business
    const payment = {
      mode: 'unique',
      amount: 1,
    } as ValidationSinglePayment;
    const result = await controller.validate('randomInputId', payment);
    // Checks
    expect(input.status).equal(SUBSCRIPTION_STATUS.VALIDATED);
    expect(input.subscriptionValidation).deepEqual(payment);
    expect(result).to.Null;
  });

  it('SubscriptionController validate with funderType=Collectivity : successful', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId').resolves(input2);
    incentiveRepository.stubs.findById.resolves(input);
    // Invokes business
    const payment = {
      mode: 'unique',
      amount: 1,
    } as ValidationSinglePayment;
    const result = await controller.validate('randomInputId', payment);
    // Checks
    expect(input2.status).equal(SUBSCRIPTION_STATUS.VALIDATED);
    expect(input2.subscriptionValidation).deepEqual(payment);
    expect(result).to.Null;
  });

  it('SubscriptionController reject : error', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId1').resolves(input1);
    // Invokes business

    try {
      await controller.reject('randomInputId1', {
        type: 'ConditionsNonRespectees',
      } as CommonRejection);
      sinon.assert.fail();
    } catch (error) {
      // Checks
      expect(subscriptionRepository.stubs.updateById.notCalled).true();
      expect(spy.checkRefusMotif.calledOnce).false();
      expect(error.message).to.equal(expectedError.message);
    }
  });

  it('SubscriptionController reject with funder=Enterprise && reason=Condition : successful', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId').resolves(input);
    citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);

    incentiveRepository.stubs.findById.resolves(input);
    // Invokes business
    const reason = {
      type: REJECTION_REASON.CONDITION,
    } as CommonRejection;
    const result = await controller.reject('randomInputId', reason);
    // Checks
    expect(input.status).equal(SUBSCRIPTION_STATUS.REJECTED);
    expect(input.subscriptionRejection).deepEqual(reason);
    expect(input.specificFields).to.Null;
    expect(input.attachments).to.Null;
    expect(result).to.Null;
  });

  it('SubscriptionController reject with funder=Collectivity && invalid proof : successful', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId').resolves(input2);
    incentiveRepository.stubs.findById.resolves(input);
    // Invokes business
    const reason = {
      type: REJECTION_REASON.INVALID_PROOF,
    } as CommonRejection;
    const result = await controller.reject('randomInputId', reason);
    // Checks
    expect(input2.status).equal(SUBSCRIPTION_STATUS.REJECTED);
    expect(input2.subscriptionRejection).deepEqual(reason);
    expect(input2.specificFields).to.Null;
    expect(input2.attachments).to.Null;
    expect(result).to.Null;
  });

  it('SubscriptionController reject with rejectionReason=Missing proof : successful', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId').resolves(input2);
    incentiveRepository.stubs.findById.resolves(input);
    // Invokes business
    const reason = {
      type: REJECTION_REASON.MISSING_PROOF,
    } as CommonRejection;
    const result = await controller.reject('randomInputId', reason);
    // Checks
    expect(input2.status).equal(SUBSCRIPTION_STATUS.REJECTED);
    expect(input2.subscriptionRejection).deepEqual(reason);
    expect(input2.specificFields).to.Null;
    expect(input2.attachments).to.Null;
    expect(result).to.Null;
  });

  it('SubscriptionController reject with rejectionReason=Other : successful', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId').resolves(input2);
    incentiveRepository.stubs.findById.resolves(input);
    // Invokes business
    const reason = {
      type: REJECTION_REASON.OTHER,
      other: 'Other',
    } as OtherReason;
    const result = await controller.reject('randomInputId', reason);
    // Checks
    expect(input2.status).equal(SUBSCRIPTION_STATUS.REJECTED);
    expect(input2.subscriptionRejection).deepEqual(reason);
    expect(input2.specificFields).to.Null;
    expect(input2.attachments).to.Null;
    expect(result).to.Null;
  });

  it('SubscriptionController getSubscriptionFileByName : successful', async () => {
    // Stub method
    subscriptionRepository.stubs.findById.withArgs('randomInputId').resolves(input);
    s3Service.stubs.downloadFileBuffer.resolves({});

    const result = await controller.getSubscriptionFileByName(
      'randomInputId',
      'helloworld.jpg',
    );

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

  it('SubscriptionController subscriptions/export : error', async () => {
    // Stub method
    try {
      userRepository.stubs.findOne.resolves(user);
      subscriptionRepository.stubs.find.resolves([]);
      const response: any = {};
      await controller.generateExcel(response);
    } catch (error) {
      expect(error).to.deepEqual(downloadError);
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

  it('SubscriptionV1Controller createMetadata : successful', async () => {
    metadataRepository.stubs.create.resolves(new Metadata({id: 'randomMetadataId'}));
    const result: any = await controller.createMetadata(mockMetadata);
    expect(result.metadataId).to.equal('randomMetadataId');
  });

  it('SubscriptionV1Controller createMetadata : error', async () => {
    try {
      metadataRepository.stubs.create.rejects('Error');
      await controller.createMetadata(mockMetadata);
    } catch (err) {
      expect(err.name).to.equal('Error');
    }
  });

  it('SubscriptionController updateById : success', async () => {
    subscriptionRepository.stubs.findById
      .withArgs('id')
      .resolves(new Subscription({id: 'id', specificFields: {TextField: 'toto'}}));
    subscriptionRepository.stubs.updateById.resolves();
    await controller.updateById('id', {TextField: 'text', DateField: '02/06/2022'});
  });

  function givenStubbedRepository() {
    communityRepository = createStubInstance(CommunityRepository);
    userRepository = createStubInstance(UserRepository);
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    metadataRepository = createStubInstance(MetadataRepository);
    affiliationRepository = createStubInstance(AffiliationRepository);
    incentiveRepository = createStubInstance(IncentiveRepository);
  }

  function givenStubbedService() {
    s3Service = createStubInstance(S3Service);
    funderService = createStubInstance(FunderService);
    citizenService = createStubInstance(CitizenService);
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

const initInput2 = new Subscription({
  id: 'randomInputId1',
  incentiveId: 'incentiveId',
  funderName: 'funderName',
  incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
  incentiveTitle: 'incentiveTitle',
  citizenId: 'email@gmail.com',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  consent: true,
  incentiveTransportList: ['velo'],
  status: SUBSCRIPTION_STATUS.TO_PROCESS,
  createdAt: new Date('2021-04-06T09:01:30.778Z'),
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
});

const citizen = Object.assign(new Citizen(), {
  id: 'email@gmail.com',
  lastName: 'lastName',
  firstName: 'firstName',
  email: 'email@gmail.com',
  city: 'test',
  status: CITIZEN_STATUS.EMPLOYEE,
  birthdate: '1991-11-17',
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: {
    enterpriseId: 'enterpriseId',
    enterpriseEmail: 'email1@gmail.com',
  },
  getId: () => {},
  getIdObject: () => ({id: 'random'}),
  toJSON: () => ({id: 'random'}),
  toObject: () => ({id: 'random'}),
});

const expectedError = new ValidationError(
  'subscriptions.error.bad.status',
  '/subscriptionBadStatus',
  StatusCode.UnprocessableEntity,
);

const mismatchCommunityError = new ValidationError(
  `subscriptions.error.communities.mismatch`,
  `/subscriptions`,
  StatusCode.UnprocessableEntity,
  ResourceName.Subscription,
);

const downloadError = new ValidationError(
  'Aucune demande validée à télécharger',
  '/downloadXlsx',
  StatusCode.UnprocessableEntity,
  ResourceName.Subscription,
);

const currentUser: IUser = {
  id: 'idUser',
  emailVerified: true,
  maas: undefined,
  membership: ['/entreprises/Capgemini'],
  roles: ['gestionnaires'],
  [securityId]: 'idEnterprise',
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

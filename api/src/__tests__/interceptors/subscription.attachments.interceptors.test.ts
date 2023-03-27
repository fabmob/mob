import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {Readable} from 'stream';

import {Subscription, AttachmentType, Metadata, EncryptionKey, PrivateKeyAccess, Funder} from '../../models';
import {SubscriptionRepository, MetadataRepository, FunderRepository} from '../../repositories';
import {ClamavService, S3Service} from '../../services';
import {IUser, StatusCode, SUBSCRIPTION_STATUS} from '../../utils';
import {SubscriptionAttachmentsInterceptor} from '../../interceptors';

describe('Subscription attachments Interceptor', () => {
  let interceptor: any = null;
  let subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    currentUserProfile: IUser,
    clamavService: StubbedInstanceWithSinonAccessor<ClamavService>,
    metadataRepository: StubbedInstanceWithSinonAccessor<MetadataRepository>,
    funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>;
  const s3 = new S3Service();

  const inputSubscription = new Subscription({
    id: 'idSubscription',
    citizenId: 'citizenId',
    status: SUBSCRIPTION_STATUS.DRAFT,
  });

  const inputSubscriptionWithFiles = new Subscription({
    id: 'idSubscription',
    citizenId: 'citizenId',
    status: SUBSCRIPTION_STATUS.DRAFT,
    attachments: [{} as AttachmentType],
  });

  const inputSubscriptionWrongIncentiveId = new Subscription({
    id: 'idSubscription',
    citizenId: 'citizenId',
    incentiveId: 'incentiveId',
    status: SUBSCRIPTION_STATUS.DRAFT,
  });

  const inputSubscriptionNotDraft = new Subscription({
    id: 'idSubscription',
    citizenId: 'citizenId',
    status: SUBSCRIPTION_STATUS.VALIDATED,
  });

  const inputSubscriptionFail = new Subscription({
    id: 'idSubscription',
    citizenId: 'citizenId2',
    status: SUBSCRIPTION_STATUS.DRAFT,
  });

  beforeEach(() => {
    givenStubbedRepository();
    interceptor = new SubscriptionAttachmentsInterceptor(
      s3,
      subscriptionRepository,
      metadataRepository,
      funderRepository,
      currentUserProfile,
      clamavService,
    );
  });

  it('SubscriptionInterceptor args: error Subscription does not exists', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(undefined);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err.message).to.equal('Subscription does not exist');
      expect(err.statusCode).to.equal(StatusCode.NotFound);
    }
  });

  it('SubscriptionInterceptor args: error User id fail : error', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(inputSubscriptionFail);
      await interceptor.intercept(invocationContextUserIdError);
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('SubscriptionInterceptor args: error subscription not DRAFT', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(inputSubscriptionNotDraft);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err.message).to.equal('subscriptions.error.bad.status');
      expect(err.statusCode).to.equal(StatusCode.Conflict);
    }
  });

  it('SubscriptionInterceptor args: error one file to upload', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(inputSubscription);
      funderRepository.stubs.findById.resolves(mockCollectivity);
      await interceptor.intercept(invocationContextArgsNoFileError);
    } catch (err) {
      expect(err.message).to.equal('You need the provide at least one file or valid metadata');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('SubscriptionInterceptor args: error already files in db', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(inputSubscriptionWithFiles);
      metadataRepository.stubs.findById.resolves();
      funderRepository.stubs.findById.resolves(mockCollectivity);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err.message).to.equal('You already provided files to this subscription');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('SubscriptionInterceptor args: error metadata does not match', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(inputSubscriptionWrongIncentiveId);
      metadataRepository.stubs.findById.resolves(new Metadata({incentiveId: 'errorincentiveId'}));
      funderRepository.stubs.findById.resolves(mockCollectivity);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err.message).to.equal('Metadata does not match this subscription');
      expect(err.statusCode).to.equal(StatusCode.Conflict);
    }
  });

  it('SubscriptionInterceptor args: error nb of file', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(inputSubscription);
      funderRepository.stubs.findById.resolves(mockCollectivity);
      await interceptor.intercept(invocationContextArgsNbFileError);
    } catch (err) {
      expect(err.message).to.equal('Too many files to upload');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('SubscriptionInterceptor args: error file mime type', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(inputSubscription);
      funderRepository.stubs.findById.resolves(mockCollectivity);
      await interceptor.intercept(invocationContextArgsMimeTypeError);
    } catch (err) {
      expect(err.message).to.equal('Uploaded files do not have valid content type');
      expect(err.statusCode).to.equal(StatusCode.UnsupportedMediaType);
    }
  });

  it('SubscriptionInterceptor args: error file size', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(inputSubscription);
      funderRepository.stubs.findById.resolves(mockCollectivity);
      await interceptor.intercept(invocationContextArgsFileSizeError);
    } catch (err) {
      expect(err.message).to.equal('Uploaded files do not have a valid file size');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('SubscriptionInterceptor args: error corrupted file', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(inputSubscription);
      metadataRepository.stubs.findById.resolves();
      clamavService.stubs.checkCorruptedFiles.resolves(false);
      funderRepository.stubs.findById.resolves(mockCollectivity);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err.message).to.equal('A corrupted file has been found');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('SubscriptionInterceptor : error when funder not found', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(inputSubscription);
      funderRepository.stubs.findById.resolves(undefined);
      await interceptor.intercept(invocationContextArgsOK);
      sinon.assert.fail();
    } catch (err) {
      expect(err.message).to.equal('Funder not found');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('SubscriptionInterceptor : error when Encryption Key not found', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(inputSubscription);
      funderRepository.stubs.findById.resolves(mockCollectivityWithoutEncryptionKey);
      await interceptor.intercept(invocationContextArgsOK);
      sinon.assert.fail();
    } catch (err) {
      expect(err.message).to.equal('Encryption Key not found');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('SubscriptionInterceptor : error when Encryption Key expired', async () => {
    try {
      subscriptionRepository.stubs.findOne.resolves(inputSubscription);
      funderRepository.stubs.findById.resolves(mockCollectivityEncryptionKeyExpired);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err.message).to.equal('Encryption Key Expired');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('SubscriptionInterceptor args: success', async () => {
    subscriptionRepository.stubs.findOne.resolves(inputSubscription);
    metadataRepository.stubs.findById.resolves();
    clamavService.stubs.checkCorruptedFiles.resolves(true);
    funderRepository.stubs.findById.resolves(mockCollectivity);
    await interceptor.intercept(invocationContextArgsOK, () => {});
  });

  it('SubscriptionInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });

  function givenStubbedRepository() {
    metadataRepository = createStubInstance(MetadataRepository);
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    funderRepository = createStubInstance(FunderRepository);
    clamavService = createStubInstance(ClamavService);
    currentUserProfile = {
      id: 'citizenId',
      clientName: 'testName-client',
      emailVerified: true,
      [securityId]: 'citizenId',
    };
  }
});

const file: any = {
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
};

const fileListNbFileError: any[] = [file, file, file, file, file, file, file, file, file, file, file];

const fileListMimeTypeError: any[] = [
  {
    originalname: 'test1.txt',
    buffer: Buffer.from('test de buffer'),
    mimetype: 'image/exe',
    fieldname: 'test',
    size: 4000,
    encoding: '7bit',
    stream: new Readable(),
    destination: 'string',
    filename: 'fileName',
    path: 'test',
  },
];

const fileListFileSizeError: any[] = [
  {
    originalname: 'test1.txt',
    buffer: Buffer.from('test de buffer'),
    mimetype: 'image/png',
    fieldname: 'test',
    size: 12000000,
    encoding: '7bit',
    stream: new Readable(),
    destination: 'string',
    filename: 'fileName',
    path: 'test',
  },
];

const invocationContextArgsMimeTypeError = {
  target: {},
  methodName: 'addFiles',
  args: [
    'idSubscription1',
    {
      files: fileListMimeTypeError,
      body: {
        data: '',
      },
    },
  ],
};

const invocationContextUserIdError = {
  target: {},
  methodName: 'addFiles',
  args: [
    'idSubscription1',
    {
      files: [file],
    },
  ],
};
const invocationContextArgsNoFileError = {
  target: {},
  methodName: 'addFiles',
  args: [
    'idSubscription',
    {
      body: {
        data: '',
      },
    },
  ],
};

const invocationContextArgsFileSizeError = {
  target: {},
  methodName: 'addFiles',
  args: [
    'idSubscription',
    {
      files: fileListFileSizeError,
      body: {
        data: '',
      },
    },
  ],
};

const invocationContextArgsNbFileError = {
  target: {},
  methodName: 'addFiles',
  args: [
    'idSubscription',
    {
      files: fileListNbFileError,
      body: {
        data: '',
      },
    },
  ],
};

const invocationContextArgsOK = {
  target: {},
  methodName: 'addFiles',
  args: [
    'idSubscription',
    {
      files: [file],
      body: {
        data: '{\r\n  "metadataId": "metadataId"\r\n}',
      },
    },
  ],
};

const today = new Date();
const expirationDate = new Date(today.setMonth(today.getMonth() + 3));

const mockencryptionKeyValid = new EncryptionKey({
  id: '62977dc80929474f84c403de',
  version: 1,
  publicKey: 'publicKey',
  expirationDate,
  lastUpdateDate: new Date(),
  privateKeyAccess: new PrivateKeyAccess({
    loginURL: 'loginURL',
    getKeyURL: 'getKeyURL',
  }),
});

const mockencryptionKeyExpired = new EncryptionKey({
  id: '62977dc80929474f84c403de',
  version: 1,
  publicKey: 'publicKey',
  expirationDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
  lastUpdateDate: new Date(),
  privateKeyAccess: new PrivateKeyAccess({
    loginURL: 'loginURL',
    getKeyURL: 'getKeyURL',
  }),
});

const mockCollectivity = new Funder({
  id: 'randomInputIdCollectivity',
  name: 'nameCollectivity',
  citizensCount: 10,
  mobilityBudget: 12,
  encryptionKey: mockencryptionKeyValid,
});

const mockCollectivityEncryptionKeyExpired = new Funder({
  id: 'randomInputIdCollectivity',
  name: 'nameCollectivity',
  citizensCount: 10,
  mobilityBudget: 12,
  encryptionKey: mockencryptionKeyExpired,
});

const mockCollectivityWithoutEncryptionKey = new Funder({
  id: 'randomInputIdCollectivity',
  name: 'nameCollectivity',
  citizensCount: 10,
  mobilityBudget: 12,
});

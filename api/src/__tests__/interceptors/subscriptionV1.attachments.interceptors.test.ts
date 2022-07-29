import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {Readable} from 'stream';

import {Subscription, AttachmentType, Metadata} from '../../models';
import {ValidationError} from '../../validationError';
import {SubscriptionRepository, MetadataRepository} from '../../repositories';
import {ClamavService, S3Service, IUser} from '../../services';
import {ResourceName, StatusCode, SUBSCRIPTION_STATUS} from '../../utils';
import {SubscriptionV1AttachmentsInterceptor} from '../../interceptors';

describe('SubscriptionV1 attachments Interceptor', () => {
  let interceptor: any = null;
  let subscriptionRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    currentUserProfile: IUser,
    clamavService: StubbedInstanceWithSinonAccessor<ClamavService>,
    metadataRepository: StubbedInstanceWithSinonAccessor<MetadataRepository>;
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
    interceptor = new SubscriptionV1AttachmentsInterceptor(
      s3,
      subscriptionRepository,
      metadataRepository,
      currentUserProfile,
      clamavService,
    );
  });

  it('SubscriptionV1Interceptor args: error Subscription does not exists', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(undefined);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err).to.deepEqual(errorSubscriptionDoesnotExist);
    }
  });

  it('SubscriptionV1Interceptor args: error User id fail : error', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputSubscriptionFail);
      await interceptor.intercept(invocationContextUserIdError);
    } catch (err) {
      expect(err.message).to.equal(errorStatusUser.message);
    }
  });

  it('SubscriptionV1Interceptor args: error subscription not DRAFT', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputSubscriptionNotDraft);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err).to.deepEqual(errorStatus);
    }
  });

  it('SubscriptionV1Interceptor args: error one file to upload', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputSubscription);
      await interceptor.intercept(invocationContextArgsNoFileError);
    } catch (err) {
      expect(err.message).to.equal(errorNoFile.message);
    }
  });

  it('SubscriptionV1Interceptor args: error already files in db', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputSubscriptionWithFiles);
      metadataRepository.stubs.findById.resolves();
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err.message).to.equal(errorAlreadyFiles.message);
    }
  });

  it('SubscriptionV1Interceptor args: error metadata does not match', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputSubscriptionWrongIncentiveId);
      metadataRepository.stubs.findById.resolves(
        new Metadata({incentiveId: 'errorincentiveId'}),
      );
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err.message).to.equal(errorMismatchincentiveId.message);
    }
  });

  it('SubscriptionV1Interceptor args: error nb of file', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputSubscription);
      await interceptor.intercept(invocationContextArgsNbFileError);
    } catch (err) {
      expect(err).to.deepEqual(errorNbFile);
    }
  });

  it('SubscriptionV1Interceptor args: error file mime type', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputSubscription);
      await interceptor.intercept(invocationContextArgsMimeTypeError);
    } catch (err) {
      expect(err).to.deepEqual(errorMimeType);
    }
  });

  it('SubscriptionV1Interceptor args: error file size', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputSubscription);
      interceptor.intercept(invocationContextArgsFileSizeError);
    } catch (err) {
      expect(err.message).to.equal(errorFileSize.message);
    }
  });

  it('SubscriptionV1Interceptor args: error corrupted file', async () => {
    try {
      subscriptionRepository.stubs.findById.resolves(inputSubscription);
      metadataRepository.stubs.findById.resolves();
      clamavService.stubs.checkCorruptedFiles.resolves(false);
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err.message).to.equal(errorCorrepted.message);
    }
  });

  it('SubscriptionV1Interceptor args: success', async () => {
    subscriptionRepository.stubs.findById.resolves(inputSubscription);
    metadataRepository.stubs.findById.resolves();
    clamavService.stubs.checkCorruptedFiles.resolves(true);
    await interceptor.intercept(invocationContextArgsOK, () => {});
  });

  it('SubscriptionV1Interceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });

  function givenStubbedRepository() {
    metadataRepository = createStubInstance(MetadataRepository);
    subscriptionRepository = createStubInstance(SubscriptionRepository);
    clamavService = createStubInstance(ClamavService);
    currentUserProfile = {
      id: 'citizenId',
      clientName: 'testName-client',
      emailVerified: true,
      [securityId]: 'citizenId',
    };
  }
});

const errorSubscriptionDoesnotExist: any = new ValidationError(
  'Subscription does not exist',
  '/subscription',
  StatusCode.NotFound,
  ResourceName.Subscription,
);

const errorStatus: any = new ValidationError(
  `Only subscriptions with Draft status are allowed`,
  '/status',
  StatusCode.PreconditionFailed,
  ResourceName.Subscription,
);

const errorMimeType: any = new ValidationError(
  `Uploaded files do not have valid content type`,
  '/attachments',
  StatusCode.PreconditionFailed,
  ResourceName.AttachmentsType,
);

const errorFileSize: any = new ValidationError(
  `Uploaded files do not have a valid file size`,
  '/attachments',
);

const errorNoFile: any = new ValidationError(
  `You need the provide at least one file or valid metadata`,
  '/attachments',
);

const errorAlreadyFiles: any = new ValidationError(
  `You already provided files to this subscription`,
  '/attachments',
);

const errorCorrepted: any = new ValidationError(
  'A corrupted file has been found',
  '/antivirus',
);
const errorStatusUser: any = new ValidationError('Access denied', '/authorization');

const errorNbFile: any = new ValidationError(
  `Too many files to upload`,
  '/attachments',
  StatusCode.UnprocessableEntity,
  ResourceName.Attachments,
);

const errorMismatchincentiveId: any = new ValidationError(
  `Metadata does not match this subscription`,
  '/attachments',
  StatusCode.UnprocessableEntity,
  ResourceName.Attachments,
);

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

const fileListNbFileError: any[] = [
  file,
  file,
  file,
  file,
  file,
  file,
  file,
  file,
  file,
  file,
  file,
];

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

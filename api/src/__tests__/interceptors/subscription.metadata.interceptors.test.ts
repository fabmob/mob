import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {ValidationError} from '../../validationError';
import {IncentiveRepository, MetadataRepository} from '../../repositories';
import {IUser} from '../../services';
import {ResourceName, StatusCode} from '../../utils';
import {SubscriptionMetadataInterceptor} from '../../interceptors';
import {Incentive, Metadata} from '../../models';

describe('SubscriptionV1 metadata Interceptor', () => {
  let interceptor: any = null;
  let metadataRepository: StubbedInstanceWithSinonAccessor<MetadataRepository>,
    incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    currentUserProfile: IUser;

  beforeEach(() => {
    givenStubbedRepository();
    interceptor = new SubscriptionMetadataInterceptor(
      incentiveRepository,
      metadataRepository,
      currentUserProfile,
    );
  });

  it('SubscriptionMetadataInterceptor args: error incentive isMCMStaff false', async () => {
    try {
      incentiveRepository.stubs.findById.resolves(new Incentive({isMCMStaff: false}));
      await interceptor.intercept(invocationContextArgsOK);
    } catch (err) {
      expect(err).to.deepEqual(errorNotMCMStaff);
    }
  });

  it('SubscriptionMetadataInterceptor args: error products length === 0', async () => {
    try {
      incentiveRepository.stubs.findById.resolves(new Incentive({isMCMStaff: true}));
      await interceptor.intercept(invocationContextArgsKOProducts);
    } catch (err) {
      expect(err).to.deepEqual(errorMetadataInvoicesOrProductsLength);
    }
  });

  it('SubscriptionMetadataInterceptor args: error invoices length !== totalElements', async () => {
    try {
      incentiveRepository.stubs.findById.resolves(new Incentive({isMCMStaff: true}));
      await interceptor.intercept(invocationContextArgsKOInvoicesTotalElements);
    } catch (err) {
      expect(err).to.deepEqual(errorMetadataInvoicesTotalElements);
    }
  });

  it('SubscriptionMetadataInterceptor args: getMetadata user id not matches error', async () => {
    try {
      metadataRepository.stubs.findOne.resolves(
        new Metadata({citizenId: 'citizenIdError'}),
      );
      await interceptor.intercept(invocationContextArgsGetOK);
    } catch (err) {
      expect(err.message).to.equal(errorMetadataNotHis.message);
    }
  });

  it('SubscriptionMetadataInterceptor args: success', async () => {
    incentiveRepository.stubs.findById.resolves(new Incentive({isMCMStaff: true}));
    metadataRepository.stubs.findOne.resolves(null);
    await interceptor.intercept(invocationContextArgsOK, () => {});
  });

  it('SubscriptionMetadataInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });

  it('SubscriptionMetadataInterceptor getMetadata: metadata not found', async () => {
    try {
      metadataRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationCtxGetMetadata, () => {});
    } catch (err) {
      expect(err).to.deepEqual(errorNotFound);
    }
    incentiveRepository.stubs.findOne.restore();
  });

  function givenStubbedRepository() {
    incentiveRepository = createStubInstance(IncentiveRepository);
    metadataRepository = createStubInstance(MetadataRepository);
    currentUserProfile = {
      id: 'citizenId',
      clientName: 'testName-client',
      emailVerified: true,
      [securityId]: 'citizenId',
    };
  }
});

const errorNotMCMStaff: any = new ValidationError(
  'Access denied',
  '/authorization',
  StatusCode.Forbidden,
);

const errorMetadataInvoicesOrProductsLength: any = new ValidationError(
  `Metadata invoices or products length invalid`,
  '/metadata',
  StatusCode.UnprocessableEntity,
  ResourceName.Metadata,
);

const errorMetadataInvoicesTotalElements: any = new ValidationError(
  `Metadata invoices length must be equal to totalElements`,
  '/metadata',
  StatusCode.UnprocessableEntity,
  ResourceName.Metadata,
);

const errorMetadataNotHis: any = new ValidationError(
  'Access denied',
  '/authorization',
  StatusCode.Forbidden,
);

const errorNotFound = new ValidationError(
  `Metadata not found`,
  '/metadataNotFound',
  StatusCode.NotFound,
  ResourceName.Metadata,
);

const invocationCtxGetMetadata = {
  methodName: 'getMetadata',
  args: ['606c236a624cec2becdef277'],
};

const invocationContextArgsOK = {
  target: {},
  methodName: 'createMetadata',
  args: [
    {
      incentiveId: 'incentiveId',
      attachmentMetadata: {
        invoices: [{products: [{}]}],
        totalElements: 1,
      },
    },
  ],
};

const invocationContextArgsGetOK = {
  target: {},
  methodName: 'getMetadata',
  args: [
    {
      metadataId: 'idMetadata',
    },
  ],
};

const invocationContextArgsKOProducts = {
  target: {},
  methodName: 'createMetadata',
  args: [
    {
      incentiveId: 'incentiveId',
      attachmentMetadata: {
        invoices: [{products: []}],
        totalElements: 3,
      },
    },
  ],
};

const invocationContextArgsKOInvoicesTotalElements = {
  target: {},
  methodName: 'createMetadata',
  args: [
    {
      incentiveId: 'incentiveId',
      attachmentMetadata: {
        invoices: [{products: [{}]}],
        totalElements: 3,
      },
    },
  ],
};

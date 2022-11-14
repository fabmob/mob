import {
  inject,
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  service,
  ValueOrPromise,
} from '@loopback/core';
import {repository} from '@loopback/repository';
import {SecurityBindings} from '@loopback/security';

import {Express} from 'express';
import {EncryptionKey} from '../../models';

import {
  SubscriptionRepository,
  MetadataRepository,
  EnterpriseRepository,
  CollectivityRepository,
} from '../../repositories';
import {ClamavService, S3Service} from '../../services';
import {
  ResourceName,
  StatusCode,
  canAccessHisSubscriptionData,
  SUBSCRIPTION_STATUS,
  IUser,
} from '../../utils';
import {isExpired} from '../../utils/date';
import {ValidationError} from '../../validationError';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@injectable({tags: {key: SubscriptionV1AttachmentsInterceptor.BINDING_KEY}})
export class SubscriptionV1AttachmentsInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${SubscriptionV1AttachmentsInterceptor.name}`;

  constructor(
    @inject('services.S3Service')
    private s3Service: S3Service,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @repository(MetadataRepository)
    public metadataRepository: MetadataRepository,
    @repository(EnterpriseRepository)
    public enterpriseRepository: EnterpriseRepository,
    @repository(CollectivityRepository)
    public collectivityRepository: CollectivityRepository,
    @inject(SecurityBindings.USER)
    private currentUser: IUser,
    @service(ClamavService)
    public clamavService: ClamavService,
  ) {}

  /**
   * This method is used by LoopBack context to produce an interceptor function
   * for the binding.
   *
   * @returns An interceptor function
   */
  value() {
    return this.intercept.bind(this);
  }

  /**
   * The logic to intercept an invocation
   * @param invocationCtx - Invocation context
   * @param next - A function to invoke next interceptor or the target method
   */
  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {
    const subscriptionDetails = await this.subscriptionRepository.findOne({
      where: {id: invocationCtx.args[0]},
    });

    // Check if subscription exists
    if (!subscriptionDetails) {
      throw new ValidationError(
        'Subscription does not exist',
        '/subscription',
        StatusCode.NotFound,
        ResourceName.Subscription,
      );
    }

    // Check if user has access to his own data
    if (
      !canAccessHisSubscriptionData(this.currentUser.id, subscriptionDetails?.citizenId)
    ) {
      throw new ValidationError('Access denied', '/authorization', StatusCode.Forbidden);
    }

    // Check subscription status
    if (subscriptionDetails?.status !== SUBSCRIPTION_STATUS.DRAFT) {
      throw new ValidationError(
        `Only subscriptions with Draft status are allowed`,
        '/status',
        StatusCode.PreconditionFailed,
        ResourceName.Subscription,
      );
    }

    // Check encryptionKey Exists
    let encryptionKey: EncryptionKey | undefined = undefined;
    const collectivity = await this.collectivityRepository.findOne({
      where: {id: subscriptionDetails.funderId},
    });
    const enterprise = await this.enterpriseRepository.findOne({
      where: {id: subscriptionDetails.funderId},
    });
    if (!collectivity && !enterprise) {
      throw new ValidationError(
        `Funder not found`,
        '/Funder',
        StatusCode.NotFound,
        ResourceName.EncryptionKey,
      );
    }

    if (collectivity) encryptionKey = collectivity.encryptionKey;
    if (enterprise) encryptionKey = enterprise.encryptionKey;
    if (!encryptionKey) {
      throw new ValidationError(
        `Encryption Key not found`,
        '/EncryptionKey',
        StatusCode.NotFound,
        ResourceName.EncryptionKey,
      );
    }

    // check if public key is expired
    if (isExpired(encryptionKey.expirationDate, new Date())) {
      throw new ValidationError(
        `Encryption Key Expired`,
        '/EncryptionKey',
        StatusCode.UnprocessableEntity,
        ResourceName.EncryptionKey,
      );
    }

    // Check if there is already files in db
    if (
      subscriptionDetails!.attachments &&
      subscriptionDetails!.attachments?.length > 0
    ) {
      throw new ValidationError(
        `You already provided files to this subscription`,
        '/attachments',
        StatusCode.UnprocessableEntity,
        ResourceName.Attachments,
      );
    }

    const attachments = invocationCtx.args[1].files;
    const idMetadata = invocationCtx.args[1].body.data
      ? JSON.parse(invocationCtx.args[1].body.data)?.metadataId
      : undefined;

    const subscriptionMetadata = idMetadata
      ? await this.metadataRepository.findById(idMetadata)
      : undefined;

    // Check at least one of attachments and idMetadata
    if (!subscriptionMetadata && (!attachments || !(attachments.length > 0))) {
      throw new ValidationError(
        `You need the provide at least one file or valid metadata`,
        '/attachments',
        StatusCode.UnprocessableEntity,
        ResourceName.Attachments,
      );
    }

    // Check if incentiveId in metadata is the same than the one from the subscription
    if (
      subscriptionMetadata &&
      subscriptionDetails!.incentiveId?.toString() !==
        subscriptionMetadata?.incentiveId?.toString()
    ) {
      throw new ValidationError(
        `Metadata does not match this subscription`,
        '/attachments',
        StatusCode.UnprocessableEntity,
        ResourceName.Attachments,
      );
    }

    // Check number of file to upload
    if (
      !this.s3Service.hasCorrectNumberOfFiles([
        ...attachments,
        ...(subscriptionMetadata?.attachmentMetadata?.invoices ?? []),
      ])
    ) {
      throw new ValidationError(
        `Too many files to upload`,
        '/attachments',
        StatusCode.UnprocessableEntity,
        ResourceName.Attachments,
      );
    }
    // Check attachments valid mime type
    if (!this.s3Service.hasValidMimeType(attachments)) {
      throw new ValidationError(
        `Uploaded files do not have valid content type`,
        '/attachments',
        StatusCode.PreconditionFailed,
        ResourceName.AttachmentsType,
      );
    }
    // Check attachments valid mime size
    if (!this.s3Service.hasValidFileSize(attachments)) {
      throw new ValidationError(
        `Uploaded files do not have a valid file size`,
        '/attachments',
        StatusCode.PreconditionFailed,
        ResourceName.Attachments,
      );
    }

    // Check if a file is corrupted using ClamAV
    if (!(await this.clamavService.checkCorruptedFiles(attachments))) {
      throw new ValidationError(
        'A corrupted file has been found',
        '/antivirus',
        StatusCode.UnprocessableEntity,
        ResourceName.Antivirus,
      );
    }

    const result = await next();
    return result;
  }
}

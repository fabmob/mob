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
import {EncryptionKey, Funder} from '../models';

import {SubscriptionRepository, MetadataRepository, FunderRepository} from '../repositories';
import {ClamavService, S3Service} from '../services';
import {ResourceName, canAccessHisSubscriptionData, SUBSCRIPTION_STATUS, IUser, Logger} from '../utils';
import {isExpired} from '../utils/date';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
  UnsupportedMediaTypeError,
} from '../validationError';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@injectable({tags: {key: SubscriptionAttachmentsInterceptor.BINDING_KEY}})
export class SubscriptionAttachmentsInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${SubscriptionAttachmentsInterceptor.name}`;

  constructor(
    @inject('services.S3Service')
    private s3Service: S3Service,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @repository(MetadataRepository)
    public metadataRepository: MetadataRepository,
    @repository(FunderRepository)
    public funderRepository: FunderRepository,
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
  async intercept(invocationCtx: InvocationContext, next: () => ValueOrPromise<InvocationResult>) {
    try {
      const subscriptionDetails = await this.subscriptionRepository.findOne({
        where: {id: invocationCtx.args[0]},
      });
      // Check if subscription exists
      if (!subscriptionDetails) {
        throw new NotFoundError(
          SubscriptionAttachmentsInterceptor.name,
          invocationCtx.methodName,
          'Subscription does not exist',
          '/subscription',
          ResourceName.Subscription,
          invocationCtx.args[0],
        );
      }

      // Check if user has access to his own data
      if (!canAccessHisSubscriptionData(this.currentUser.id, subscriptionDetails?.citizenId)) {
        throw new ForbiddenError(
          SubscriptionAttachmentsInterceptor.name,
          invocationCtx.methodName,
          this.currentUser.id,
          subscriptionDetails?.citizenId,
        );
      }

      // Check subscription status
      if (subscriptionDetails?.status !== SUBSCRIPTION_STATUS.DRAFT) {
        throw new ConflictError(
          SubscriptionAttachmentsInterceptor.name,
          invocationCtx.methodName,
          `subscriptions.error.bad.status`,
          '/subscription',
          ResourceName.Subscription,
          subscriptionDetails?.status,
          SUBSCRIPTION_STATUS.DRAFT,
        );
      }

      // Check encryptionKey Exists
      let encryptionKey: EncryptionKey | undefined = undefined;
      const funder: Funder = await this.funderRepository.findById(subscriptionDetails.funderId);

      if (!funder) {
        throw new BadRequestError(
          SubscriptionAttachmentsInterceptor.name,
          invocationCtx.methodName,
          `Funder not found`,
          '/Funder',
          ResourceName.EncryptionKey,
          subscriptionDetails.funderId,
        );
      }

      encryptionKey = funder.encryptionKey;

      if (!encryptionKey) {
        throw new UnprocessableEntityError(
          SubscriptionAttachmentsInterceptor.name,
          invocationCtx.methodName,
          `Encryption Key not found`,
          '/EncryptionKey',
          ResourceName.EncryptionKey,
          subscriptionDetails.funderId,
        );
      }

      // check if public key is expired
      if (isExpired(encryptionKey.expirationDate, new Date())) {
        throw new UnprocessableEntityError(
          SubscriptionAttachmentsInterceptor.name,
          invocationCtx.methodName,
          `Encryption Key Expired`,
          '/EncryptionKey',
          ResourceName.EncryptionKey,
          encryptionKey.expirationDate,
        );
      }

      // Check if there is already files in db
      if (subscriptionDetails!.attachments && subscriptionDetails!.attachments?.length > 0) {
        throw new UnprocessableEntityError(
          SubscriptionAttachmentsInterceptor.name,
          invocationCtx.methodName,
          `You already provided files to this subscription`,
          '/attachments',
          ResourceName.Attachments,
          subscriptionDetails!.attachments,
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
        throw new BadRequestError(
          SubscriptionAttachmentsInterceptor.name,
          invocationCtx.methodName,
          `You need the provide at least one file or valid metadata`,
          '/attachments',
          ResourceName.Attachments,
          {metadataId: idMetadata, attachements: attachments},
        );
      }

      // Check if incentiveId in metadata is the same than the one from the subscription
      if (
        subscriptionMetadata &&
        subscriptionDetails!.incentiveId?.toString() !== subscriptionMetadata?.incentiveId?.toString()
      ) {
        throw new ConflictError(
          SubscriptionAttachmentsInterceptor.name,
          invocationCtx.methodName,
          `Metadata does not match this subscription`,
          '/attachments',
          ResourceName.Attachments,
          subscriptionDetails?.incentiveId,
          subscriptionMetadata?.incentiveId,
        );
      }

      // Check number of file to upload
      if (
        !this.s3Service.hasCorrectNumberOfFiles([
          ...attachments,
          ...(subscriptionMetadata?.attachmentMetadata?.invoices ?? []),
        ])
      ) {
        throw new BadRequestError(
          SubscriptionAttachmentsInterceptor.name,
          invocationCtx.methodName,
          `Too many files to upload`,
          '/attachments',
          ResourceName.Attachments,
          attachments.length + subscriptionMetadata?.attachmentMetadata?.invoices.length,
        );
      }
      // Check attachments valid mime type
      if (!this.s3Service.hasValidMimeType(attachments)) {
        throw new UnsupportedMediaTypeError(
          SubscriptionAttachmentsInterceptor.name,
          invocationCtx.methodName,
          `Uploaded files do not have valid content type`,
          '/attachments',
          ResourceName.AttachmentsType,
          attachments,
        );
      }
      // Check attachments valid mime size
      if (!this.s3Service.hasValidFileSize(attachments)) {
        throw new BadRequestError(
          SubscriptionAttachmentsInterceptor.name,
          invocationCtx.methodName,
          `Uploaded files do not have a valid file size`,
          '/attachments',
          ResourceName.Attachments,
          attachments,
        );
      }

      // Check if a file is corrupted using ClamAV
      if (!(await this.clamavService.checkCorruptedFiles(attachments))) {
        throw new UnprocessableEntityError(
          SubscriptionAttachmentsInterceptor.name,
          invocationCtx.methodName,
          'A corrupted file has been found',
          '/antivirus',
          ResourceName.Antivirus,
          attachments,
        );
      }

      const result = await next();
      return result;
    } catch (error) {
      Logger.error(SubscriptionAttachmentsInterceptor.name, invocationCtx.methodName, 'Error', error);
      throw error;
    }
  }
}

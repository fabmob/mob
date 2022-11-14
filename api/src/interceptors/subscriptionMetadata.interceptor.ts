import {
  inject,
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {repository} from '@loopback/repository';
import {SecurityBindings} from '@loopback/security';

import {IncentiveRepository, MetadataRepository} from '../repositories';
import {canAccessHisSubscriptionData, IUser, ResourceName, StatusCode} from '../utils';
import {ValidationError} from '../validationError';
import {Invoice, Metadata} from '../models';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@injectable({tags: {key: SubscriptionMetadataInterceptor.BINDING_KEY}})
export class SubscriptionMetadataInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${SubscriptionMetadataInterceptor.name}`;

  constructor(
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @repository(MetadataRepository)
    public metadataRepository: MetadataRepository,
    @inject(SecurityBindings.USER)
    private currentUser: IUser,
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
    const {methodName, args} = invocationCtx;
    const {incentiveId, attachmentMetadata} = new Metadata(args[0]);
    const {id} = this.currentUser;
    if (methodName === 'createMetadata') {
      // Get incentive to see if it exists
      // Check isMCMStaff
      const {isMCMStaff} = await this.incentiveRepository.findById(incentiveId);
      if (!isMCMStaff) {
        throw new ValidationError(
          'Access denied',
          '/authorization',
          StatusCode.Forbidden,
        );
      }

      // Check empty invoices or empty products
      if (
        attachmentMetadata.invoices.length === 0 ||
        attachmentMetadata.invoices.find(
          (invoice: Invoice) => invoice.products.length === 0,
        )
      ) {
        throw new ValidationError(
          'Metadata invoices or products length invalid',
          '/metadata',
          StatusCode.UnprocessableEntity,
          ResourceName.Metadata,
        );
      }

      // Check totalElements && nb invoices
      if (attachmentMetadata.invoices.length !== attachmentMetadata.totalElements) {
        throw new ValidationError(
          'Metadata invoices length must be equal to totalElements',
          '/metadata',
          StatusCode.UnprocessableEntity,
          ResourceName.Metadata,
        );
      }

      // Attach citizenId and token to metadata
      args[0].citizenId = id;
    }

    if (methodName === 'getMetadata') {
      const metadataId = args[0];
      const metadata = await this.metadataRepository.findOne({where: {id: metadataId}});
      if (!metadata) {
        throw new ValidationError(
          `Metadata not found`,
          '/metadataNotFound',
          StatusCode.NotFound,
          ResourceName.Metadata,
        );
      }

      // Check if user has access to his own data
      if (!canAccessHisSubscriptionData(this.currentUser.id, metadata.citizenId)) {
        throw new ValidationError(
          'Access denied',
          '/authorization',
          StatusCode.Forbidden,
        );
      }
    }

    const result = await next();
    return result;
  }
}

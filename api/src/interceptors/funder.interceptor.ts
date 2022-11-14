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

import {CollectivityRepository, EnterpriseRepository} from '../repositories';
import {ValidationError} from '../validationError';
import {ResourceName, StatusCode, IUser} from '../utils';
import {Collectivity, EncryptionKey, Enterprise} from '../models';
/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */

@injectable({tags: {key: FunderInterceptor.BINDING_KEY}})
export class FunderInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${FunderInterceptor.name}`;

  /*
   * constructor
   */
  constructor(
    @repository(CollectivityRepository)
    public collectivityRepository: CollectivityRepository,
    @repository(EnterpriseRepository)
    public enterpriseRepository: EnterpriseRepository,
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
    const encryptionKey: EncryptionKey = invocationCtx.args[1];
    const funderId = invocationCtx.args[0];
    let funder: Collectivity | Enterprise | undefined = undefined;

    const collectivity: Collectivity | null = await this.collectivityRepository.findOne({
      where: {id: funderId},
    });
    const enterprise: Enterprise | null = await this.enterpriseRepository.findOne({
      where: {id: funderId},
    });

    funder = collectivity ? collectivity : enterprise ? enterprise : undefined;
    if (!funder) {
      throw new ValidationError(
        `Funder not found`,
        `/Funder`,
        StatusCode.NotFound,
        ResourceName.Funder,
      );
    }

    // Will not anymore if we stop using ${funderName}-backend convention when creating KC backend clients
    if (
      funder &&
      this.currentUser?.clientName &&
      !this.currentUser?.groups?.includes(funder.name)
    ) {
      throw new ValidationError('Access denied', '/authorization', StatusCode.Forbidden);
    }
    if (
      (collectivity || (enterprise && !enterprise.isHris)) &&
      !encryptionKey.privateKeyAccess
    ) {
      throw new ValidationError(
        `encryptionKey.error.privateKeyAccess.missing`,
        '/EncryptionKey',
        StatusCode.UnprocessableEntity,
      );
    }
    const result = await next();
    return result;
  }
}

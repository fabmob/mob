import {
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  service,
  ValueOrPromise,
} from '@loopback/core';
import {Territory} from '../models';
import {TerritoryService} from '../services';
import {ResourceName, SCALE} from '../utils';
import {BadRequestError, UnprocessableEntityError} from '../validationError';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@injectable({tags: {key: TerritoryInterceptor.BINDING_KEY}})
export class TerritoryInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${TerritoryInterceptor.name}`;

  constructor(
    @service(TerritoryService)
    public territoryService: TerritoryService,
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
    const {methodName, args} = invocationCtx;

    if (methodName === 'create' || methodName === 'updateById') {
      const territory: Territory = methodName === 'create' ? new Territory(args[0]) : new Territory(args[1]);

      if (territory.scale !== SCALE.NATIONAL && !territory.inseeValueList) {
        throw new BadRequestError(
          TerritoryInterceptor.name,
          invocationCtx.methodName,
          'InseeValueList must be provided',
          '/inseeValueListMustBeProvided',
          ResourceName.Territory,
          {scale: territory.scale, inseeValueList: territory.inseeValueList},
        );
      }

      if (
        territory.inseeValueList?.length &&
        !this.territoryService.isValidInseeCodePattern(territory.inseeValueList)
      ) {
        throw new BadRequestError(
          TerritoryInterceptor.name,
          invocationCtx.methodName,
          'InseeValueList does not have a valid pattern',
          '/inseeValueListBadFormat',
          ResourceName.Territory,
          territory.inseeValueList,
        );
      }

      if (territory.inseeValueList && this.territoryService.hasDuplicatedValues(territory.inseeValueList)) {
        throw new BadRequestError(
          TerritoryInterceptor.name,
          invocationCtx.methodName,
          'InseeValueList has duplicated values',
          '/inseeValueListDuplicatedValues',
          ResourceName.Territory,
          territory.inseeValueList,
        );
      }

      if (
        territory.inseeValueList &&
        !this.territoryService.isValidScaleInseeCodeValidation(
          territory.scale as SCALE,
          territory.inseeValueList,
        )
      ) {
        throw new UnprocessableEntityError(
          TerritoryInterceptor.name,
          invocationCtx.methodName,
          'Scale and InseeCodeList do not match',
          '/scaleInseecodeDoNotMatch',
          ResourceName.Territory,
          {scale: territory.scale, inseeValueList: territory.inseeValueList},
        );
      }
    }

    const result = await next();
    return result;
  }
}

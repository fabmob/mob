import {
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {StatusCode} from '../utils';
import {ValidationError} from '../validationError';
import {isEmailFormatValid} from './utils';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@injectable({tags: {key: EnterpriseInterceptor.BINDING_KEY}})
export class EnterpriseInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${EnterpriseInterceptor.name}`;

  constructor() {}

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
    const {emailFormat} = args[0];
    if (methodName === 'create') {
      const allEmailFormatsValid: boolean = emailFormat.every(
        (emailFormatString: string) => isEmailFormatValid(emailFormatString),
      );
      if (!allEmailFormatsValid) {
        throw new ValidationError(
          'Enterprise email formats are not valid',
          '/enterpriseEmailBadFormat',
          StatusCode.UnprocessableEntity,
        );
      }
    }

    const result = await next();
    return result;
  }
}

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
import {Filter, repository} from '@loopback/repository';
import {SecurityBindings} from '@loopback/security';
import {
  canAccessHisFunderData,
  canRequestFields,
  FUNDER_TYPE,
  IUser,
  Logger,
  ResourceName,
  Roles,
} from '../utils';
import {ValidationError} from 'jsonschema';

import {FunderRepository} from '../repositories';
import {Funder, EncryptionKey} from '../models';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../validationError';
import {isEmailFormatValid} from './utils';
import {FunderService} from '../services';
import {removeWhiteSpace} from '../controllers/utils/helpers';

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
    @repository(FunderRepository)
    public funderRepository: FunderRepository,
    @service(FunderService)
    public funderService: FunderService,
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
  async intercept(invocationCtx: InvocationContext, next: () => ValueOrPromise<InvocationResult>) {
    const {methodName, args} = invocationCtx;
    if (methodName === 'create') {
      const funder: Funder = new Funder(args[0]);

      funder.name = removeWhiteSpace(funder.name);

      // Perform case sensitive match
      const result: Funder | null = await this.funderRepository.findOne({
        where: {name: {regexp: `/^${funder.name.toLowerCase()}$/i`}, type: funder.type},
      });
      Logger.debug(FunderInterceptor.name, invocationCtx.methodName, 'Case-sensitive Match', result);

      // Throw an error if the funder name is duplicated.

      if (result) {
        throw new ConflictError(
          FunderInterceptor.name,
          invocationCtx.methodName,
          'funder.name.error.unique',
          '/funderName',
          ResourceName.Funder,
          funder.name,
        );
      }

      const validationErrorList: ValidationError[] = this.funderService.validateSchema(
        funder,
        funder.type as FUNDER_TYPE,
      );

      if (validationErrorList.length > 0) {
        throw new UnprocessableEntityError(
          FunderInterceptor.name,
          invocationCtx.methodName,
          validationErrorList[0].message,
          validationErrorList[0].path.toString(),
          ResourceName.Funder,
          validationErrorList,
        );
      }

      if (funder.type === FUNDER_TYPE.ENTERPRISE) {
        if (funder.enterpriseDetails.hasManualAffiliation && funder.enterpriseDetails.isHris) {
          throw new UnprocessableEntityError(
            FunderInterceptor.name,
            invocationCtx.methodName,
            'enterprise.options.invalid',
            '/enterpriseInvalidOptions',
            ResourceName.Enterprise,
            {
              hasManualAffiliation: funder.enterpriseDetails.hasManualAffiliation,
              isHris: funder.enterpriseDetails.isHris,
            },
          );
        }

        if (
          !funder.enterpriseDetails.emailDomainNames.every((emailFormatString: string) =>
            isEmailFormatValid(emailFormatString),
          )
        ) {
          throw new UnprocessableEntityError(
            FunderInterceptor.name,
            invocationCtx.methodName,
            'Enterprise email formats are not valid',
            '/enterpriseEmailBadFormat',
            ResourceName.Enterprise,
            funder.enterpriseDetails.emailDomainNames,
          );
        }
      }
    }

    if (methodName === 'storeEncryptionKey') {
      const encryptionKey: EncryptionKey = invocationCtx.args[1];
      const funderId = invocationCtx.args[0];
      const funder: Funder | null = await this.funderRepository.findById(funderId);
      if (!funder) {
        throw new BadRequestError(
          FunderInterceptor.name,
          invocationCtx.methodName,
          `Funder not found`,
          `/Funder`,
          ResourceName.Funder,
          funderId,
        );
      }

      // Will not anymore if we stop using ${funderName}-backend convention when creating KC backend clients
      if (funder && this.currentUser?.clientName && !this.currentUser?.groups?.includes(funder.name)) {
        throw new ForbiddenError(
          FunderInterceptor.name,
          invocationCtx.methodName,
          this.currentUser?.clientName,
        );
      }
      if (
        (funder.type === FUNDER_TYPE.COLLECTIVITY ||
          funder.type === FUNDER_TYPE.NATIONAL ||
          (funder.type === FUNDER_TYPE.ENTERPRISE && !funder?.enterpriseDetails?.isHris)) &&
        !encryptionKey.privateKeyAccess
      ) {
        throw new BadRequestError(
          FunderInterceptor.name,
          invocationCtx.methodName,
          `encryptionKey.error.privateKeyAccess.missing`,
          '/EncryptionKey',
          ResourceName.Funder,
          funderId,
        );
      }
    }

    if (methodName === 'find') {
      const currentFilter: Filter = invocationCtx.args[0];

      if (
        !this.currentUser.roles?.includes(Roles.CONTENT_EDITOR) &&
        currentFilter?.fields &&
        !canRequestFields(currentFilter.fields, {enterpriseDetails: true, encryptionKey: true})
      ) {
        throw new BadRequestError(
          FunderInterceptor.name,
          invocationCtx.methodName,
          'find.error.requested.fields',
          '/Funder',
          ResourceName.Funder,
          currentFilter.fields,
        );
      }

      // Set minimal fields to provide the access of sensitive data
      if (!this.currentUser.roles?.includes(Roles.CONTENT_EDITOR)) {
        invocationCtx.args[0] = {
          ...currentFilter,
          fields: Object.assign({enterpriseDetails: false, encryptionKey: false}),
          ...currentFilter?.fields,
        };
      }
    }

    if (methodName === 'findById') {
      const funderId = invocationCtx.args[0];
      const currentUserFunderId: string | undefined = (
        await this.funderRepository.findOne({
          where: {and: [{name: this.currentUser.funderName}, {type: this.currentUser.funderType}]},
        })
      )?.id;

      if (
        this.currentUser.roles?.includes(Roles.FUNDERS) &&
        (!currentUserFunderId ||
          (currentUserFunderId && !canAccessHisFunderData(currentUserFunderId, funderId)))
      ) {
        throw new ForbiddenError(FunderInterceptor.name, invocationCtx.methodName, currentUserFunderId);
      }
    }

    if (invocationCtx.methodName === 'getCitizens' || invocationCtx.methodName === 'getCitizensCount') {
      const funder: Funder | null = await this.funderRepository.getFunderByNameAndType(
        this.currentUser.funderName!,
        this.currentUser.funderType!,
      );

      if (!funder) {
        throw new NotFoundError(
          FunderInterceptor.name,
          invocationCtx.methodName,
          `Funder not found`,
          '/funderNotFound',
          ResourceName.Funder,
          this.currentUser.funderName,
        );
      }

      if (!canAccessHisFunderData(funder.id, args[0])) {
        throw new ForbiddenError(FunderInterceptor.name, invocationCtx.methodName, {
          funderId: args[0],
        });
      }
    }

    const result = await next();
    return result;
  }
}

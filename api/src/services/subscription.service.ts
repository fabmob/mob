import {BindingScope, inject, injectable, service} from '@loopback/core';
import {repository, AnyObject, Count} from '@loopback/repository';
import {getJsonSchema} from '@loopback/repository-json-schema';
import {SecurityBindings, UserProfile} from '@loopback/security';
import qs from 'qs';
import {compareAsc, add, sub, parse} from 'date-fns';
import * as Excel from 'exceljs';
import {Express} from 'express';
import _ from 'lodash';
import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {Schema, Validator, ValidatorResult} from 'jsonschema';
import {capitalize} from 'lodash';
const pkijs = require('pkijs');
const asn1js = require('asn1js');

import {
  AffiliationRepository,
  CommunityRepository,
  FunderRepository,
  IncentiveRepository,
  SubscriptionRepository,
  SubscriptionTimestampRepository,
  UserEntityRepository,
  UserRepository,
} from '../repositories';
import {
  CommonRejection,
  OtherReason,
  Subscription,
  SubscriptionConsumePayload,
  SubscriptionRejection,
  SubscriptionValidation,
  ValidationMultiplePayment,
  ValidationSinglePayment,
  ValidationNoPayment,
  Incentive,
  Affiliation,
  Enterprise,
} from '../models';
import {S3Service} from './s3.service';
import {MailService} from './mail.service';
import {KeycloakService} from './keycloak.service';
import {CitizenService} from './citizen.service';
import {
  canAccessHisSubscriptionData,
  CONSUMER_ERROR,
  IPublishPayload,
  ISubscriptionBusError,
  ISubscriptionPublishPayload,
  IDataInterface,
  PAYMENT_MODE,
  REASON_REJECT_TEXT,
  REJECTION_REASON,
  ResourceName,
  SEND_MODE,
  StatusCode,
  SUBSCRIPTION_STATUS,
  OperatorData,
  RpcReturnedData,
  SOURCES,
  formatDateInFrenchNotation,
  GROUPS,
  Logger,
  CitizensQueryParams,
  PartialCitizen,
} from '../utils';
import {formatDateInTimezone} from '../utils/date';
import {sha256} from '../utils/encryption';
import {convertSpecificFields} from '../utils/subscription';
import {BadRequestError, UnprocessableEntityError} from '../validationError';
import {API_FQDN, WEBSITE_FQDN} from '../constants';
import {getListEmails} from '../controllers/utils/helpers';
import {BusError} from '../busError';

@injectable({scope: BindingScope.TRANSIENT})
export class SubscriptionService {
  constructor(
    @service(S3Service)
    private s3Service: S3Service,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @repository(SubscriptionTimestampRepository)
    public subscriptionTimestampRepository: SubscriptionTimestampRepository,
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
    @repository(FunderRepository)
    public funderRepository: FunderRepository,
    @repository(AffiliationRepository)
    public affiliationRepository: AffiliationRepository,
    @repository(UserEntityRepository)
    private userEntityRepository: UserEntityRepository,
    @repository(UserRepository)
    private userRepository: UserRepository,
    @inject('services.MailService')
    public mailService: MailService,
    @service(CitizenService)
    public citizenService: CitizenService,
    @service(KeycloakService)
    public keycloakService: KeycloakService,
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @inject(SecurityBindings.USER, {optional: true})
    private currentUser: UserProfile,
  ) {}

  /**
   * Check if the payment object contains errors
   * @param data :SubscriptionValidation
   */
  checkPayment(data: SubscriptionValidation) {
    if (data.mode === PAYMENT_MODE.NONE) {
      this.compareJsonSchema(data, ValidationNoPayment);
    }
    if (data.mode === PAYMENT_MODE.MULTIPLE) {
      this.compareJsonSchema(data, ValidationMultiplePayment);

      if ('lastPayment' in data) {
        const parsedDate = parse(data.lastPayment.toString(), 'yyyy-MM-dd', new Date());
        const minimalDate = add(new Date(), {months: 2});
        if (compareAsc(parsedDate, minimalDate) !== 1) {
          throw new BusError(
            CONSUMER_ERROR.DATE_ERROR,
            'lastPayment',
            '/lastPayment',
            StatusCode.BadRequest,
            ResourceName.Subscription,
          );
        }
      }
    }
    if (data.mode === PAYMENT_MODE.UNIQUE) {
      this.compareJsonSchema(data, ValidationSinglePayment);
    }
    return data;
  }

  /**
   * Identify the difference between two JSON schemas
   * @param data :SubscriptionValidation
   * @param schema :Function
   */
  compareJsonSchema(data: SubscriptionValidation, schema: Function) {
    const schemaValidator = new Validator();

    const resultCompare: ValidatorResult = schemaValidator.validate(data, {
      ...getJsonSchema(schema, {includeRelations: true}),
      additionalProperties: false,
    } as Schema);

    this.validatorError(resultCompare);
  }

  /**
   * Check if the reject object contains errors
   * @param data :SubscriptionRejection
   */
  checkRefusMotif(data: SubscriptionRejection) {
    const schemaValidator = new Validator();
    let resultCompare: ValidatorResult;
    resultCompare = schemaValidator.validate({type: data.type}, {
      ...getJsonSchema(CommonRejection),
      additionalProperties: false,
    } as Schema);
    this.validatorError(resultCompare);
    if (data.type === REJECTION_REASON.OTHER) {
      const reason = data as OtherReason;
      resultCompare = schemaValidator.validate(reason, {
        ...getJsonSchema(OtherReason, {includeRelations: true}),
        additionalProperties: false,
      } as Schema);

      this.validatorError(resultCompare);
    }
    return data;
  }

  async generateExcelValidatedIncentives(subscriptionList: any[]) {
    // Creation du excel book
    const workbook = new Excel.Workbook();
    // Creation de la Sheet (pour chaque incentiveId)
    const ListOfSheets: any[] = [];
    for (const subscription of subscriptionList) {
      if (ListOfSheets.indexOf(subscription.incentiveId.toString()) === -1)
        ListOfSheets.push(subscription.incentiveId.toString());
    }
    for (const sheet of ListOfSheets) {
      // Ajouter une nouvelle Sheet
      const newSheet = workbook.addWorksheet(sheet);
      let actualRow = newSheet.rowCount;
      // Ajouter les incentives
      for (const subscription of subscriptionList) {
        if (subscription.incentiveId.toString() === sheet) {
          // Gestion des specifics fields
          // Header
          const mainCols = [
            "NOM DE L'AIDE",
            'NOM DU CITOYEN',
            'PRENOM DU CITOYEN',
            'DATE DE NAISSANCE',
            'DATE DE LA DEMANDE',
            'DATE DE LA VALIDATION',
            'MONTANT ACCORDE',
            'FREQUENCE DE VERSEMENT',
            'DATE DU DERNIER VERSEMENT',
          ];
          if (subscription && subscription.specificFields) {
            const keysSpecs = Object.keys(subscription.specificFields);
            const specFields = keysSpecs.map(key => key.toUpperCase());
            mainCols.push(...specFields);
          }
          const headerRowFirst = newSheet.getRow(1);
          headerRowFirst.values = [...mainCols];
          headerRowFirst.eachCell((cell: Excel.Cell) => {
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'center',
            };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: {argb: '1ee146'},
            };
            cell.font = {
              size: 10,
              bold: true,
            };
          });
          const subscriptionRow = newSheet.getRow(actualRow + 2);
          const colToAdd = [];
          colToAdd.push(
            subscription.incentiveTitle,
            subscription.firstName,
            subscription.lastName,
            subscription.birthdate,
            formatDateInFrenchNotation(subscription.createdAt),
            formatDateInFrenchNotation(subscription.updatedAt),
            subscription.subscriptionValidation?.amount ? subscription.subscriptionValidation.amount : '',
            subscription.subscriptionValidation?.frequency
              ? subscription.subscriptionValidation.frequency
              : '',
            subscription.subscriptionValidation?.lastPayment
              ? subscription.subscriptionValidation.lastPayment
              : '',
          );
          if (subscription.specificFields) {
            colToAdd.push(...Object.values(subscription.specificFields));
          }
          subscriptionRow.values = [...colToAdd];
          actualRow++;
        }
      }
    }
    // send buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Get citizens with at least one subscription
   * @param CitizensQueryParams
   * @returns list of citizens
   */
  async getCitizensWithSubscription({
    funderId,
    lastName,
    skip,
    limit,
  }: CitizensQueryParams): Promise<PartialCitizen[]> {
    // Initialize pipeline
    const pipeline: Array<{[key: string]: unknown}> = [];

    const communityIds: string[] | undefined = (
      await this.userRepository.findOne({where: {id: this.currentUser.id}})
    )?.communityIds;

    if (communityIds && communityIds?.length > 0) {
      // addFields stage should be before match
      pipeline.push({
        $addFields: {
          stringCommunityId: {$toString: '$communityId'},
        },
      });
      // Return only the subscriptions that fall within the manager's scope
      pipeline.push({
        $match: {
          stringCommunityId: {$in: communityIds},
        },
      });
    }

    pipeline.push(
      {
        $match: {
          funderId,
          status: {$ne: SUBSCRIPTION_STATUS.DRAFT},
        },
      },
      {
        $group: {
          _id: `$citizenId`,
          firstName: {$first: '$firstName'},
          lastName: {$first: '$lastName'},
          isCitizenDeleted: {$first: '$isCitizenDeleted'},
          email: {$first: '$email'},
          enterpriseEmail: {$first: '$enterpriseEmail'},
          birthdate: {$first: 'birthdate'},
        },
      },
      {
        $sort: {
          lastName: 1,
          firstName: 1,
        },
      },
      {
        $project: {
          _id: 0,
          id: '$_id',
          lastName: 1,
          firstName: 1,
          birthdate: 1,
          email: 1,
          enterpriseEmail: 1,
          isCitizenDeleted: 1,
        },
      },
    );

    if (lastName) {
      pipeline.push({$match: {lastName: new RegExp('.*' + lastName + '.*', 'i')}});
    }

    if (skip) {
      pipeline.push({$skip: skip});
    }

    if (limit) {
      pipeline.push({$limit: limit});
    }

    const result = await this.subscriptionRepository.execute('Subscription', 'aggregate', pipeline);
    return result.get();
  }

  /**
   * get citizens count with at least one subscription & total count
   * @param CitizensQueryParams
   * @returns total of citizens
   */
  async getCitizensWithSubscriptionCount({funderId, lastName}: CitizensQueryParams): Promise<Count> {
    // Initialize pipeline
    const pipeline: Array<{[key: string]: unknown}> = [];

    const communityIds: string[] | undefined = (
      await this.userRepository.findOne({where: {id: this.currentUser.id}})
    )?.communityIds;

    if (communityIds && communityIds?.length > 0) {
      // addFields stage should be before match
      pipeline.push({
        $addFields: {
          stringCommunityId: {$toString: '$communityId'},
        },
      });
      // Return only the subscriptions that fall within the manager's scope
      pipeline.push({
        $match: {
          stringCommunityId: {$in: communityIds},
        },
      });
    }

    // match should be before count stage
    if (lastName) {
      pipeline.push({$match: {lastName: new RegExp('.*' + lastName + '.*', 'i')}});
    }

    pipeline.push(
      {
        $match: {
          funderId,
          status: {$ne: SUBSCRIPTION_STATUS.DRAFT},
        },
      },
      {
        $group: {
          _id: `$citizenId`,
        },
      },
      {$count: 'count'},
    );

    const result: Count[] | [] = await this.subscriptionRepository
      .execute('Subscription', 'aggregate', pipeline)
      .then((res: AnyObject) => res.get());

    return result[0] ? result[0] : {count: 0};
  }

  /**
   * Send subscription validation/rejection mail for citizen
   *
   * @param mode
   * @param mailService
   * @param incentiveTitle
   * @param date
   * @param email
   * @param firstName
   * @param motif
   * @param comments
   * @param amount
   */
  async sendValidationOrRejectionMail(
    mode: SEND_MODE,
    mailService: MailService,
    incentiveTitle: string,
    date: string,
    email: string,
    firstName: string,
    motif?: string | null,
    comments?: string | null,
    amount?: number | null,
  ) {
    const subscriptionsLink = `${WEBSITE_FQDN}/mon-dashboard`;

    await mailService.sendMailAsHtml(
      email!,
      `Votre demande d’aide a été ${mode}`,
      mode === SEND_MODE.VALIDATION ? 'subscription-validation' : 'subscription-rejection',
      {
        incentiveTitle: incentiveTitle,
        date: date,
        subscriptionsLink: subscriptionsLink,
        motif: motif,
        comment: comments,
        amount: amount,
        username: capitalize(firstName),
      },
    );
  }

  /**
   * Generate a formated list of attachment files
   * @param files :Express.Multer.File
   * @returns list of attachment files
   */
  formatAttachments(files: Express.Multer.File[]): Express.Multer.File[] {
    const namesCounter: Record<string, number> = {};
    files = files.map((file: Express.Multer.File) => {
      const [oldName, extension] = file['originalname'].split(/\.(?=[^\.]+$)/);
      let fileName: string = oldName;

      if (!(fileName in namesCounter)) {
        namesCounter[fileName] = 1;
      } else {
        const count: number = namesCounter[fileName]++;
        fileName = `${fileName}(${count})`;
      }

      return {
        ...file,
        originalname: extension ? `${fileName}.${extension}` : fileName,
      };
    });
    return files;
  }

  /**
   * Handle the payload of the consume message
   * @param data :any
   */

  async handleMessage(data: IDataInterface): Promise<void> {
    try {
      Logger.debug(SubscriptionService.name, this.handleMessage.name, 'Payload data', data);

      const initialSubscription = new SubscriptionConsumePayload({
        citizenId: data.citizenId,
        subscriptionId: data.subscriptionId,
        status: data.status,
      });
      // Check if the subscription exists
      const subscription = await this.subscriptionRepository.findById(data.subscriptionId);
      // Check if user has access to his subscription
      if (!canAccessHisSubscriptionData(subscription.citizenId, data.citizenId)) {
        throw new BusError(
          'CitizenID does not match',
          'citizenId',
          '/citizenIdError',
          StatusCode.Forbidden,
          ResourceName.Subscription,
        );
      }
      if (data.status === SUBSCRIPTION_STATUS.ERROR) {
        const motif = {
          type: REJECTION_REASON.OTHER,
          other: CONSUMER_ERROR.ERROR_MESSAGE,
          comments: CONSUMER_ERROR.ERROR_MESSAGE,
        };
        await this.rejectSubscription(motif as OtherReason, subscription);
        Logger.info(
          SubscriptionService.name,
          this.handleMessage.name,
          'Subscription rejected',
          data.subscriptionId,
        );
      } else {
        const resultCompare = new Validator().validate(initialSubscription, {
          ...getJsonSchema(SubscriptionConsumePayload),
        } as Schema);
        this.validatorError(resultCompare);
        if (subscription.status !== SUBSCRIPTION_STATUS.TO_PROCESS) {
          throw new BusError(
            'subscriptions.error.bad.status',
            'status',
            '/subscriptionBadStatus',
            StatusCode.Conflict,
            ResourceName.Subscription,
          );
        }
        if (data.status === SUBSCRIPTION_STATUS.VALIDATED) {
          const payment: AnyObject = {
            mode: data.mode,
            frequency: data.frequency,
            amount: data.amount,
            lastPayment: data.lastPayment,
            comments: data.comments,
          };

          Object.keys(payment).forEach(key => payment[key] === undefined && delete payment[key]);

          const dataPayment = payment as SubscriptionValidation;
          const paymentPayload = this.checkPayment(dataPayment);
          await this.validateSubscription(paymentPayload, subscription);
          Logger.info(
            SubscriptionService.name,
            this.handleMessage.name,
            'Subscription validated',
            data.subscriptionId,
          );
        }
        if (data.status === SUBSCRIPTION_STATUS.REJECTED) {
          const motif = {
            type: data.type,
            other: data.other,
            comments: data.comments,
          };
          const rejection = motif as OtherReason;
          const reasonPayload = this.checkRefusMotif(rejection);
          await this.rejectSubscription(reasonPayload, subscription);
          Logger.info(
            SubscriptionService.name,
            this.handleMessage.name,
            'Subscription rejected',
            data.subscriptionId,
          );
        }
      }
    } catch (error) {
      Logger.error(SubscriptionService.name, this.handleMessage.name, 'Failed to handle the payload', error);
      throw error;
    }
  }

  /**
   * Handle the validated subscription and send the notifications
   * @param result :any
   * @param subscription :Subscription
   */
  async validateSubscription(
    result: any,
    subscription: Subscription,
    updatedAt?: string | null,
  ): Promise<void> {
    Logger.debug(
      SubscriptionService.name,
      this.validateSubscription.name,
      'Get result check payment',
      result,
    );
    // Mise à jour du statut de la subscription
    subscription.status = SUBSCRIPTION_STATUS.VALIDATED;
    // Mise à jour des informations de versement
    subscription.subscriptionValidation = result;
    subscription.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
    await this.subscriptionRepository.updateById(subscription.id, _.pickBy(subscription, _.identity));
    Logger.info(
      SubscriptionService.name,
      this.validateSubscription.name,
      'Subscription updated',
      subscription.id,
    );

    /**
     * format date as [DD/MM/YYYY] à [HH h MM]
     */
    const date = formatDateInTimezone(new Date(subscription.createdAt!), "dd/MM/yyyy à H'h'mm");

    /**
     * get the incentive notification boolean
     */
    const {isCitizenNotificationsDisabled}: Incentive = await this.incentiveRepository.findById(
      subscription.incentiveId,
    );

    /**
     * get list of emails
     */
    const {listEmails} = getListEmails(subscription);

    /**
     * send the Validation mail for each email on the list
     */
    if (!isCitizenNotificationsDisabled) {
      listEmails.forEach(async email =>
        this.sendValidationOrRejectionMail(
          SEND_MODE.VALIDATION,
          this.mailService,
          subscription.incentiveTitle,
          date,
          email,
          subscription.firstName,
          null,
          result?.comments,
          result?.amount,
        ),
      );
      Logger.info(
        SubscriptionService.name,
        this.validateSubscription.name,
        'Subscription validation email sent',
        subscription.id,
      );
    }
  }

  /**
   * Handle the rejected subscription and send the notifications
   * @param result :SubscriptionRejection
   * @param subscription :Subscription
   */
  async rejectSubscription(
    result: SubscriptionRejection,
    subscription: Subscription,
    updatedAt?: string | null,
  ): Promise<void> {
    Logger.debug(SubscriptionService.name, this.rejectSubscription.name, 'Refuse reason data', result);
    // Mise à jour du statut de la subscription
    subscription.status = SUBSCRIPTION_STATUS.REJECTED;
    // Check if updated value has a value or not
    subscription.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
    // Delete specific fields && prooflist from subscription object && from bucket
    subscription.attachments &&
      delete subscription.attachments &&
      (await this.s3Service.deleteObjectFile(subscription.citizenId, subscription.id)) &&
      subscription.specificFields &&
      delete subscription.specificFields;
    Logger.info(
      SubscriptionService.name,
      this.rejectSubscription.name,
      'Subscription attachments deleted',
      subscription.id,
    );
    // Mise à jour des informations du motif
    subscription.subscriptionRejection = result;
    await this.subscriptionRepository.updateById(subscription.id, _.pickBy(subscription, _.identity));
    Logger.info(
      SubscriptionService.name,
      this.rejectSubscription.name,
      'Subscription updated',
      subscription.id,
    );

    /**
     * format date as [DD/MM/YYYY] à [HH h MM]
     */
    const date = formatDateInTimezone(new Date(subscription.createdAt!), "dd/MM/yyyy à H'h'mm");

    /**
     * Get list of emails
     */
    const {listEmails} = getListEmails(subscription);

    /**
     * get the rejection motif
     */
    const rejectionMessages: {[key in REJECTION_REASON]: string} = {
      [REJECTION_REASON.CONDITION]: REASON_REJECT_TEXT.CONDITION,
      [REJECTION_REASON.INVALID_PROOF]: REASON_REJECT_TEXT.INVALID_PROOF,
      [REJECTION_REASON.MISSING_PROOF]: REASON_REJECT_TEXT.MISSING_PROOF,
      [REJECTION_REASON.NOT_FRANCECONNECT]: REASON_REJECT_TEXT.NOT_FRANCECONNECT,
      [REJECTION_REASON.INVALID_RPC_CEE_REQUEST]: REASON_REJECT_TEXT.INVALID_RPC_CEE_REQUEST,
      [REJECTION_REASON.VALID_SUBSCRIPTION_EXISTS]: REASON_REJECT_TEXT.VALID_SUBSCRIPTION_EXISTS,
      [REJECTION_REASON.OTHER]: (result as OtherReason).other,
    };

    const subscriptionRejectionMessage: string =
      rejectionMessages[subscription.subscriptionRejection!.type as REJECTION_REASON];

    if (!subscriptionRejectionMessage) {
      throw new BadRequestError(
        SubscriptionService.name,
        this.rejectSubscription.name,
        'subscriptionRejection.type.not.found',
        '/subscriptionRejectionNotFound',
        ResourceName.Subscription,
        subscription.subscriptionRejection!.type,
      );
    }

    /**
     * get the incentive notification boolean
     */
    const {isCitizenNotificationsDisabled}: Incentive = await this.incentiveRepository.findById(
      subscription.incentiveId,
    );

    /**
     * send the Rejection mail for each email on the list
     */
    if (!isCitizenNotificationsDisabled) {
      listEmails.forEach(async email =>
        this.sendValidationOrRejectionMail(
          SEND_MODE.REJECTION,
          this.mailService,
          subscription.incentiveTitle,
          date,
          email,
          subscription.firstName,
          subscriptionRejectionMessage,
          result.comments,
        ),
      );
      Logger.info(
        SubscriptionService.name,
        this.rejectSubscription.name,
        'Subscription rejection email sent',
        subscription.id,
      );
    }
  }

  /**
   * Build a new payload with the error object using the subscription id in order to publish it
   * @param subscriptionId :string
   * @param errorMessage :ISubscriptionBusError
   */
  async getSubscriptionPayload(
    subscriptionId: string,
    errorMessage: ISubscriptionBusError,
  ): Promise<IPublishPayload> {
    const subscription: Subscription = await this.subscriptionRepository.findById(subscriptionId);
    const enterprise: Enterprise | null = await this.funderRepository.getEnterpriseById(
      subscription.funderId,
    );
    const payload = await this.preparePayLoad(subscription, errorMessage);
    return {
      subscription: payload,
      enterprise: enterprise!.name,
    };
  }

  /**
   * Prepared the payload and add the object error
   * @param subscription :Subscription
   * @param errorMessage :ISubscriptionBusError
   */

  async preparePayLoad(
    subscription: Subscription,
    errorMessage?: ISubscriptionBusError,
  ): Promise<ISubscriptionPublishPayload> {
    // build demande data
    const community = subscription.communityId
      ? await this.communityRepository.findById(subscription.communityId)
      : '';
    const affiliation: Affiliation | null = await this.affiliationRepository.findOne({
      where: {citizenId: subscription.citizenId},
    });
    const urlAttachmentsList: string[] = [];
    if (subscription.attachments && subscription.attachments.length !== 0) {
      subscription.attachments!.forEach(attachment =>
        urlAttachmentsList.push(
          `${API_FQDN}/v1/subscriptions/${subscription.id}/attachments/${attachment.originalName}`,
        ),
      );
    }
    const subscriptionPayload: ISubscriptionPublishPayload = {
      lastName: subscription.lastName,
      firstName: subscription.firstName,
      birthdate: subscription.birthdate,
      citizenId: subscription.citizenId,
      incentiveId: subscription.incentiveId,
      subscriptionId: subscription.id,
      email: affiliation!.enterpriseEmail ? affiliation!.enterpriseEmail : '',
      status: SUBSCRIPTION_STATUS.TO_PROCESS,
      communityName: community ? community.name : '',
      specificFields: subscription.specificFields ? JSON.stringify(subscription.specificFields) : '',
      attachments: urlAttachmentsList,
      error: errorMessage,
      encryptionKeyId: subscription.encryptionKeyId,
      encryptionKeyVersion: subscription.encryptionKeyVersion,
      encryptedAESKey: subscription.encryptedAESKey,
      encryptedIV: subscription.encryptedIV,
    };
    return subscriptionPayload;
  }
  /**
   * Check the validator errors and throws them
   * @param resultCompare :resultCompare
   */
  validatorError(resultCompare: ValidatorResult) {
    if (resultCompare.errors.length > 0) {
      throw new BusError(
        resultCompare.errors[0].message,
        Array.isArray(resultCompare.errors[0]?.argument)
          ? resultCompare.errors[0].path[0].toString()
          : resultCompare.errors[0].argument,
        resultCompare.errors[0].path?.toString(),
        StatusCode.UnprocessableEntity,
        ResourceName.Subscription,
      );
    }
  }

  /**
   * Delete subscription older than 3 years
   */
  async deleteSubscription(): Promise<void> {
    const olderSubscriptions: Subscription[] = await this.subscriptionRepository.find({
      where: {
        createdAt: {
          lt: sub(new Date(), {
            years: 3,
          }),
        },
      },
    });
    if (olderSubscriptions.length) {
      await Promise.all(
        olderSubscriptions.map(async subscription => {
          if (subscription.attachments?.length) {
            await this.s3Service.deleteObjectFile(subscription.citizenId, subscription.id);
          }
          Logger.info(
            SubscriptionService.name,
            this.deleteSubscription.name,
            'Subscription attachment deleted',
            subscription.id,
          );
          await this.subscriptionRepository.deleteById(subscription.id);
          Logger.info(
            SubscriptionService.name,
            this.deleteSubscription.name,
            'Subscription deleted',
            subscription.id,
          );
          await this.subscriptionTimestampRepository.deleteAll({
            subscriptionId: subscription.id,
          });
          Logger.info(
            SubscriptionService.name,
            this.deleteSubscription.name,
            'Subscription timestamps deleted',
            subscription.id,
          );
        }),
      );
    }
  }

  /**
   * Check the response of RPC API
   * @param data :OperatorData - contains the specifics fields long/short
   * @param url :string
   * @param token : string
   */
  async callCEEApi(data: OperatorData, url: string, token: string): Promise<RpcReturnedData> {
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    try {
      const response: AxiosResponse = await axios.post(url, data, config);
      // Success
      return {status: 'success', code: response.status, data: response.data};
    } catch (error) {
      // Error
      if (error.response) {
        Logger.error(
          SubscriptionService.name,
          this.callCEEApi.name,
          `RPC CEE Call failed with status ${error.response.status}`,
          error.response.data,
        );
        const errorData: RpcReturnedData = {status: 'error', code: error.response.status};
        switch (error.response.status) {
          case StatusCode.Conflict:
            return {
              ...errorData,
              data: error.response.data,
              message: 'La demande est déjà enregistrée',
            };
          case StatusCode.NotFound:
            return {...errorData, message: 'Not found'};
          default:
            return {
              ...errorData,
              message:
                error.response.data.error instanceof Object
                  ? error.response.data.error.message
                  : error.response.data,
            };
        }
      }
      Logger.error(
        SubscriptionService.name,
        this.callCEEApi.name,
        'Something wrong happened in the request',
        error.message,
      );
      return {status: 'error', message: error.message};
    }
  }

  /**
   * Check If the citizen source is France Connect
   * @param  userId:string - id of citizen
   */
  async checkFranceConnectIdentity(userId: string) {
    const citizen = (await this.userEntityRepository.getUserWithAttributes(
      userId,
      GROUPS.citizens,
    ))!.toCitizen();
    if (
      citizen?.identity.lastName.source !== SOURCES.FRANCE_CONNECT ||
      citizen?.identity.firstName.source !== SOURCES.FRANCE_CONNECT ||
      citizen?.identity.birthDate.source !== SOURCES.FRANCE_CONNECT
    )
      return false;
    return true;
  }

  /**
   * Check if subscription is compliant with RPC
   * @param  incentive: Incentive object
   * @param subscription: Subscription object
   */
  async checkCEEValidity(incentive: Incentive, subscription: Subscription, application_timestamp: string) {
    const attributeNames = ['RPC_CEE_TOKEN'];
    const attributes = await this.keycloakService.getAttributesFromGroup(
      attributeNames,
      incentive.funderName!,
      incentive?.funderId,
    );

    if (!('RPC_CEE_TOKEN' in attributes) || !attributes['RPC_CEE_TOKEN']) {
      throw new UnprocessableEntityError(
        SubscriptionService.name,
        this.checkCEEValidity.name,
        'group.token.notFound',
        '/subscriptionTokenNotFound',
        ResourceName.Subscription,
        attributes,
      );
    }

    const token = attributes.RPC_CEE_TOKEN;
    const url = (process.env.RPC_CEE_URL || 'https://api.demo.covoiturage.beta.gouv.fr/v3') + '/policies/cee';

    const data: OperatorData = convertSpecificFields(
      subscription.specificFields,
      subscription.lastName,
      application_timestamp,
    );
    Logger.debug(
      SubscriptionService.name,
      this.checkCEEValidity.name,
      'Operator data information for CEE post',
      data,
    );
    const result = await this.callCEEApi(data, url, token!);
    Logger.debug(SubscriptionService.name, this.checkCEEValidity.name, 'CEE post result values', result);
    return result;
  }

  /**
   * [Pré-version] Check If Incentives are Exlusive
   */
  async checkOfferExclusitivity() {
    return true;
  }

  /**
   * timestamp a subscription
   * @param subscription subscription to timestamp
   * @param client client
   * @param endpoint endpoint using createSubscriptionTimestamp
   */
  async createSubscriptionTimestamp(
    subscription: Subscription,
    endpoint: string,
    client?: string | undefined,
  ) {
    // encode auth token
    const encodedBase64Token = Buffer.from(
      `${process.env.TIMESTAMP_USERNAME}:${process.env.TIMESTAMP_PASSWORD}`,
    ).toString('base64');
    const authorization = `Basic ${encodedBase64Token}`;
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      responseType: 'arraybuffer',
    };
    try {
      // encrypte subscription
      const encryptedSubscription = sha256(subscription);

      const payload = {
        certReq: 'true',
        hashAlgorithm: 'SHA256',
        hashedMessage: encryptedSubscription,
      };
      const url = process.env.TIMESTAMP_URL || 'https://timestamp.dhimyotis.com/api/v1/';
      const response: AxiosResponse = await axios.post(url, qs.stringify(payload), config);

      const asn1: Record<string, unknown> = await asn1js.fromBER(response.data);

      // Wrap in a content Info
      const contentInfo: Record<string, unknown> = new pkijs.ContentInfo({
        schema: asn1.result,
      });

      // Wrap in a Signed data
      const signedData: any = new pkijs.SignedData({
        schema: contentInfo.content,
      });

      const signerInfo: any = signedData?.signerInfos[0];

      const signerInfoAttrs: any = signerInfo.signedAttrs.attributes;

      // in ASN1, all data has a unique OID, this corresponds to the timestamp time
      const SIGNINGTIME_OID: string = '1.2.840.113549.1.9.5';

      // get OID signing time
      const attr: any = signerInfoAttrs.find(
        (signerInfoAttr: any) => signerInfoAttr.type === SIGNINGTIME_OID,
      );

      // get signed time
      const signedTime: Date = new Date(attr.values[0].toDate());

      // Success
      await this.subscriptionTimestampRepository.create({
        subscriptionId: subscription.id,
        subscription: subscription,
        timestampedData: JSON.stringify(subscription),
        hashedSubscription: encryptedSubscription,
        timestampToken: response.data,
        signingTime: signedTime,
        request: {
          client,
          endpoint,
        },
      });
    } catch (error) {
      Logger.error(
        SubscriptionService.name,
        this.createSubscriptionTimestamp.name,
        'Failed to timestamp',
        error,
      );
      Logger.error(
        SubscriptionService.name,
        this.createSubscriptionTimestamp.name,
        'Error',
        error.response.data,
      );
    }
  }
}

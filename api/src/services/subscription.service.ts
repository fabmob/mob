import {BindingScope, inject, injectable, service} from '@loopback/core';
import {repository, AnyObject, Model} from '@loopback/repository';
import {getJsonSchema} from '@loopback/repository-json-schema';

import {compareAsc, add, sub, parse} from 'date-fns';
import * as Excel from 'exceljs';
import {Express} from 'express';
import _ from 'lodash';
import {
  CitizenRepository,
  CommunityRepository,
  EnterpriseRepository,
  SubscriptionRepository,
} from '../repositories';
import {
  CommonRejection,
  CommonValidation,
  OtherReason,
  Subscription,
  SubscriptionConsumePayload,
  SubscriptionRejection,
  SubscriptionValidation,
  ValidationMultiplePayment,
  ValidationSinglePayment,
} from '../models';
import {
  canAccessHisSubscriptionData,
  CONSUMER_ERROR,
  FUNDER_TYPE,
  HRIS_SUBSCRIPTION_ERROR,
  IPublishPayload,
  ISubscriptionBusError,
  ISubscriptionPublishPayload,
  logger,
  PAYMENT_MODE,
  REASON_REJECT_TEXT,
  REJECTION_REASON,
  ResourceName,
  SEND_MODE,
  StatusCode,
  SUBSCRIPTION_STATUS,
} from '../utils';
import {ValidationError} from '../validationError';
import {formatDateExcel} from '../interceptors/utils';
import {MailService} from './mail.service';
import {API_FQDN, WEBSITE_FQDN} from '../constants';
import {getFunderTypeAndListEmails} from '../controllers/utils/helpers';
import {formatDateInTimezone} from '../utils/date';
import {S3Service} from './s3.service';
import {Schema, Validator, ValidatorResult} from 'jsonschema';
import {BusError} from '../busError';

@injectable({scope: BindingScope.TRANSIENT})
export class SubscriptionService {
  constructor(
    @service(S3Service)
    private s3Service: S3Service,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @service(CitizenRepository)
    private citizenRepository: CitizenRepository,
    @inject('services.MailService')
    public mailService: MailService,
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
    @repository(EnterpriseRepository)
    public enterpriseRepository: EnterpriseRepository,
  ) {}

  /**
   * Check if the payment object contains errors
   * @param data :SubscriptionValidation
   */

  checkPayment(data: SubscriptionValidation) {
    const schemaValidator = new Validator();
    let resultCompare: ValidatorResult;
    resultCompare = schemaValidator.validate({mode: data.mode}, {
      ...getJsonSchema(CommonValidation, {includeRelations: true}),
      additionalProperties: false,
    } as Schema);
    this.validatorError(resultCompare);
    if (data.mode === PAYMENT_MODE.MULTIPLE) {
      const {mode, frequency, amount, lastPayment} = data as ValidationMultiplePayment;
      resultCompare = schemaValidator.validate(
        {
          mode: mode,
          frequency: frequency,
          amount: amount,
          lastPayment: lastPayment,
        },
        {
          ...getJsonSchema(ValidationMultiplePayment, {includeRelations: true}),
          additionalProperties: false,
        } as Schema,
      );
      this.validatorError(resultCompare);
      const parsedDate = parse(lastPayment.toString(), 'yyyy-MM-dd', new Date());
      const minimalDate = add(new Date(), {months: 2});
      if (compareAsc(parsedDate, minimalDate) !== 1) {
        throw new BusError(
          CONSUMER_ERROR.DATE_ERROR,
          'lastPayment',
          '/lastPayment',
          StatusCode.PreconditionFailed,
          ResourceName.Subscription,
        );
      }
    }
    if (data.mode === PAYMENT_MODE.UNIQUE) {
      const {mode, amount} = data as ValidationSinglePayment;
      resultCompare = schemaValidator.validate({mode: mode, amount: amount}, {
        ...getJsonSchema(ValidationSinglePayment, {includeRelations: true}),
        additionalProperties: false,
      } as Schema);
      this.validatorError(resultCompare);
    }
    return data;
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
    if (subscriptionList && subscriptionList.length > 0) {
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
            headerRowFirst.eachCell((cell: any) => {
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
              formatDateExcel(subscription.createdAt),
              formatDateExcel(subscription.updatedAt),
              subscription.subscriptionValidation?.amount
                ? subscription.subscriptionValidation.amount
                : '',
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
    } else {
      throw new ValidationError(
        'subscriptions.error.bad.buffer',
        '/subscriptionBadBuffer',
        StatusCode.PreconditionFailed,
        ResourceName.Buffer,
      );
    }
  }

  /**
   * get citizens with at least one subscription & total count
   * @param match params
   * @param skip pagination
   * @returns object of citizens and total citizens
   */
  async getCitizensWithSubscription(match: object[], skip: number | undefined) {
    const queryAllSubscriptions = await this.subscriptionRepository
      .execute('Subscription', 'aggregate', [
        {
          $match: {
            $and: match,
          },
        },
        {
          $facet: {
            citizensTotal: [
              {
                $group: {
                  _id: '$citizenId',
                },
              },
              {$count: 'count'},
            ],
            citizensData: [
              {
                $group: {
                  _id: {
                    citizenId: '$citizenId',
                    lastName: {$toLower: '$lastName'},
                    firstName: {$toLower: '$firstName'},
                    isCitizenDeleted: '$isCitizenDeleted',
                  },
                  citizenId: {$first: '$citizenId'},
                  lastName: {$first: '$lastName'},
                  firstName: {$first: '$firstName'},
                  isCitizenDeleted: {$first: '$isCitizenDeleted'},
                },
              },
              {$sort: {'_id.lastName': 1, '_id.firstName': 1}},
              {
                $project: {
                  _id: 0,
                },
              },
              {$skip: skip ?? 0},
              {$limit: 10},
            ],
          },
        },
        {
          $project: {
            // Get total from the first element of the citizensTotal array
            totalCitizens: {$ifNull: [{$arrayElemAt: ['$citizensTotal.count', 0]}, 0]},
            citizensData: 1,
          },
        },
      ])
      .then((res: AnyObject) => res.get())
      .catch(err => err);
    return queryAllSubscriptions?.[0];
  }

  /**
   * Send subscription validation/rejection mail for citizen
   *
   * @param mode
   * @param mailService
   * @param incentiveTitle
   * @param date
   * @param funderName
   * @param funderType
   * @param email
   * @param motif
   *
   */
  async sendValidationOrRejectionMail(
    mode: SEND_MODE,
    mailService: MailService,
    incentiveTitle: string,
    date: string,
    funderName: string,
    funderType: FUNDER_TYPE | null,
    email: string,
    motif?: string | undefined | null,
    comments?: string | undefined,
  ) {
    const subscriptionsLink = `${WEBSITE_FQDN}/mon-dashboard`;

    await mailService.sendMailAsHtml(
      email!,
      `${mode} de votre demande d'aide`,
      mode === SEND_MODE.VALIDATION
        ? 'subscription-validation'
        : 'subscription-rejection',
      {
        incentiveTitle: incentiveTitle,
        date: date,
        funderName: funderName,
        funderType: funderType,
        subscriptionsLink: subscriptionsLink,
        motif: motif,
        comment: comments,
      },
    );
  }

  /**
   * Generate a formated list of attachment files
   * @param files :Express.Multer.File
   * @returns list of attachment files
   */
  generateFormattedAttachments(files: Express.Multer.File[]): Express.Multer.File[] {
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

  async handleMessage(data: any): Promise<void> {
    try {
      const initialSubscription = new SubscriptionConsumePayload({
        citizenId: data.citizenId,
        subscriptionId: data.subscriptionId,
        status: data.status,
      });
      // Check if the subscription exists
      const subscription = await this.subscriptionRepository.findById(
        data.subscriptionId,
      );
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
      if (data.status === HRIS_SUBSCRIPTION_ERROR.ERROR) {
        const motif = {
          type: REJECTION_REASON.OTHER,
          other: CONSUMER_ERROR.ERROR_MESSAGE,
          comments: CONSUMER_ERROR.ERROR_MESSAGE,
        };
        await this.rejectSubscription(motif as OtherReason, subscription);
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
            StatusCode.PreconditionFailed,
            ResourceName.Subscription,
          );
        }
        if (data.status === SUBSCRIPTION_STATUS.VALIDATED) {
          const payment = {
            mode: data.mode,
            frequency: data.frequency,
            amount: data.amount,
            lastPayment: data.lastPayment,
            comments: data.comments,
          };
          const dataPayment = payment as SubscriptionValidation;
          const paymentPayload = this.checkPayment(dataPayment);
          await this.validateSubscription(paymentPayload, subscription);
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
        }
      }
    } catch (error) {
      logger.error(`Failed to handle the payload: ${error}`);
      throw error;
    }
  }

  /**
   * Handle the validated subscription and send the notifications
   * @param result :SubscriptionValidation
   * @param subscription :Subscription
   */
  async validateSubscription(
    result: SubscriptionValidation,
    subscription: Subscription,
  ): Promise<void> {
    // Mise à jour du statut de la subscription
    subscription.status = SUBSCRIPTION_STATUS.VALIDATED;
    // Mise à jour des informations de versement
    subscription.subscriptionValidation = result;
    await this.subscriptionRepository.updateById(
      subscription.id,
      _.pickBy(subscription, _.identity),
    );

    /**
     * format date as [DD/MM/YYYY] à [HH h MM]
     */
    const date = formatDateInTimezone(
      new Date(subscription.createdAt!),
      "dd/MM/yyyy à H'h'mm",
    );

    /**
     * get funderType based on incentive type and get the list of emails
     */
    const {listEmails, funderType} = getFunderTypeAndListEmails(subscription);

    /**
     * send the Validation mail for each email on the list
     */
    if (funderType) {
      listEmails.forEach(async email =>
        this.sendValidationOrRejectionMail(
          SEND_MODE.VALIDATION,
          this.mailService,
          subscription.incentiveTitle,
          date,
          subscription.funderName,
          funderType,
          email,
          null,
          result.comments,
        ),
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
  ): Promise<void> {
    // Mise à jour du statut de la subscription
    subscription.status = SUBSCRIPTION_STATUS.REJECTED;
    // Delete specific fields && prooflist from subscription object && from bucket
    subscription.attachments &&
      delete subscription.attachments &&
      this.s3Service.deleteObjectFile(subscription.citizenId, subscription.id) &&
      subscription.specificFields &&
      delete subscription.specificFields;
    // Mise à jour des informations du motif
    subscription.subscriptionRejection = result;
    await this.subscriptionRepository.updateById(
      subscription.id,
      _.pickBy(subscription, _.identity),
    );

    /**
     * format date as [DD/MM/YYYY] à [HH h MM]
     */
    const date = formatDateInTimezone(
      new Date(subscription.createdAt!),
      "dd/MM/yyyy à H'h'mm",
    );

    /**
     * get funderType based on incentive type and get the list of emails
     */
    const {listEmails, funderType} = getFunderTypeAndListEmails(subscription);

    /**
     * get the rejection motif
     */
    let subscriptionRejectionMessage: string | undefined;
    switch (subscription.subscriptionRejection!.type) {
      case REJECTION_REASON.CONDITION:
        subscriptionRejectionMessage = REASON_REJECT_TEXT.CONDITION;
        break;
      case REJECTION_REASON.INVALID_PROOF:
        subscriptionRejectionMessage = REASON_REJECT_TEXT.INVALID_PROOF;
        break;
      case REJECTION_REASON.MISSING_PROOF:
        subscriptionRejectionMessage = REASON_REJECT_TEXT.MISSING_PROOF;
        break;
      case REJECTION_REASON.OTHER:
        {
          const data = result as OtherReason;
          subscriptionRejectionMessage = data.other;
        }
        break;
      default:
        throw new ValidationError(
          'subscriptionRejection.type.not.found',
          '/subscriptionRejectionNotFound',
          StatusCode.NotFound,
          ResourceName.Affiliation,
        );
    }
    /**
     * send the Rejection mail for each email on the list
     */
    if (funderType) {
      listEmails.forEach(async email =>
        this.sendValidationOrRejectionMail(
          SEND_MODE.REJECTION,
          this.mailService,
          subscription.incentiveTitle,
          date,
          subscription.funderName,
          funderType,
          email,
          subscriptionRejectionMessage,
          result.comments,
        ),
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
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    const enterprise = await this.enterpriseRepository.findById(subscription.funderId);
    const payload = await this.preparePayLoad(subscription, errorMessage);
    return {
      subscription: payload,
      enterprise: enterprise.name,
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
    const {affiliation} = await this.citizenRepository.findById(subscription.citizenId);
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
      email: affiliation.enterpriseEmail ? affiliation.enterpriseEmail : '',
      status: SUBSCRIPTION_STATUS.TO_PROCESS,
      communityName: community ? community.name : '',
      specificFields: subscription.specificFields
        ? JSON.stringify(subscription.specificFields)
        : '',
      attachments: urlAttachmentsList,
      error: errorMessage,
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
        StatusCode.PreconditionFailed,
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
            await this.s3Service.deleteObjectFile(
              subscription.citizenId,
              subscription.id,
            );
          }
          await this.subscriptionRepository.deleteById(subscription.id);
        }),
      );
    }
  }
}

/* eslint-disable max-len */
import {TAG_MAAS} from '../../constants';
import {HttpErrors, param, toInterceptor, RestBindings} from '@loopback/rest';
import {inject, intercept, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, post, getModelSchemaRef, requestBody} from '@loopback/rest';
import {authorize} from '@loopback/authorization';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings} from '@loopback/security';
import multer from 'multer';
import {Express} from 'express';
import {capitalize} from 'lodash';
import {WEBSITE_FQDN} from '../../constants';

import {
  AffiliationInterceptor,
  SubscriptionV1Interceptor,
  SubscriptionV1AttachmentsInterceptor,
  SubscriptionV1FinalizeInterceptor,
} from '../../interceptors';
import {
  Subscription,
  AttachmentType,
  Incentive,
  CreateSubscription,
  ValidationMultiplePayment,
  ValidationSinglePayment,
  ValidationNoPayment,
  NoReason,
  OtherReason,
  Metadata,
  Citizen,
  EncryptionKey,
  IncentiveEligibilityChecks,
  CommonRejection,
  Enterprise,
  Funder,
} from '../../models';
import {
  IncentiveRepository,
  SubscriptionRepository,
  MetadataRepository,
  IncentiveEligibilityChecksRepository,
  FunderRepository,
} from '../../repositories';
import {
  checkMaas,
  MailService,
  S3Service,
  RabbitmqService,
  SubscriptionService,
  CitizenService,
} from '../../services';
import {validationErrorExternalHandler} from '../../validationErrorExternal';
import {
  StatusCode,
  SECURITY_SPEC_JWT,
  SECURITY_SPEC_JWT_KC_PASSWORD,
  SUBSCRIPTION_STATUS,
  Roles,
  AUTH_STRATEGY,
  MaasSubscriptionList,
  IUser,
  AdditionalProps,
  Logger,
} from '../../utils';
import {generatePdfInvoices} from '../../utils/invoice';
import {
  ELIGIBILITY_CHECKS_LABEL,
  INCENTIVE_TYPE,
  PAYMENT_MODE,
  REJECTION_REASON,
  SUBSCRIPTION_CHECK_MODE,
} from '../../utils/enum';
import {encryptFileHybrid, generateAESKey, encryptAESKey} from '../../utils/encryption';
import {defaultSwaggerError} from '../utils/swagger-errors';
import express, {Request, Response} from 'express';

const multerInterceptor = toInterceptor(multer({storage: multer.memoryStorage()}).any());
@authenticate(AUTH_STRATEGY.KEYCLOAK)
export class SubscriptionV1Controller {
  constructor(
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @repository(MetadataRepository)
    public metadataRepository: MetadataRepository,
    @repository(FunderRepository)
    public funderRepository: FunderRepository,
    @repository(IncentiveEligibilityChecksRepository)
    public incentiveEligibilityChecksRepository: IncentiveEligibilityChecksRepository,
    @service(RabbitmqService)
    public rabbitmqService: RabbitmqService,
    @service(S3Service)
    private s3Service: S3Service,
    @service(MailService)
    public mailService: MailService,
    @inject(SecurityBindings.USER)
    private currentUser: IUser,
    @service(SubscriptionService)
    public subscriptionService: SubscriptionService,
    @service(CitizenService)
    public citizenService: CitizenService,
  ) {}

  /**
   * TODO: REMOVING DEPRECATED ENDPOINT v1/maas/subscriptions.
   * Remove this endpoint
   */
  @authorize({allowedRoles: [Roles.MAAS, Roles.PLATFORM], voters: [checkMaas]})
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @intercept(SubscriptionV1Interceptor.BINDING_KEY)
  @post('v1/maas/subscriptions', {
    'x-controller-name': 'Subscriptions',
    summary: 'Crée une souscription',
    security: SECURITY_SPEC_JWT_KC_PASSWORD,
    description: "Création initiale d'une souscription où additionalProp correspond aux champs spécifiques",
    deprecated: true,
    responses: {
      [StatusCode.Created]: {
        description: 'La souscription est créée',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '',
                },
              },
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async createMaasSubscription(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreateSubscription),
        },
      },
    })
    subscription: CreateSubscription,
  ): Promise<{id: string} | HttpErrors.HttpError> {
    this.response.status(201);
    try {
      Logger.warn(
        SubscriptionV1Controller.name,
        this.createMaasSubscription.name,
        'DEPRECATED ENDPOINT - WONT BE UPDATED',
      );
      const incentive: Incentive = await this.incentiveRepository.findById(subscription.incentiveId);
      Logger.debug(
        SubscriptionV1Controller.name,
        this.createMaasSubscription.name,
        'Incentive data',
        incentive,
      );

      const citizen: Citizen = await this.citizenService.getCitizenWithAffiliationById(this.currentUser.id);
      Logger.debug(SubscriptionV1Controller.name, this.createMaasSubscription.name, 'Citizen data', citizen);

      const newSubscription = new Subscription({
        ...subscription,
        incentiveTitle: incentive.title,
        incentiveTransportList: incentive.transportList,
        citizenId: citizen.id,
        lastName: citizen.identity.lastName.value,
        firstName: citizen.identity.firstName.value,
        email: citizen.personalInformation.email.value,
        city: citizen.city,
        postcode: citizen.postcode,
        birthdate: citizen.identity.birthDate.value,
        status: SUBSCRIPTION_STATUS.DRAFT,
        funderName: incentive.funderName,
        incentiveType: incentive.incentiveType,
        funderId: incentive.funderId,
        isCitizenDeleted: false,
      });

      // Add company email to subscription object if exists
      if (citizen.affiliation?.enterpriseEmail) {
        newSubscription.enterpriseEmail = citizen.affiliation.enterpriseEmail;
      }

      const result = await this.subscriptionRepository.create(newSubscription);
      Logger.info(
        SubscriptionV1Controller.name,
        this.createMaasSubscription.name,
        'Subscription created',
        result.id,
      );

      // timestamped subscription
      if (incentive?.isCertifiedTimestampRequired) {
        await this.subscriptionService.createSubscriptionTimestamp(
          result,
          'POST v1/maas/subscriptions',
          this.currentUser.clientName,
        );
        Logger.info(
          SubscriptionV1Controller.name,
          this.createMaasSubscription.name,
          'Timestamp created for subscriptionId',
          result.id,
        );
      }
      return {id: result.id};
    } catch (error) {
      Logger.error(SubscriptionV1Controller.name, this.createMaasSubscription.name, 'Error', error);
      return validationErrorExternalHandler(error);
    }
  }

  /**
   * TODO: REMOVING DEPRECATED ENDPOINT v1/maas/subscriptions/{subscriptionId}/attachments.
   * Remove this endpoint
   */
  @authorize({allowedRoles: [Roles.MAAS, Roles.PLATFORM], voters: [checkMaas]})
  @intercept(multerInterceptor)
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @intercept(SubscriptionV1AttachmentsInterceptor.BINDING_KEY)
  @post('v1/maas/subscriptions/{subscriptionId}/attachments', {
    'x-controller-name': 'Subscriptions',
    summary: 'Ajoute des justificatifs à une souscription',
    security: SECURITY_SPEC_JWT_KC_PASSWORD,
    deprecated: true,
    tags: ['Subscriptions'],
    responses: {
      [StatusCode.Created]: {
        description: 'Ajout de justificatifs à une souscription au statut brouillon',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '',
                },
              },
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async addAttachments(
    @param.path.string('subscriptionId', {description: `L'identifiant de la souscription`})
    subscriptionId: string,
    @requestBody({
      description: `Multipart/form-data pour la creation d'une souscription`,
      content: {
        'multipart/form-data': {
          // Skip body parsing
          'x-parser': 'stream',
          schema: {
            type: 'object',
            properties: {
              attachmentExample: {
                description: `Exemple d'ajout d'un document justificatif ('image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/heic')`,
                type: 'array',
                items: {
                  format: 'binary',
                  type: 'string',
                },
              },
              data: {
                type: 'object',
                description: `Ajout des metadataId`,
                properties: {
                  metadataId: {
                    type: 'string',
                  },
                },
                example: {
                  metadataId: 'string',
                },
              },
            },
          },
        },
      },
    })
    attachmentData?: any,
  ): Promise<{id: string} | HttpErrors.HttpError> {
    this.response.status(201);
    try {
      Logger.warn(
        SubscriptionV1Controller.name,
        this.addAttachments.name,
        'DEPRECATED ENDPOINT - WONT BE UPDATED',
      );

      const subscription: Subscription = await this.subscriptionRepository.findById(subscriptionId);
      Logger.debug(
        SubscriptionV1Controller.name,
        this.addAttachments.name,
        'Subscription data',
        subscription,
      );

      let encryptionKey: EncryptionKey | undefined = undefined;
      const funder: Funder = await this.funderRepository.findById(subscription.funderId);
      Logger.debug(SubscriptionV1Controller.name, this.addAttachments.name, 'Funder data', funder);

      encryptionKey = funder.encryptionKey;

      const metadataId: string | undefined = attachmentData.body.data
        ? JSON.parse(attachmentData.body.data)?.metadataId
        : undefined;

      const citizen: Citizen = await this.citizenService.getCitizenWithAffiliationById(this.currentUser.id);
      Logger.debug(SubscriptionV1Controller.name, this.addAttachments.name, 'Citizen data', citizen);

      let formattedSubscriptionAttachments: AttachmentType[] = [];
      let invoicesPdf: Express.Multer.File[] = [];
      let createMaasSubscriptionAttachments: Express.Multer.File[] = [];
      let attachments: Express.Multer.File[] = [];

      const {key, iv}: {key: Buffer; iv: Buffer} = generateAESKey();
      const {encryptKey, encryptIV}: {encryptKey: Buffer; encryptIV: Buffer} = encryptAESKey(
        encryptionKey!.publicKey,
        key,
        iv,
      );

      if (attachmentData) {
        createMaasSubscriptionAttachments = attachmentData.files as Express.Multer.File[];
        createMaasSubscriptionAttachments.forEach((attachment: Express.Multer.File) => {
          attachment.buffer = encryptFileHybrid(attachment.buffer, key, iv);
        });
        Logger.info(SubscriptionV1Controller.name, this.addAttachments.name, 'Attachment data encrypted');
      }

      if (metadataId) {
        const metadata: Metadata = await this.metadataRepository.findById(metadataId);
        invoicesPdf = await generatePdfInvoices(metadata.attachmentMetadata.invoices);
        Logger.info(
          SubscriptionV1Controller.name,
          this.addAttachments.name,
          'Metadata pdf generated',
          metadataId,
        );

        invoicesPdf.forEach((invoicePdf: Express.Multer.File) => {
          invoicePdf.buffer = encryptFileHybrid(invoicePdf.buffer, key, iv);
        });
        Logger.info(SubscriptionV1Controller.name, this.addAttachments.name, 'Attachment data encrypted');
      }

      attachments = [...createMaasSubscriptionAttachments, ...invoicesPdf];
      const formattedAttachments: Express.Multer.File[] =
        this.subscriptionService.formatAttachments(attachments);
      formattedSubscriptionAttachments = formattedAttachments?.map((file: Express.Multer.File) => {
        return {
          originalName: file.originalname,
          uploadDate: new Date(),
          proofType: file.fieldname,
          mimeType: file.mimetype,
        };
      });

      if (attachments.length > 0) {
        await this.s3Service.uploadFileListIntoBucket(citizen.id, subscriptionId, formattedAttachments);
        Logger.info(SubscriptionV1Controller.name, this.addAttachments.name, 'Attachments uploaded');

        await this.subscriptionRepository.updateById(subscriptionId, {
          attachments: formattedSubscriptionAttachments,
          encryptedAESKey: encryptKey.toString('base64'),
          encryptedIV: encryptIV.toString('base64'),
          encryptionKeyId: encryptionKey!.id,
          encryptionKeyVersion: encryptionKey!.version,
          privateKeyAccess: encryptionKey!.privateKeyAccess ? encryptionKey!.privateKeyAccess : undefined,
        });
        Logger.info(
          SubscriptionV1Controller.name,
          this.addAttachments.name,
          'Subscription updated',
          subscriptionId,
        );
      }

      // Delete metadata once subscription is updated with files
      if (metadataId) {
        await this.metadataRepository.deleteById(metadataId);
        Logger.info(SubscriptionV1Controller.name, this.addAttachments.name, 'Metadata deleted', metadataId);
      }
      return {id: subscriptionId};
    } catch (error) {
      Logger.error(SubscriptionV1Controller.name, this.addAttachments.name, 'Error', error);
      return validationErrorExternalHandler(error);
    }
  }

  /**
   * TODO: REMOVING DEPRECATED ENDPOINT v1/maas/subscriptions/{subscriptionId}/verify.
   * Remove this endpoint
   */
  @authorize({allowedRoles: [Roles.MAAS, Roles.PLATFORM], voters: [checkMaas]})
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @intercept(SubscriptionV1FinalizeInterceptor.BINDING_KEY)
  @post('v1/maas/subscriptions/{subscriptionId}/verify', {
    'x-controller-name': 'Subscriptions',
    summary: 'Finalise une souscription',
    deprecated: true,
    security: SECURITY_SPEC_JWT_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Finalisation de la souscription',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: '',
                    },
                    status: {
                      type: 'string',
                      example: SUBSCRIPTION_STATUS.VALIDATED,
                      items: {
                        type: 'string',
                        enum: [SUBSCRIPTION_STATUS.VALIDATED, SUBSCRIPTION_STATUS.TO_PROCESS],
                      },
                    },
                  },
                },
                {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: '',
                    },
                    status: {
                      type: 'string',
                      enum: [SUBSCRIPTION_STATUS.REJECTED],
                      example: SUBSCRIPTION_STATUS.REJECTED,
                    },
                    rejectionReason: {
                      type: 'string',
                      items: {
                        type: 'string',
                        enum: [REJECTION_REASON.INVALID_RPC_CEE_REQUEST, REJECTION_REASON.NOT_FRANCECONNECT],
                      },
                    },
                    comments: {
                      type: 'string',
                      example: '',
                    },
                  },
                },
              ],
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async finalizeSubscriptionMaas(
    @param.path.string('subscriptionId', {description: `L'identifiant de la souscription`})
    subscriptionId: string,
  ): Promise<
    | {
        id: string;
        status: SUBSCRIPTION_STATUS;
        rejectionReason?: REJECTION_REASON;
        comments?: string;
      }
    | HttpErrors.HttpError
  > {
    try {
      Logger.warn(
        SubscriptionV1Controller.name,
        this.finalizeSubscriptionMaas.name,
        'DEPRECATED ENDPOINT - WONT BE LOGGED',
      );

      const subscription: Subscription = await this.subscriptionRepository.findById(subscriptionId);
      const incentive: Incentive = await this.incentiveRepository.findById(subscription.incentiveId);

      let comments: string | undefined, // This returns the message to send.
        rejectionReason: REJECTION_REASON | undefined, // This returns the first rejection reason encountred.
        status: SUBSCRIPTION_STATUS; // This returns the subscription status

      /**
       * Check if the subscription verification mode is automatic
       */
      if (incentive.subscriptionCheckMode === SUBSCRIPTION_CHECK_MODE.AUTOMATIC) {
        // Set date for application_timestamp property for CEE api and updatedAt mcm bdd
        const application_timestamp: string = new Date().toISOString();

        /**
         * Retrieve eligibilityChecks IDs if active=true
         */
        const controlsActiveIds: string[] | undefined = incentive?.eligibilityChecks
          ?.filter(item => item.active)
          .map(item => item.id);

        /**
         * Get the array of controls
         */
        const eligibilityChecks: IncentiveEligibilityChecks[] =
          await this.incentiveEligibilityChecksRepository.find({
            where: {
              id: {inq: controlsActiveIds},
            },
          });

        /**
         * Returns a map of functions that correspond to each eligibility check
         */
        const eligibilityChecksMap: {
          [key in ELIGIBILITY_CHECKS_LABEL]: () => Promise<any>;
        } = {
          [ELIGIBILITY_CHECKS_LABEL.FRANCE_CONNECT]: () =>
            this.subscriptionService.checkFranceConnectIdentity(this.currentUser.id),
          [ELIGIBILITY_CHECKS_LABEL.RPC_CEE_REQUEST]: () =>
            this.subscriptionService.checkCEEValidity(incentive, subscription, application_timestamp),
          [ELIGIBILITY_CHECKS_LABEL.EXCLUSION]: () => this.subscriptionService.checkOfferExclusitivity(),
        };

        let isEligible: Boolean = false; // This returns a Boolean indicating the eligibility check.
        let additionalProps: AdditionalProps | undefined; // This returns the additional properties for Validation/Rejection.

        /**
         * Iterate over the controls and calls the corresponding function for each check.
         * Depending of the result, Populate the variables above.
         * If invalid, set isEligible to false and exit the loop.
         * */
        for (const control of eligibilityChecks) {
          const result = await eligibilityChecksMap[control.label]();
          additionalProps = result?.data;

          if (result === true || result.status === 'success') {
            isEligible = true;
          }
          if (result === false || result.status === 'error') {
            isEligible = false;
            comments = result?.message;
            if (result.code) {
              comments = 'HTTP ' + result.code + (' - ' + comments || '');
            }
            if (control.motifRejet) {
              rejectionReason = control.motifRejet as REJECTION_REASON;
            }
            break;
          }
        }

        /**
         * If all controls are OK, Perform the validation process
         * Otherwise Perform the rejection process
         * */

        if (isEligible) {
          // Validate subscription
          await this.subscriptionService.validateSubscription(
            {additionalProperties: additionalProps, mode: PAYMENT_MODE.NONE},
            subscription,
            application_timestamp,
          );
          status = SUBSCRIPTION_STATUS.VALIDATED;
        } else {
          // Reject subscription
          await this.subscriptionService.rejectSubscription(
            {
              additionalProperties: additionalProps,
              type: rejectionReason,
              comments: comments,
            } as CommonRejection,
            subscription,
            application_timestamp,
          );
          status = SUBSCRIPTION_STATUS.REJECTED;
        }
      } else {
        // Change subscription status
        await this.subscriptionRepository.updateById(subscriptionId, {
          status: SUBSCRIPTION_STATUS.TO_PROCESS,
        });
        status = SUBSCRIPTION_STATUS.TO_PROCESS;

        /**
         * get the incentive notification boolean
         */
        const isCitizenNotificationsDisabled: Boolean = incentive?.isCitizenNotificationsDisabled;
        // Send a notification as an email
        if (!isCitizenNotificationsDisabled) {
          const dashboardLink = `${WEBSITE_FQDN}/mon-dashboard`;
          await this.mailService.sendMailAsHtml(
            subscription.email,
            'Confirmation d’envoi de la demande',
            'requests-to-process',
            {
              username: capitalize(subscription.firstName),
              funderName: subscription.funderName,
              dashboardLink: dashboardLink,
            },
          );
        }

        // check if the funder is entreprise and if its HRIS to publish msg to rabbitmq
        if (subscription?.incentiveType === INCENTIVE_TYPE.EMPLOYER_INCENTIVE) {
          const enterprise: Enterprise | null = await this.funderRepository.getEnterpriseById(
            subscription?.funderId,
          );
          if (enterprise?.enterpriseDetails.isHris) {
            const payload = await this.subscriptionService.preparePayLoad(subscription);
            // Publish to rabbitmq
            await this.rabbitmqService.publishMessage(payload, enterprise?.name);
          }
        }
      }

      return {
        id: subscriptionId,
        status: status,
        rejectionReason: rejectionReason,
        comments: comments,
      };
    } catch (error) {
      Logger.error(SubscriptionV1Controller.name, this.finalizeSubscriptionMaas.name, 'Error', error);
      return validationErrorExternalHandler(error);
    }
  }

  @authorize({allowedRoles: [Roles.MAAS], voters: [checkMaas]})
  @get('v1/maas/subscriptions', {
    'x-controller-name': 'Subscriptions',
    summary: 'Retourne les souscriptions',
    security: SECURITY_SPEC_JWT,
    deprecated: true,
    responses: {
      [StatusCode.Success]: {
        description: 'La liste des souscriptions',
        content: {
          'application/json': {
            schema: {
              title: 'MaasSubscriptionList',
              type: 'array',
              items: {
                allOf: [
                  getModelSchemaRef(Subscription, {
                    title: 'MaasSubscriptionItem',
                    exclude: [
                      'attachments',
                      'incentiveType',
                      'citizenId',
                      'lastName',
                      'firstName',
                      'email',
                      'communityId',
                      'consent',
                      'specificFields',
                      'status',
                      'subscriptionRejection',
                      'subscriptionValidation',
                    ],
                  }),
                  {
                    anyOf: [
                      {
                        properties: {
                          status: {
                            type: 'string',
                            example: SUBSCRIPTION_STATUS.TO_PROCESS,
                          },
                        },
                      },
                      {
                        type: 'object',
                        properties: {
                          subscriptionValidation: {
                            oneOf: [
                              {'x-ts-type': ValidationMultiplePayment},
                              {'x-ts-type': ValidationSinglePayment},
                              {'x-ts-type': ValidationNoPayment},
                            ],
                          },
                          status: {
                            type: 'string',
                            example: SUBSCRIPTION_STATUS.VALIDATED,
                          },
                        },
                      },
                      {
                        type: 'object',
                        properties: {
                          subscriptionRejection: {
                            oneOf: [{'x-ts-type': NoReason}, {'x-ts-type': OtherReason}],
                          },
                          status: {
                            type: 'string',
                            example: SUBSCRIPTION_STATUS.REJECTED,
                          },
                        },
                      },
                    ],
                  },
                  {
                    type: 'object',
                    properties: {
                      contact: {
                        type: 'string',
                        example: 'contact@mcm.com',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async findMaasSubscription(): Promise<MaasSubscriptionList[]> {
    try {
      // get current user id
      const userId: string = this.currentUser.id;

      // get incentives
      const incentiveList: Incentive[] = await this.incentiveRepository.find({
        fields: {id: true, contact: true},
      });

      // get current users subscriptions
      const userSubcriptionList: Subscription[] = await this.subscriptionRepository.find({
        where: {citizenId: userId, status: {neq: SUBSCRIPTION_STATUS.DRAFT}},
        fields: {
          id: true,
          incentiveId: true,
          incentiveTitle: true,
          funderName: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          subscriptionValidation: true,
          subscriptionRejection: true,
        },
      });
      Logger.debug(
        SubscriptionV1Controller.name,
        this.findMaasSubscription.name,
        'Subscription list data',
        userSubcriptionList,
      );

      // add help contact info to subscriptions
      const response: MaasSubscriptionList[] =
        userSubcriptionList &&
        userSubcriptionList.map((subscription: Subscription) => {
          const newSubscription: Subscription = subscription;
          const incentive =
            incentiveList &&
            incentiveList.find(
              (incentive: Incentive) => newSubscription.incentiveId.toString() === incentive.id,
            );
          newSubscription.status === SUBSCRIPTION_STATUS.VALIDATED &&
            delete newSubscription.subscriptionRejection;
          newSubscription.status === SUBSCRIPTION_STATUS.REJECTED &&
            delete newSubscription.subscriptionValidation;
          return {
            ...newSubscription,
            contact: incentive?.contact,
          };
        });

      return response;
    } catch (error) {
      Logger.error(SubscriptionV1Controller.name, this.findMaasSubscription.name, 'Error', error);
      throw error;
    }
  }
}

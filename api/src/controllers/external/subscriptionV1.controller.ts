import {HttpErrors, param, toInterceptor} from '@loopback/rest';
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
  Collectivity,
  Enterprise,
  IncentiveEligibilityChecks,
  CommonRejection,
} from '../../models';
import {
  IncentiveRepository,
  SubscriptionRepository,
  CommunityRepository,
  EnterpriseRepository,
  MetadataRepository,
  CollectivityRepository,
  IncentiveEligibilityChecksRepository,
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
  logger,
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

const multerInterceptor = toInterceptor(multer({storage: multer.memoryStorage()}).any());
@authenticate(AUTH_STRATEGY.KEYCLOAK)
export class SubscriptionV1Controller {
  constructor(
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @repository(MetadataRepository)
    public metadataRepository: MetadataRepository,
    @repository(EnterpriseRepository)
    public enterpriseRepository: EnterpriseRepository,
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
    @repository(CollectivityRepository)
    public collectivityRepository: CollectivityRepository,
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

  @authorize({allowedRoles: [Roles.MAAS, Roles.PLATFORM], voters: [checkMaas]})
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @intercept(SubscriptionV1Interceptor.BINDING_KEY)
  @post('v1/maas/subscriptions', {
    'x-controller-name': 'Subscriptions',
    summary: 'Crée une souscription',
    security: SECURITY_SPEC_JWT_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description:
          "Création initiale d'une demande d'aide où additionalProp correspond aux champs spécifiques",
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
      [StatusCode.Unauthorized]: {
        description: "L'utilisateur est non connecté",
      },
      [StatusCode.Forbidden]: {
        description: "L'utilisateur n'a pas les droits pour souscrire à cette aide",
      },
      [StatusCode.UnprocessableEntity]: {
        description: 'La demande ne peut pas être traitée',
      },
    },
  })
  async createSubscription(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreateSubscription),
        },
      },
    })
    subscription: CreateSubscription,
  ): Promise<{id: string} | HttpErrors.HttpError> {
    try {
      const incentive: Incentive = await this.incentiveRepository.findById(
        subscription.incentiveId,
      );
      const citizen: Citizen = await this.citizenService.getCitizenWithAffiliationById(
        this.currentUser.id,
      );
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
      // timestamped subscription
      if (incentive?.isCertifiedTimestampRequired) {
        await this.subscriptionService.createSubscriptionTimestamp(result);
      }
      return {id: result.id};
    } catch (error) {
      return validationErrorExternalHandler(error);
    }
  }

  @authorize({allowedRoles: [Roles.MAAS, Roles.PLATFORM], voters: [checkMaas]})
  @intercept(multerInterceptor)
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @intercept(SubscriptionV1AttachmentsInterceptor.BINDING_KEY)
  @post('v1/maas/subscriptions/{subscriptionId}/attachments', {
    'x-controller-name': 'Subscriptions',
    summary: 'Ajoute des justificatifs à une souscription',
    security: SECURITY_SPEC_JWT_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description:
          "Ajouter les justificatifs pour une demande d'aide avec un status brouillon",
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
      [StatusCode.Unauthorized]: {
        description: "L'utilisateur est non connecté",
      },
      [StatusCode.Forbidden]: {
        description:
          "L'utilisateur n'a pas les droits pour ajouter des justificatifs à la demande",
      },
      [StatusCode.NotFound]: {
        description: "Cette demande n'existe pas",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 404,
                name: 'Error',
                message: 'Subscription not found',
                path: '/subscriptionNotFound',
                resourceName: 'Subscription',
              },
            },
          },
        },
      },
      [StatusCode.PreconditionFailed]: {
        description:
          'La demande ou les justificatifs ne rencontrent pas les bonnes conditions',
      },
      [StatusCode.UnprocessableEntity]: {
        description: 'Les justificatifs ne peuvent pas être traités',
      },
    },
  })
  async addAttachments(
    @param.path.string('subscriptionId', {description: `L'identifiant de la demande`})
    subscriptionId: string,
    @requestBody({
      description: `Multipart/form-data pour la creation d'une demande`,
      content: {
        'multipart/form-data': {
          // Skip body parsing
          'x-parser': 'stream',
          schema: {
            type: 'object',
            properties: {
              attachmentExample: {
                description: `Exemple d'ajout d'un document justificatif`,
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
                  metadataId: '',
                },
              },
            },
          },
        },
      },
    })
    attachmentData?: any,
  ): Promise<{id: string} | HttpErrors.HttpError> {
    try {
      const subscription: Subscription = await this.subscriptionRepository.findById(
        subscriptionId,
      );
      let encryptionKey: EncryptionKey | undefined = undefined;
      const collectivity: Collectivity | null = await this.collectivityRepository.findOne(
        {
          where: {id: subscription.funderId},
        },
      );
      const enterprise: Enterprise | null = await this.enterpriseRepository.findOne({
        where: {id: subscription.funderId},
      });

      encryptionKey = collectivity
        ? collectivity.encryptionKey
        : enterprise
        ? enterprise.encryptionKey
        : undefined;

      const metadataId: string | undefined = attachmentData.body.data
        ? JSON.parse(attachmentData.body.data)?.metadataId
        : undefined;
      const citizen: Citizen = await this.citizenService.getCitizenWithAffiliationById(
        this.currentUser.id,
      );
      let formattedSubscriptionAttachments: AttachmentType[] = [];
      let invoicesPdf: Express.Multer.File[] = [];
      let createSubscriptionAttachments: Express.Multer.File[] = [];
      let attachments: Express.Multer.File[] = [];

      const {key, iv}: {key: Buffer; iv: Buffer} = generateAESKey();
      const {encryptKey, encryptIV}: {encryptKey: Buffer; encryptIV: Buffer} =
        encryptAESKey(encryptionKey!.publicKey, key, iv);

      if (attachmentData) {
        createSubscriptionAttachments = attachmentData.files as Express.Multer.File[];
        createSubscriptionAttachments.forEach((attachment: Express.Multer.File) => {
          attachment.buffer = encryptFileHybrid(attachment.buffer, key, iv);
        });
      }

      if (metadataId) {
        const metadata: Metadata = await this.metadataRepository.findById(metadataId);
        invoicesPdf = await generatePdfInvoices(metadata.attachmentMetadata.invoices);
        invoicesPdf.forEach((invoicePdf: Express.Multer.File) => {
          invoicePdf.buffer = encryptFileHybrid(invoicePdf.buffer, key, iv);
        });
      }

      attachments = [...createSubscriptionAttachments, ...invoicesPdf];
      const formattedAttachments: Express.Multer.File[] =
        this.subscriptionService.formatAttachments(attachments);
      formattedSubscriptionAttachments = formattedAttachments?.map(
        (file: Express.Multer.File) => {
          return {
            originalName: file.originalname,
            uploadDate: new Date(),
            proofType: file.fieldname,
            mimeType: file.mimetype,
          };
        },
      );

      if (attachments.length > 0) {
        await this.s3Service.uploadFileListIntoBucket(
          citizen.id,
          subscriptionId,
          formattedAttachments,
        );
        await this.subscriptionRepository.updateById(subscriptionId, {
          attachments: formattedSubscriptionAttachments,
          encryptedAESKey: encryptKey.toString('base64'),
          encryptedIV: encryptIV.toString('base64'),
          encryptionKeyId: encryptionKey!.id,
          encryptionKeyVersion: encryptionKey!.version,
          privateKeyAccess: encryptionKey!.privateKeyAccess
            ? encryptionKey!.privateKeyAccess
            : undefined,
        });
      }

      // Delete metadata once subscription is updated with files
      if (metadataId) {
        await this.metadataRepository.deleteById(metadataId);
      }
      return {id: subscriptionId};
    } catch (error) {
      return validationErrorExternalHandler(error);
    }
  }

  @authorize({allowedRoles: [Roles.MAAS, Roles.PLATFORM], voters: [checkMaas]})
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @intercept(SubscriptionV1FinalizeInterceptor.BINDING_KEY)
  @post('v1/maas/subscriptions/{subscriptionId}/verify', {
    'x-controller-name': 'Subscriptions',
    summary: 'Finalise une souscription',
    security: SECURITY_SPEC_JWT_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Finalisation de la demande',
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
      [StatusCode.Unauthorized]: {
        description: "L'utilisateur est non connecté",
      },
      [StatusCode.Forbidden]: {
        description: "L'utilisateur n'a pas les droits pour finaliser la demande",
      },
      [StatusCode.NotFound]: {
        description: "Cette demande n'existe pas",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 404,
                name: 'Error',
                message: 'Subscription not found',
                path: '/subscriptionNotFound',
                resourceName: 'Subscription',
              },
            },
          },
        },
      },
      [StatusCode.PreconditionFailed]: {
        description: "La demande n'est pas au bon statut",
      },
    },
  })
  async finalizeSubscription(
    @param.path.string('subscriptionId', {description: `L'identifiant de la demande`})
    subscriptionId: string,
  ): Promise<
    | {
        id: string;
        status: SUBSCRIPTION_STATUS;
        rejectionReason?: REJECTION_REASON;
        comment?: string;
      }
    | HttpErrors.HttpError
  > {
    try {
      const subscription = await this.subscriptionRepository.findById(subscriptionId);
      const incentive: Incentive = await this.incentiveRepository.findById(
        subscription.incentiveId,
      );

      let comment: string | undefined, // This returns the message to send.
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
            this.subscriptionService.checkCEEValidity(
              incentive,
              subscription,
              application_timestamp,
            ),
          [ELIGIBILITY_CHECKS_LABEL.EXCLUSION]: () =>
            this.subscriptionService.checkOfferExclusitivity(),
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
            comment = result?.message;
            if (result.code) {
              comment = 'HTTP ' + result.code + (' - ' + comment || '');
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
              comments: comment,
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
        const isCitizenNotificationsDisabled: Boolean =
          incentive?.isCitizenNotificationsDisabled;
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
          const enterprise = await this.enterpriseRepository.findById(
            subscription?.funderId,
          );
          if (enterprise?.isHris) {
            const payload = await this.subscriptionService.preparePayLoad(subscription);
            // Publish to rabbitmq
            await this.rabbitmqService.publishMessage(payload, enterprise?.name);
          }
        }
      }

      // timestamped subscription
      if (incentive?.isCertifiedTimestampRequired) {
        const updatedSubscription: Subscription =
          await this.subscriptionRepository.findById(subscriptionId);
        await this.subscriptionService.createSubscriptionTimestamp(updatedSubscription);
      }

      return {
        id: subscriptionId,
        status: status,
        rejectionReason: rejectionReason,
        comment: comment,
      };
    } catch (error) {
      logger.error(
        `${SubscriptionV1Controller.name} -${
          this.finalizeSubscription.name
        }  error : ${error.message!}`,
      );
      return validationErrorExternalHandler(error);
    }
  }

  @authorize({allowedRoles: [Roles.MAAS], voters: [checkMaas]})
  @get('v1/maas/subscriptions', {
    'x-controller-name': 'Subscriptions',
    summary: 'Retourne les souscriptions',
    security: SECURITY_SPEC_JWT,
    responses: {
      [StatusCode.Success]: {
        description:
          "Ce service permet au citoyen de consulter l'ensemble de ses demandes réalisées",
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
    },
  })
  async findMaasSubscription(): Promise<MaasSubscriptionList[]> {
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

    // add help contact info to subscriptions
    const response: MaasSubscriptionList[] =
      userSubcriptionList &&
      userSubcriptionList.map((subscription: Subscription) => {
        const newSubscription: Subscription = subscription;
        const incentive =
          incentiveList &&
          incentiveList.find(
            (incentive: Incentive) =>
              newSubscription.incentiveId.toString() === incentive.id,
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
  }
}

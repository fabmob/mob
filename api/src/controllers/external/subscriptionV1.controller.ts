import {param, toInterceptor} from '@loopback/rest';
import {inject, intercept, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, post, getModelSchemaRef, requestBody} from '@loopback/rest';
import {authorize} from '@loopback/authorization';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings} from '@loopback/security';

import multer from 'multer';
import {Express} from 'express';

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
} from '../../models';
import {
  IncentiveRepository,
  CitizenRepository,
  SubscriptionRepository,
  CommunityRepository,
  EnterpriseRepository,
  MetadataRepository,
} from '../../repositories';
import {
  checkMaas,
  MailService,
  S3Service,
  IUser,
  RabbitmqService,
  SubscriptionService,
} from '../../services';
import {validationErrorExternalHandler} from '../../validationErrorExternal';
import {
  StatusCode,
  SECURITY_SPEC_JWT,
  SECURITY_SPEC_JWT_KC_PASSWORD,
  SUBSCRIPTION_STATUS,
  Roles,
  AUTH_STRATEGY,
} from '../../utils';
import {generatePdfInvoices} from '../../utils/invoice';
import {INCENTIVE_TYPE} from '../../utils/enum';
import {
  SubscriptionValidation,
  CommonRejection,
  SubscriptionRejection,
} from '../../models';

interface MaasSubscriptionList {
  id: string;
  incentiveId: string;
  incentiveTitle: string;
  funderName: string;
  status: SUBSCRIPTION_STATUS;
  createdAt: Date;
  updatedAt: Date;
  subscriptionValidation?: SubscriptionValidation;
  subscriptionRejection?: SubscriptionRejection;
  contact: string | undefined;
}

const multerInterceptor = toInterceptor(multer({storage: multer.memoryStorage()}).any());
@authenticate(AUTH_STRATEGY.KEYCLOAK)
export class SubscriptionV1Controller {
  constructor(
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @repository(CitizenRepository)
    public citizenRepository: CitizenRepository,
    @repository(MetadataRepository)
    public metadataRepository: MetadataRepository,
    @repository(EnterpriseRepository)
    public enterpriseRepository: EnterpriseRepository,
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
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
  ): Promise<{id: string}> {
    try {
      const incentive = await this.incentiveRepository.findById(subscription.incentiveId);
      const citizen = await this.citizenRepository.findById(this.currentUser.id);
      const newSubscription = new Subscription({
        ...subscription,
        incentiveTitle: incentive.title,
        incentiveTransportList: incentive.transportList,
        citizenId: citizen.id,
        lastName: citizen.lastName,
        firstName: citizen.firstName,
        email: citizen.email,
        city: citizen.city,
        postcode: citizen.postcode,
        birthdate: citizen.birthdate,
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
  ): Promise<{id: string}> {
    try {
      const metadataId = attachmentData.body.data
        ? JSON.parse(attachmentData.body.data)?.metadataId
        : undefined;
      const citizen = await this.citizenRepository.findById(this.currentUser.id);
      let formattedSubscriptionAttachments: AttachmentType[] = [];
      let invoicesPdf: Express.Multer.File[] = [];
      let createSubscriptionAttachments: Express.Multer.File[] = [];
      let attachments: Express.Multer.File[] = [];
      if (attachmentData) {
        createSubscriptionAttachments = attachmentData.files as Express.Multer.File[];
      }

      if (metadataId) {
        const metadata = await this.metadataRepository.findById(metadataId);
        invoicesPdf = await generatePdfInvoices(metadata.attachmentMetadata.invoices);
      }

      attachments = [...createSubscriptionAttachments, ...invoicesPdf];
      const formattedAttachemnts =
        this.subscriptionService.generateFormattedAttachments(attachments);
      formattedSubscriptionAttachments = formattedAttachemnts?.map(
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
          formattedAttachemnts,
        );
        await this.subscriptionRepository.updateById(subscriptionId, {
          attachments: formattedSubscriptionAttachments,
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
  ): Promise<{id: string}> {
    try {
      const subscription = await this.subscriptionRepository.findById(subscriptionId);
      // Change subscription status
      await this.subscriptionRepository.updateById(subscriptionId, {
        status: SUBSCRIPTION_STATUS.TO_PROCESS,
      });
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
      // Send a notification as an email
      await this.mailService.sendMailAsHtml(
        subscription.email,
        'Confirmation de prise en compte de votre demande',
        'demandes-a-traiter',
      );
      return {id: subscriptionId};
    } catch (error) {
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

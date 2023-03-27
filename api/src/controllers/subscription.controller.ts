/* eslint-disable max-len */
import {AnyObject, repository, Count} from '@loopback/repository';
import {inject, service, intercept} from '@loopback/core';
import {
  param,
  get,
  getModelSchemaRef,
  requestBody,
  Response,
  RestBindings,
  post,
  HttpErrors,
  patch,
  toInterceptor,
} from '@loopback/rest';
import {authorize} from '@loopback/authorization';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings} from '@loopback/security';
import {Express} from 'express';
import {isEqual, intersection, capitalize} from 'lodash';
import multer from 'multer';
import {endOfYear, startOfYear} from 'date-fns';

import {
  AttachmentMetadata,
  AttachmentType,
  Citizen,
  CommonRejection,
  CreateSubscription,
  EncryptionKey,
  Enterprise,
  Funder,
  Incentive,
  IncentiveEligibilityChecks,
  Invoice,
  Metadata,
  Subscription,
  SubscriptionTimestamp,
} from '../models';
import {
  CommunityRepository,
  SubscriptionRepository,
  UserRepository,
  MetadataRepository,
  IncentiveRepository,
  IncentiveEligibilityChecksRepository,
  SubscriptionTimestampRepository,
  FunderRepository,
} from '../repositories';
import {
  SubscriptionService,
  S3Service,
  checkMaas,
  MailService,
  RabbitmqService,
  CitizenService,
} from '../services';
import {validationErrorExternalHandler} from '../validationErrorExternal';
import {BadRequestError, ConflictError, ForbiddenError} from '../validationError';
import {
  ResourceName,
  StatusCode,
  SECURITY_SPEC_KC_PASSWORD,
  SECURITY_SPEC_KC_CREDENTIALS_KC_PASSWORD,
  INCENTIVE_TYPE,
  Roles,
  SUBSCRIPTION_STATUS,
  AUTH_STRATEGY,
  SECURITY_SPEC_JWT,
  SECURITY_SPEC_KC_CREDENTIALS,
  IUser,
  SECURITY_SPEC_JWT_KC_PASSWORD,
  REJECTION_REASON,
  SUBSCRIPTION_CHECK_MODE,
  ELIGIBILITY_CHECKS_LABEL,
  AdditionalProps,
  PAYMENT_MODE,
  Logger,
} from '../utils';
import {
  AffiliationInterceptor,
  SubscriptionFinalizeInterceptor,
  SubscriptionInterceptor,
  SubscriptionMetadataInterceptor,
  SubscriptionAttachmentsInterceptor,
} from '../interceptors';
import {generatePdfInvoices, getInvoiceFilename} from '../utils/invoice';
import {TAG_MAAS, WEBSITE_FQDN} from '../constants';
import {
  ValidationMultiplePayment,
  SubscriptionValidation,
  ValidationSinglePayment,
  ValidationNoPayment,
  NoReason,
  OtherReason,
  SubscriptionRejection,
} from '../models';
import {defaultSwaggerError} from './utils/swagger-errors';
import {encryptFileHybrid, generateAESKey, encryptAESKey} from '../utils/encryption';

/**
 * set the list pagination value
 */
const PAGINATION_LIMIT = 200;

interface SubscriptionsWithCount {
  subscriptions: Subscription[];
  count: number;
}

const multerInterceptor = toInterceptor(multer({storage: multer.memoryStorage()}).any());
@authenticate(AUTH_STRATEGY.KEYCLOAK)
export class SubscriptionController {
  constructor(
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @service(S3Service)
    private s3Service: S3Service,
    @service(SubscriptionService)
    private subscriptionService: SubscriptionService,
    @service(CitizenService)
    private citizenService: CitizenService,
    @repository(CommunityRepository)
    private communityRepository: CommunityRepository,
    @repository(MetadataRepository)
    private metadataRepository: MetadataRepository,
    @repository(UserRepository)
    private userRepository: UserRepository,
    @repository(IncentiveRepository)
    private incentiveRepository: IncentiveRepository,
    @repository(IncentiveEligibilityChecksRepository)
    private incentiveEligibilityChecksRepository: IncentiveEligibilityChecksRepository,
    @repository(FunderRepository)
    private funderRepository: FunderRepository,
    @service(RabbitmqService)
    public rabbitmqService: RabbitmqService,
    @repository(SubscriptionTimestampRepository)
    public subscriptionTimestampRepository: SubscriptionTimestampRepository,
    @inject(SecurityBindings.USER)
    private currentUser: IUser,
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @inject('services.MailService')
    public mailService: MailService,
  ) {}

  @authorize({allowedRoles: [Roles.MAAS, Roles.PLATFORM], voters: [checkMaas]})
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @intercept(SubscriptionInterceptor.BINDING_KEY)
  @post('v1/subscriptions', {
    'x-controller-name': 'Subscriptions',
    summary: 'Crée une souscription',
    description: "Création initiale d'une souscription où additionalProp correspond aux champs spécifiques",
    security: SECURITY_SPEC_JWT_KC_PASSWORD,
    tags: ['Subscriptions', TAG_MAAS],
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
    this.response.status(201);
    try {
      const incentive: Incentive = await this.incentiveRepository.findById(subscription.incentiveId);
      Logger.debug(SubscriptionController.name, this.createSubscription.name, 'Incentive data', incentive);

      const citizen: Citizen = await this.citizenService.getCitizenWithAffiliationById(this.currentUser.id);
      Logger.debug(SubscriptionController.name, this.createSubscription.name, 'Citizen data', citizen);

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
        SubscriptionController.name,
        this.createSubscription.name,
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
          SubscriptionController.name,
          this.createSubscription.name,
          'Timestamp created for subscriptionId',
          result.id,
        );
      }
      return {id: result.id};
    } catch (error) {
      Logger.error(SubscriptionController.name, this.createSubscription.name, 'Error', error);
      return validationErrorExternalHandler(error);
    }
  }

  @authorize({allowedRoles: [Roles.MAAS, Roles.PLATFORM], voters: [checkMaas]})
  @intercept(multerInterceptor)
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @intercept(SubscriptionAttachmentsInterceptor.BINDING_KEY)
  @post('v1/subscriptions/{subscriptionId}/attachments', {
    'x-controller-name': 'Subscriptions',
    summary: 'Ajoute des justificatifs à une souscription',
    security: SECURITY_SPEC_JWT_KC_PASSWORD,
    tags: ['Subscriptions', TAG_MAAS],
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
  async addAttachmentsToSubscription(
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
      const subscription: Subscription = await this.subscriptionRepository.findById(subscriptionId);
      Logger.debug(
        SubscriptionController.name,
        this.addAttachmentsToSubscription.name,
        'Subscription data',
        subscription,
      );

      let encryptionKey: EncryptionKey | undefined = undefined;
      const funder: Funder = await this.funderRepository.findById(subscription.funderId);
      Logger.debug(
        SubscriptionController.name,
        this.addAttachmentsToSubscription.name,
        'Funder data',
        funder,
      );

      encryptionKey = funder.encryptionKey;

      const metadataId: string | undefined = attachmentData.body.data
        ? JSON.parse(attachmentData.body.data)?.metadataId
        : undefined;

      const citizen: Citizen = await this.citizenService.getCitizenWithAffiliationById(this.currentUser.id);
      Logger.debug(
        SubscriptionController.name,
        this.addAttachmentsToSubscription.name,
        'Citizen data',
        citizen,
      );

      let formattedSubscriptionAttachments: AttachmentType[] = [];
      let invoicesPdf: Express.Multer.File[] = [];
      let createSubscriptionAttachments: Express.Multer.File[] = [];
      let attachments: Express.Multer.File[] = [];

      const {key, iv}: {key: Buffer; iv: Buffer} = generateAESKey();
      const {encryptKey, encryptIV}: {encryptKey: Buffer; encryptIV: Buffer} = encryptAESKey(
        encryptionKey!.publicKey,
        key,
        iv,
      );

      if (attachmentData) {
        createSubscriptionAttachments = attachmentData.files as Express.Multer.File[];
        createSubscriptionAttachments.forEach((attachment: Express.Multer.File) => {
          attachment.buffer = encryptFileHybrid(attachment.buffer, key, iv);
        });
        Logger.info(
          SubscriptionController.name,
          this.addAttachmentsToSubscription.name,
          'Attachment data encrypted',
        );
      }

      if (metadataId) {
        const metadata: Metadata = await this.metadataRepository.findById(metadataId);
        invoicesPdf = await generatePdfInvoices(metadata.attachmentMetadata.invoices);
        Logger.info(
          SubscriptionController.name,
          this.addAttachmentsToSubscription.name,
          'Metadata pdf generated',
          metadataId,
        );

        invoicesPdf.forEach((invoicePdf: Express.Multer.File) => {
          invoicePdf.buffer = encryptFileHybrid(invoicePdf.buffer, key, iv);
        });
        Logger.info(
          SubscriptionController.name,
          this.addAttachmentsToSubscription.name,
          'Attachment data encrypted',
        );
      }

      attachments = [...createSubscriptionAttachments, ...invoicesPdf];
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
        Logger.info(
          SubscriptionController.name,
          this.addAttachmentsToSubscription.name,
          'Attachments uploaded',
        );

        await this.subscriptionRepository.updateById(subscriptionId, {
          attachments: formattedSubscriptionAttachments,
          encryptedAESKey: encryptKey.toString('base64'),
          encryptedIV: encryptIV.toString('base64'),
          encryptionKeyId: encryptionKey!.id,
          encryptionKeyVersion: encryptionKey!.version,
          privateKeyAccess: encryptionKey!.privateKeyAccess ? encryptionKey!.privateKeyAccess : undefined,
        });
        Logger.info(
          SubscriptionController.name,
          this.addAttachmentsToSubscription.name,
          'Subscription updated',
          subscriptionId,
        );
      }

      // Delete metadata once subscription is updated with files
      if (metadataId) {
        await this.metadataRepository.deleteById(metadataId);
        Logger.info(
          SubscriptionController.name,
          this.addAttachmentsToSubscription.name,
          'Metadata deleted',
          metadataId,
        );
      }
      return {id: subscriptionId};
    } catch (error) {
      Logger.error(SubscriptionController.name, this.addAttachmentsToSubscription.name, 'Error', error);
      return validationErrorExternalHandler(error);
    }
  }

  /**
   * get the subscriptions list
   * @param status that subscription status (VALIDATED or REJECTED)
   * @param incentiveId the incentive id
   * @param lastName the last name related to the subscription
   * @param citizenId the citizen id
   * @returns subscription list
   */
  @authorize({allowedRoles: [Roles.MAAS, Roles.MANAGERS, Roles.CITIZENS]})
  @get('/v1/subscriptions', {
    'x-controller-name': 'Subscriptions',
    summary: 'Retourne les souscriptions',
    security: SECURITY_SPEC_JWT_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'La liste des souscriptions',
        content: {
          'application/json': {
            schema: {
              oneOf: [
                {
                  type: 'array',
                  items: getModelSchemaRef(Subscription),
                },
                {
                  type: 'object',
                  properties: {
                    subscriptions: getModelSchemaRef(Subscription),
                    count: {
                      type: 'number',
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
  async find(
    @param.query.string('status', {
      description: `Statut (BROUILLON | A_TRAITER | VALIDEE | REJETEE)`,
    })
    status: string,
    @param.query.string('incentiveId', {
      description: `Identifiant de l'aide`,
    })
    incentiveId?: string,
    @param.query.string('incentiveType', {
      description: `Type de l'aide`,
    })
    incentiveType?: string,
    @param.query.string('idCommunities', {
      description: `Identifiants des communautés financeur (séparés par des virgules)`,
    })
    idCommunities?: string,
    @param.query.string('lastName', {
      description: `Nom du citoyen`,
    })
    lastName?: string,
    @param.query.string('citizenId', {
      description: `Identifiant du citoyen`,
    })
    citizenId?: string,
    @param.query.string('year', {
      description: `Année`,
    })
    year?: string,
    @param.query.string('skip', {
      description: `Filtre pour omettre le nombre spécifié de résultats retournés`,
    })
    skip?: number | undefined,
  ): Promise<Subscription[] | SubscriptionsWithCount> {
    try {
      const withParams: AnyObject[] = [];

      let funder: Funder | null = null;

      if (this.currentUser.funderName) {
        funder = await this.funderRepository.getFunderByNameAndType(
          this.currentUser.funderName!,
          this.currentUser.funderType!,
        );
      }

      if (funder) {
        withParams.push({funderId: funder!.id});
      }
      Logger.debug(SubscriptionController.name, this.find.name, 'Funder data', funder);

      const userId = this.currentUser.id;

      let communityIds: '' | string[] | null | undefined = null;

      communityIds = userId && (await this.userRepository.findOne({where: {id: userId}}))?.communityIds;

      if (communityIds && communityIds?.length > 0) {
        withParams.push({communityId: {inq: communityIds}});
      }

      Logger.debug(SubscriptionController.name, this.find.name, 'Community Ids', communityIds);
      if (idCommunities) {
        const match: AnyObject[] = [];
        const idCommunitiesList = idCommunities.split(',');

        Logger.debug(SubscriptionController.name, this.find.name, 'Funder data', funder);
        if (funder?.id && idCommunitiesList && idCommunitiesList.length > 0) {
          const communities = await this.communityRepository.findByFunderId(funder.id);

          if (
            communities &&
            communities.length > 0 &&
            isEqual(
              intersection(
                communities.map(({id}) => id),
                idCommunitiesList,
              ).sort(),
              idCommunitiesList.sort(),
            )
          ) {
            for (const row of idCommunitiesList) {
              match.push({communityId: row});
            }
            withParams.push({or: match});
          }
        }
        if (match.length === 0) {
          throw new ForbiddenError(SubscriptionController.name, this.find.name, {idCommunitiesList});
        }
      }

      if (incentiveId) {
        const match: AnyObject[] = [];
        const incentiveIdList = incentiveId.split(',');
        for (const row of incentiveIdList) {
          match.push({incentiveId: row});
        }
        withParams.push({or: match});
      }

      if (incentiveType) {
        const match: AnyObject[] = [];
        const incentiveTypeList = incentiveType.split(',');
        for (const row of incentiveTypeList) {
          match.push({incentiveType: row});
        }
        withParams.push({or: match});
      }

      if (lastName) {
        withParams.push({lastName: new RegExp('.*' + lastName + '.*', 'i')});
      }

      if (citizenId) {
        withParams.push({citizenId: citizenId});
      }

      if (year) {
        const yearMatch: AnyObject[] = [];
        const yearList = year.split(',');
        for (const yearItem of yearList) {
          const match: AnyObject[] = [];
          match.push({
            updatedAt: {
              gte: startOfYear(new Date(parseInt(yearItem), 0)),
            },
          });
          match.push({
            updatedAt: {
              lte: endOfYear(new Date(parseInt(yearItem), 0)),
            },
          });
          yearMatch.push({and: match});
        }
        withParams.push({or: yearMatch});
      }

      if (status) {
        const match: AnyObject[] = [];
        const statusList = status.split(',');
        if (status.includes(SUBSCRIPTION_STATUS.DRAFT)) {
          // ticket 1827 should not return subscription with statut BROUILLON
          return {
            subscriptions: [],
            count: 0,
          };
        }
        for (const row of statusList) {
          match.push({status: row});
        }
        withParams.push({or: match});
      } else {
        withParams.push({status: {neq: SUBSCRIPTION_STATUS.DRAFT}});
      }

      if (citizenId) {
        Logger.debug(SubscriptionController.name, this.find.name, 'Find Params', withParams);

        // get citizen's subscription
        const subscriptionsResponse = await this.subscriptionRepository.find({
          limit: 10,
          skip,
          order: ['createdAt DESC'],
          where: {
            and: withParams,
          },
        });

        // params to get count of citizen's subscription
        const queryParams: object = {
          funderId: funder?.id,
          citizenId: citizenId,
          communityId: communityIds ? {inq: communityIds} : undefined,
          status: {neq: SUBSCRIPTION_STATUS.DRAFT},
          updatedAt: year
            ? {
                gte: startOfYear(new Date(parseInt(year), 0)),
                lte: endOfYear(new Date(parseInt(year), 0)),
              }
            : undefined,
        };
        Logger.debug(SubscriptionController.name, this.find.name, 'Count Params', queryParams);

        const subscriptionCount: Count = await this.subscriptionRepository.count(queryParams);

        return {
          subscriptions: subscriptionsResponse,
          ...subscriptionCount,
        };
      } else {
        return await this.subscriptionRepository.find({
          limit: PAGINATION_LIMIT,
          where: {
            and: withParams,
          },
        });
      }
    } catch (error) {
      Logger.error(SubscriptionController.name, this.find.name, 'Error', error);
      throw error;
    }
  }

  /**
   * download the validated demands
   * @param funderName is the funder name as collectivity or enterprise
   * @param funderType is the funder type or nature
   * @param Response the validated subscriptions from founder name and funder type
   */
  @authorize({allowedRoles: [Roles.MANAGERS]})
  @get('/v1/subscriptions/export', {
    'x-controller-name': 'Subscriptions',
    summary: 'Exporte les souscriptions validées du financeur connecté',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Fichier Microsoft Excel contenant les souscriptions validées du financeur connecté',
        content: {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
            schema: {type: 'string', format: 'base64'},
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async generateExcel(@inject(RestBindings.Http.RESPONSE) Response: Response): Promise<void> {
    try {
      const funder: Funder | null = await this.funderRepository.getFunderByNameAndType(
        this.currentUser.funderName!,
        this.currentUser.funderType!,
      );

      if (!funder) {
        throw new BadRequestError(
          SubscriptionController.name,
          this.generateExcel.name,
          'Funder not found',
          '/downloadXlsx',
          ResourceName.Subscription,
          this.currentUser.funderName,
        );
      }

      const withParams: AnyObject[] = [{funderId: funder!.id}, {status: SUBSCRIPTION_STATUS.VALIDATED}];

      const userId = this.currentUser.id;

      let communityIds: '' | string[] | null | undefined = null;

      communityIds = userId && (await this.userRepository.findOne({where: {id: userId}}))?.communityIds;
      Logger.debug(SubscriptionController.name, this.generateExcel.name, 'Community Id list', communityIds);

      if (communityIds && communityIds?.length > 0) {
        withParams.push({communityId: {inq: communityIds}});
      }

      const subscriptionList = await this.subscriptionRepository.find({
        order: ['updatedAT ASC'],
        where: {
          and: withParams,
        },
      });
      Logger.debug(
        SubscriptionController.name,
        this.generateExcel.name,
        'Subscription list',
        subscriptionList,
      );

      if (subscriptionList && subscriptionList.length > 0) {
        const buffer = await this.subscriptionService.generateExcelValidatedIncentives(subscriptionList);
        Logger.info(SubscriptionController.name, this.generateExcel.name, 'Buffer generated');

        Response.status(200)
          .contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
          .send(buffer);
      } else if (subscriptionList && subscriptionList.length === 0) {
        throw new BadRequestError(
          SubscriptionController.name,
          this.generateExcel.name,
          'Aucune demande validée à télécharger',
          '/downloadXlsx',
          ResourceName.Subscription,
          withParams,
        );
      }
    } catch (error) {
      Logger.error(SubscriptionController.name, this.generateExcel.name, 'Error', error);
      throw error;
    }
  }

  /**
   * download file by id
   * @param subscriptionId the requested subscription id
   * @param filename the given name of the downloaded file
   * @returns the response object for file download
   */
  @authorize({allowedRoles: [Roles.MANAGERS, Roles.SIRH_BACKEND]})
  @intercept(SubscriptionInterceptor.BINDING_KEY)
  @get('/v1/subscriptions/{subscriptionId}/attachments/{filename}', {
    'x-controller-name': 'Subscriptions',
    summary: "Récupère le justificatif d'une souscription",
    security: SECURITY_SPEC_KC_CREDENTIALS_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Le fichier du justificatif associé à la souscription (buffer UTF-8 en Unicode)',
        content: {
          'application/octet-stream': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async getSubscriptionFileByName(
    @param.path.string('subscriptionId', {description: `L'identifiant de la souscription`})
    subscriptionId: string,
    @param.path.string('filename', {
      description: `Le nom de fichier du justificatif à récupérer`,
    })
    filename: string,
  ): Promise<AnyObject> {
    try {
      const subscription: Subscription = await this.subscriptionRepository.findById(subscriptionId);
      Logger.debug(
        SubscriptionController.name,
        this.getSubscriptionFileByName.name,
        'Subscription data',
        subscription,
      );

      const downloadBucket = await this.s3Service.downloadFileBuffer(
        subscription.citizenId,
        subscriptionId,
        filename,
      );
      Logger.info(
        SubscriptionController.name,
        this.getSubscriptionFileByName.name,
        'Bucket buffer generated',
        downloadBucket,
      );
      this.response.status(200).contentType('application/octet-stream').send(downloadBucket);
      return downloadBucket;
    } catch (error) {
      Logger.error(SubscriptionController.name, this.getSubscriptionFileByName.name, 'Error', error);
      return validationErrorExternalHandler(error);
    }
  }

  /**
   * get the subscription by id
   * @param subscriptionId the subscription id
   * @param filter the subscriptions search filter
   * @returns the subscriptions objects
   */
  @authorize({allowedRoles: [Roles.MAAS, Roles.CITIZENS, Roles.MANAGERS]})
  @intercept(SubscriptionInterceptor.BINDING_KEY)
  @get('/v1/subscriptions/{subscriptionId}', {
    'x-controller-name': 'Subscriptions',
    summary: "Retourne le détail d'une souscription",
    security: SECURITY_SPEC_JWT_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Le détail de la souscription',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Subscription),
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async findById(
    @param.path.string('subscriptionId', {description: `L'identifiant de la souscription`})
    subscriptionId: string,
  ): Promise<Subscription> {
    return this.subscriptionRepository.findById(subscriptionId);
  }

  /**
   * subscriptions validation by subscription id
   * @param subscriptionId the subscription id
   */
  @authorize({allowedRoles: [Roles.MANAGERS]})
  @intercept(SubscriptionInterceptor.BINDING_KEY)
  @post('/v1/subscriptions/{subscriptionId}/validate', {
    'x-controller-name': 'Subscriptions',
    summary: 'Valide une souscription',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'La souscription est validée',
      },
      ...defaultSwaggerError,
    },
  })
  async validate(
    @param.path.string('subscriptionId', {description: `L'identifiant de la souscription`})
    subscriptionId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            anyOf: [
              getModelSchemaRef(ValidationMultiplePayment),
              getModelSchemaRef(ValidationSinglePayment),
              getModelSchemaRef(ValidationNoPayment),
            ],
          },
        },
      },
    })
    payment: SubscriptionValidation,
  ): Promise<void> {
    try {
      // Vérification de l'existence de la subscription
      const subscription: Subscription = await this.subscriptionRepository.findById(subscriptionId);
      Logger.debug(SubscriptionController.name, this.validate.name, 'Subscription data', subscription);
      if (subscription.status === SUBSCRIPTION_STATUS.TO_PROCESS) {
        const result = this.subscriptionService.checkPayment(payment);
        Logger.debug(SubscriptionController.name, this.validate.name, 'Payment data', result);
        await this.subscriptionService.validateSubscription(result, subscription);
        Logger.info(
          SubscriptionController.name,
          this.validate.name,
          'Subscription validated',
          subscriptionId,
        );
      } else {
        throw new ConflictError(
          SubscriptionController.name,
          this.validate.name,
          'subscriptions.error.bad.status',
          '/subscriptionBadStatus',
          ResourceName.Subscription,
          subscription.status,
          SUBSCRIPTION_STATUS.TO_PROCESS,
        );
      }
    } catch (error) {
      Logger.error(SubscriptionController.name, this.validate.name, 'Error', error);
      throw error;
    }
  }

  /**
   * Subscriptions rejection by subscription id
   * @param subscriptionId the subscription id
   * @param reason the property to update
   */
  @authorize({allowedRoles: [Roles.MANAGERS]})
  @intercept(SubscriptionInterceptor.BINDING_KEY)
  @post('/v1/subscriptions/{subscriptionId}/reject', {
    'x-controller-name': 'Subscriptions',
    summary: 'Rejette une souscription',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'La souscription est rejetée',
      },
      ...defaultSwaggerError,
    },
  })
  async reject(
    @param.path.string('subscriptionId', {description: `L'identifiant de la souscription`})
    subscriptionId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            oneOf: [getModelSchemaRef(NoReason), getModelSchemaRef(OtherReason)],
          },
        },
      },
    })
    reason: SubscriptionRejection,
  ): Promise<void> {
    try {
      // Vérification de l'existence de la subscription
      const subscription: Subscription = await this.subscriptionRepository.findById(subscriptionId);
      Logger.debug(SubscriptionController.name, this.reject.name, 'Subscription data', subscription);
      if (subscription.status === SUBSCRIPTION_STATUS.TO_PROCESS) {
        const result = this.subscriptionService.checkRefusMotif(reason);
        Logger.debug(SubscriptionController.name, this.reject.name, 'Reject data', result);
        await this.subscriptionService.rejectSubscription(result, subscription);
        Logger.info(SubscriptionController.name, this.reject.name, 'Subscription rejected', subscriptionId);
      } else {
        throw new ConflictError(
          SubscriptionController.name,
          this.validate.name,
          'subscriptions.error.bad.status',
          '/subscriptionBadStatus',
          ResourceName.Subscription,
          subscription.status,
          SUBSCRIPTION_STATUS.TO_PROCESS,
        );
      }
    } catch (error) {
      Logger.error(SubscriptionController.name, this.reject.name, 'Error', error);
      throw error;
    }
  }

  @authorize({allowedRoles: [Roles.PLATFORM]})
  @intercept(SubscriptionMetadataInterceptor.BINDING_KEY)
  @get('v1/subscriptions/metadata/{metadataId}', {
    'x-controller-name': 'Subscriptions',
    summary: "Récupère les métadonnées d'une souscription",
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Les métadonnées retournées',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                incentiveId: {
                  description: `Identifiant de l'aide`,
                  type: 'string',
                  example: '',
                },
                citizenId: {
                  description: `Identifiant du citoyen`,
                  type: 'string',
                  example: '',
                },
                attachmentMetadata: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      fileName: {
                        description: `Nom du fichier de la preuve d'achat`,
                        type: 'string',
                        example: '03-03-2021_Forfait_Navigo_Mois_Bob_RASOVSKY.pdf',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async getMetadata(
    @param.path.string('metadataId', {
      description: `L'identifiant des métadonnées de justificatifs d'achats`,
    })
    metadataId: string,
  ): Promise<
    | {
        incentiveId: string;
        citizenId: string;
        attachmentMetadata: {fileName: string}[];
      }
    | HttpErrors.HttpError
  > {
    try {
      const metadata: Metadata = await this.metadataRepository.findById(metadataId);
      Logger.debug(SubscriptionController.name, this.getMetadata.name, 'Metadata data', metadata);
      // Get fileName for each invoices
      const fileNameList = metadata.attachmentMetadata.invoices.map((invoice: Invoice) => {
        return {fileName: getInvoiceFilename(invoice)};
      });
      Logger.debug(SubscriptionController.name, this.getMetadata.name, 'FileName list', fileNameList);

      return {
        incentiveId: metadata.incentiveId,
        citizenId: metadata.citizenId,
        attachmentMetadata: fileNameList,
      };
    } catch (error) {
      Logger.error(SubscriptionController.name, this.getMetadata.name, 'Error', error);
      return validationErrorExternalHandler(error);
    }
  }

  /**
   * get the Subscriptions Timestamp list
   * @param subscriptionId the subscription Id
   * @param startDate Start Date
   * @param endDate End Date
   * @returns SubscriptionTimestamp list
   */
  @authorize({allowedRoles: [Roles.MAAS, Roles.MAAS_BACKEND]})
  @get('/v1/subscriptions/timestamps', {
    'x-controller-name': 'Subscriptions',
    summary: `Récupère les horodatages de souscriptions.`,
    description: `Ce service permet de récupérer les états de la souscription horodatés 
    et les jetons d'horodatage associés.`,
    tags: ['Subscriptions', TAG_MAAS],
    security: SECURITY_SPEC_KC_CREDENTIALS,
    responses: {
      [StatusCode.Success]: {
        description: 'La liste des horodatages de souscriptions',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(SubscriptionTimestamp),
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async getTimestamps(
    @param.query.string('subscriptionId', {
      description: `Identifiant de la souscription`,
    })
    subscriptionId?: string,
    @param.query.date('startDate', {
      description: `Date de début au format YYYY-MM-DD`,
    })
    startDate?: Date,
    @param.query.date('endDate', {
      description: `Date de fin au format YYYY-MM-DD`,
    })
    endDate?: Date,
  ): Promise<SubscriptionTimestamp[] | HttpErrors.HttpError> {
    try {
      const funders: Funder[] = await this.funderRepository.find({
        where: {name: {inq: this.currentUser.groups}},
      });

      const funderIdList: string[] = funders.map((funder: Funder) => funder.id);

      // Filter subscriptionId and funderIdList
      let queryParams: Record<string, any> = {
        subscriptionId: subscriptionId,
        'subscription.funderId': {inq: funderIdList},
      };

      if (startDate && endDate) {
        queryParams = {
          ...queryParams,
          createdAt: {between: [startDate, endDate]},
        };
      } else {
        // Filter startDate
        if (startDate) {
          queryParams = {
            ...queryParams,
            createdAt: {gt: startDate},
          };
        }

        // Filter endDate
        if (endDate) {
          queryParams = {
            ...queryParams,
            createdAt: {
              lt: endDate,
            },
          };
        }
      }
      Logger.debug(SubscriptionController.name, this.getTimestamps.name, 'Params', queryParams);

      const subscriptionTimestamp: SubscriptionTimestamp[] = await this.subscriptionTimestampRepository.find({
        where: queryParams,
      });

      return subscriptionTimestamp;
    } catch (error) {
      Logger.error(SubscriptionController.name, this.getTimestamps.name, 'Error', error);
      return validationErrorExternalHandler(error);
    }
  }

  @authorize({allowedRoles: [Roles.MAAS], voters: [checkMaas]})
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @intercept(SubscriptionMetadataInterceptor.BINDING_KEY)
  @post('v1/subscriptions/metadata', {
    'x-controller-name': 'Subscriptions',
    summary: "Crée des métadonnées de justificatifs d'achat liées à une souscription",
    security: SECURITY_SPEC_JWT,
    tags: ['Subscriptions', TAG_MAAS],
    responses: {
      [StatusCode.Created]: {
        description: 'Les métadonnées sont enregistrées',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                subscriptionURL: {
                  description: `URL de redirection pour initier la souscription à l'aide`,
                  type: 'string',
                  example:
                    'https://website.${env}.moncomptemobilite.fr/subscriptions/new?incentiveId=6d0efef1-4dc9-422e-a17d-40c1bf1c37c4&metadataId=6d0efef1-4dc9-422e-a17d-40c1bf1c37c4',
                },
                metadataId: {
                  description: `Identifiant des metadonnées`,
                  type: 'string',
                  example: 'string',
                },
              },
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async createMetadata(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'MetadataPost',
            allOf: [
              {
                type: 'object',
                properties: {
                  incentiveId: {
                    type: 'string',
                    example: '',
                  },
                },
                required: ['incentiveId'],
              },
              {
                type: 'object',
                properties: {
                  attachmentMetadata: {'x-ts-type': AttachmentMetadata},
                },
                required: ['attachmentMetadata'],
              },
            ],
          },
        },
      },
    })
    metadata: Omit<Metadata, 'id' | 'citizenId' | 'createdAt'>,
  ): Promise<Response<{subscriptionURL: string; metadataId: string}> | HttpErrors.HttpError> {
    this.response.status(201);
    try {
      const result = await this.metadataRepository.create(metadata);
      Logger.info(SubscriptionController.name, this.createMetadata.name, 'Metadata created', result.id);

      return this.response.status(201).send({
        subscriptionURL: `${WEBSITE_FQDN}/subscriptions/new?incentiveId=${result.incentiveId}&metadataId=${result.id}`,
        metadataId: result.id,
      });
    } catch (error) {
      Logger.error(SubscriptionController.name, this.createMetadata.name, 'Error', error);
      return validationErrorExternalHandler(error);
    }
  }

  @authorize({allowedRoles: [Roles.MAAS], voters: [checkMaas]})
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @intercept(SubscriptionInterceptor.BINDING_KEY)
  @patch('/v1/subscriptions/{subscriptionId}', {
    'x-controller-name': 'Subscriptions',
    summary: 'Modifie une souscription',
    security: SECURITY_SPEC_JWT,
    tags: ['Subscriptions', TAG_MAAS],
    responses: {
      [StatusCode.NoContent]: {
        description: 'Modification de la souscription réussie',
      },
      ...defaultSwaggerError,
    },
  })
  async updateById(
    @param.path.string('subscriptionId', {description: `L'identifiant de la souscription`})
    subscriptionId: string,
    @requestBody({
      description: "Des champs spécifiques attendus pour la souscription à l'aide",
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              specificFieldString: {
                type: 'string',
                example: 'example',
              },
              specificFieldNumber: {
                type: 'number',
                example: 2,
              },
              specificFieldChoiceList: {
                type: 'array',
                items: {
                  type: 'string',
                },
                example: ['example'],
              },
              specificFieldDate: {
                type: 'string',
                example: '2022-12-06',
              },
            },
          },
        },
      },
    })
    rawSubscriptionSpecificFields: {[key: string]: string | number | string[] | Date},
  ): Promise<void> {
    try {
      const subscription: Subscription = await this.subscriptionRepository.findById(subscriptionId);
      Logger.debug(SubscriptionController.name, this.updateById.name, 'Subscription data', subscription);

      const updatedSpecificFields: Record<string, string | number | string[] | Date> = {
        ...subscription.specificFields!,
        ...rawSubscriptionSpecificFields,
      };

      Logger.debug(
        SubscriptionController.name,
        this.updateById.name,
        'Spec fied data',
        updatedSpecificFields,
      );

      // Update subscription specific fields
      await this.subscriptionRepository.updateById(subscriptionId, {
        specificFields: updatedSpecificFields,
      });

      Logger.info(SubscriptionController.name, this.updateById.name, 'Subscription updated', subscriptionId);

      subscription.specificFields = updatedSpecificFields;
      const incentive: Incentive = await this.incentiveRepository.findById(subscription.incentiveId);

      // timestamped subscription
      if (incentive?.isCertifiedTimestampRequired) {
        await this.subscriptionService.createSubscriptionTimestamp(
          subscription,
          `PATCH v1/subscriptions/${subscriptionId}`,
          this.currentUser.clientName,
        );
        Logger.info(
          SubscriptionController.name,
          this.updateById.name,
          'Timestamp created for subscriptionId',
          subscriptionId,
        );
      }
    } catch (error) {
      Logger.error(SubscriptionController.name, this.updateById.name, 'Error', error);
      throw error;
    }
  }

  @authorize({allowedRoles: [Roles.MAAS, Roles.PLATFORM], voters: [checkMaas]})
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @intercept(SubscriptionFinalizeInterceptor.BINDING_KEY)
  @post('v1/subscriptions/{subscriptionId}/verify', {
    'x-controller-name': 'Subscriptions',
    summary: 'Finalise une souscription',
    tags: ['Subscriptions', TAG_MAAS],
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
  async finalizeSubscription(
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
      const subscription: Subscription = await this.subscriptionRepository.findById(subscriptionId);
      Logger.debug(
        SubscriptionController.name,
        this.finalizeSubscription.name,
        'Subscription data',
        subscription,
      );

      const incentive: Incentive = await this.incentiveRepository.findById(subscription.incentiveId);
      Logger.debug(SubscriptionController.name, this.finalizeSubscription.name, 'Incentive data', incentive);

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
        Logger.debug(
          SubscriptionController.name,
          this.finalizeSubscription.name,
          'Eligibility check data',
          eligibilityChecks,
        );

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
          Logger.debug(
            SubscriptionController.name,
            this.finalizeSubscription.name,
            `${control.label} result`,
            result,
          );

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
        Logger.debug(SubscriptionController.name, this.finalizeSubscription.name, 'Is eligible', isEligible);
        if (isEligible) {
          // Validate subscription
          await this.subscriptionService.validateSubscription(
            {additionalProperties: additionalProps, mode: PAYMENT_MODE.NONE},
            subscription,
            application_timestamp,
          );
          Logger.info(
            SubscriptionController.name,
            this.finalizeSubscription.name,
            'Subscription validated',
            subscriptionId,
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
          Logger.info(
            SubscriptionController.name,
            this.finalizeSubscription.name,
            'Subscription rejected',
            subscriptionId,
          );

          status = SUBSCRIPTION_STATUS.REJECTED;
        }
      } else {
        // Change subscription status
        await this.subscriptionRepository.updateById(subscriptionId, {
          status: SUBSCRIPTION_STATUS.TO_PROCESS,
        });
        Logger.info(
          SubscriptionController.name,
          this.finalizeSubscription.name,
          'Subscription updated',
          subscriptionId,
        );

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
          Logger.info(
            SubscriptionController.name,
            this.finalizeSubscription.name,
            'Subscription email sent',
            subscriptionId,
          );
        }

        // check if the funder is entreprise and if its HRIS to publish msg to rabbitmq
        if (subscription?.incentiveType === INCENTIVE_TYPE.EMPLOYER_INCENTIVE) {
          const enterprise: Enterprise | null = await this.funderRepository.getEnterpriseById(
            subscription?.funderId,
          );
          if (enterprise?.enterpriseDetails.isHris) {
            const payload = await this.subscriptionService.preparePayLoad(subscription);
            Logger.debug(
              SubscriptionController.name,
              this.finalizeSubscription.name,
              'Subscription payload',
              payload,
            );

            // Publish to rabbitmq
            await this.rabbitmqService.publishMessage(payload, enterprise?.name);
            Logger.info(
              SubscriptionController.name,
              this.finalizeSubscription.name,
              'Subscription sent to bus',
              subscriptionId,
            );
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
      Logger.error(SubscriptionController.name, this.finalizeSubscription.name, 'Error', error);
      return validationErrorExternalHandler(error);
    }
  }
}

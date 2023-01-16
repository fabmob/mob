import {AnyObject, repository, Count} from '@loopback/repository';
import {inject, service, intercept} from '@loopback/core';
import {
  param,
  get,
  getModelSchemaRef,
  put,
  requestBody,
  Response,
  RestBindings,
  post,
  HttpErrors,
  patch,
} from '@loopback/rest';
import {authorize} from '@loopback/authorization';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings} from '@loopback/security';

import {isEqual, intersection} from 'lodash';

import {AttachmentMetadata, Error, Invoice, Metadata, Subscription} from '../models';
import {
  CommunityRepository,
  SubscriptionRepository,
  UserRepository,
  MetadataRepository,
} from '../repositories';
import {
  SubscriptionService,
  FunderService,
  S3Service,
  checkMaas,
  MailService,
} from '../services';
import {validationErrorExternalHandler} from '../validationErrorExternal';
import {ValidationError} from '../validationError';
import {
  ResourceName,
  StatusCode,
  SECURITY_SPEC_KC_PASSWORD,
  SECURITY_SPEC_KC_CREDENTIALS_KC_PASSWORD,
  FUNDER_TYPE,
  INCENTIVE_TYPE,
  Roles,
  SUBSCRIPTION_STATUS,
  AUTH_STRATEGY,
  SECURITY_SPEC_JWT,
  IUser,
} from '../utils';
import {
  AffiliationInterceptor,
  SubscriptionInterceptor,
  SubscriptionMetadataInterceptor,
} from '../interceptors';
import {getInvoiceFilename} from '../utils/invoice';
import {TAG_MAAS, WEBSITE_FQDN} from '../constants';
import {endOfYear, startOfYear} from 'date-fns';
import {
  ValidationMultiplePayment,
  SubscriptionValidation,
  ValidationSinglePayment,
  ValidationNoPayment,
  NoReason,
  OtherReason,
  SubscriptionRejection,
} from '../models';

/**
 * set the list pagination value
 */
const PAGINATION_LIMIT = 200;

interface SubscriptionsWithCount {
  subscriptions: Subscription[];
  count: number;
}

@authenticate(AUTH_STRATEGY.KEYCLOAK)
export class SubscriptionController {
  constructor(
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @service(S3Service)
    private s3Service: S3Service,
    @service(SubscriptionService)
    private subscriptionService: SubscriptionService,
    @service(FunderService)
    private funderService: FunderService,
    @service(CommunityRepository)
    private communityRepository: CommunityRepository,
    @service(MetadataRepository)
    private metadataRepository: MetadataRepository,
    @service(UserRepository)
    private userRepository: UserRepository,
    @inject(SecurityBindings.USER)
    private currentUser: IUser,
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @inject('services.MailService')
    public mailService: MailService,
  ) {}

  /**
   * get the subscriptions list
   * @param status that subscription status (VALIDATED or REJECTED)
   * @param incentiveId the incentive id
   * @param lastName the last name related to the subscription
   * @param citizenId the citizen id
   * @returns subscription list
   */
  @authorize({allowedRoles: [Roles.MANAGERS, Roles.CITIZENS]})
  @get('/v1/subscriptions', {
    'x-controller-name': 'Subscriptions',
    summary: 'Retourne les souscriptions',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Array of Subscriptions model instances',
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
    },
  })
  async find(
    @param.query.string('status') status: string,
    @param.query.string('incentiveId') incentiveId?: string,
    @param.query.string('incentiveType') incentiveType?: string,
    @param.query.string('idCommunities') idCommunities?: string,
    @param.query.string('lastName') lastName?: string,
    @param.query.string('citizenId') citizenId?: string,
    @param.query.string('year') year?: string,
    @param.query.string('skip') skip?: number | undefined,
  ): Promise<Subscription[] | SubscriptionsWithCount> {
    const withParams: AnyObject[] = [
      {
        funderName: this.currentUser.funderName!,
        incentiveType: this.currentUser.incentiveType!,
      },
    ];

    const userId = this.currentUser.id;

    let communityIds: '' | string[] | null | undefined = null;

    communityIds =
      userId && (await this.userRepository.findOne({where: {id: userId}}))?.communityIds;

    if (communityIds && communityIds?.length > 0) {
      withParams.push({communityId: {inq: communityIds}});
    }

    if (idCommunities) {
      const match: AnyObject[] = [];
      const idCommunitiesList = idCommunities.split(',');
      const mapping: AnyObject = {};
      mapping[INCENTIVE_TYPE['TERRITORY_INCENTIVE']] = FUNDER_TYPE.collectivity;
      mapping[INCENTIVE_TYPE['EMPLOYER_INCENTIVE']] = FUNDER_TYPE.enterprise;

      const funders = await this.funderService.getFunderByName(
        this.currentUser.funderName!,
        mapping[this.currentUser.incentiveType!],
      );

      if (funders?.id && idCommunitiesList && idCommunitiesList.length > 0) {
        const communities = await this.communityRepository.findByFunderId(funders.id);

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
      if (match.length === 0)
        throw new ValidationError(
          `subscriptions.error.communities.mismatch`,
          `/subscriptions`,
          StatusCode.UnprocessableEntity,
          ResourceName.Subscription,
        );
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
        funderName: this.currentUser.funderName!,
        incentiveType: this.currentUser.incentiveType!,
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
      const subscriptionCount: Count = await this.subscriptionRepository.count(
        queryParams,
      );

      return {
        subscriptions: subscriptionsResponse,
        ...subscriptionCount,
      };
    } else {
      return this.subscriptionRepository.find({
        limit: PAGINATION_LIMIT,
        where: {
          and: withParams,
        },
      });
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
        description: 'Downloadable .xlsx file with validated incentive list',
        content: {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
            schema: {type: 'string', format: 'base64'},
          },
        },
      },
    },
  })
  async generateExcel(
    @inject(RestBindings.Http.RESPONSE) Response: Response,
  ): Promise<void> {
    const withParams: AnyObject[] = [
      {funderName: this.currentUser.funderName},
      {incentiveType: this.currentUser.incentiveType},
      {status: SUBSCRIPTION_STATUS.VALIDATED},
    ];

    const userId = this.currentUser.id;

    let communityIds: '' | string[] | null | undefined = null;

    communityIds =
      userId && (await this.userRepository.findOne({where: {id: userId}}))?.communityIds;
    if (communityIds && communityIds?.length > 0) {
      withParams.push({communityId: {inq: communityIds}});
    }

    const subscriptionList = await this.subscriptionRepository.find({
      order: ['updatedAT ASC'],
      where: {
        and: withParams,
      },
    });
    if (subscriptionList && subscriptionList.length > 0) {
      const buffer = await this.subscriptionService.generateExcelValidatedIncentives(
        subscriptionList,
      );
      Response.status(200)
        .contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        .send(buffer);
    } else if (subscriptionList && subscriptionList.length === 0) {
      throw new ValidationError(
        'Aucune demande validée à télécharger',
        '/downloadXlsx',
        StatusCode.UnprocessableEntity,
        ResourceName.Subscription,
      );
    } else {
      throw new ValidationError(
        'Le téléchargement a échoué, veuillez réessayer',
        '/downloadXlsx',
        StatusCode.UnprocessableEntity,
        ResourceName.Subscription,
      );
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
        description: 'Le fichier du justificatif associé à la demande',
        content: {
          'application/octet-stream': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
      [StatusCode.Unauthorized]: {
        description: "L'utilisateur est non connecté",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 401,
                name: 'Error',
                message: 'Authorization header not found',
                path: '/authorization',
              },
            },
          },
        },
      },
      [StatusCode.Forbidden]: {
        description: "L'utilisateur n'a pas les droits pour accéder au fichier",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 403,
                name: 'Error',
                message: 'Access denied',
                path: '/authorization',
              },
            },
          },
        },
      },
      [StatusCode.NotFound]: {
        description: "La demande ou le fichier n'existe pas",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 404,
                name: 'Error',
                message: 'Not Found',
                path: '/subscription',
              },
            },
          },
        },
      },
    },
  })
  async getSubscriptionFileByName(
    @param.path.string('subscriptionId', {description: `L'identifiant de la demande`})
    subscriptionId: string,
    @param.path.string('filename', {
      description: `Le nom de fichier du justificatif à récupérer`,
    })
    filename: string,
  ): Promise<AnyObject> {
    try {
      const subscription = await this.subscriptionRepository.findById(subscriptionId);
      const downloadBucket = await this.s3Service.downloadFileBuffer(
        subscription.citizenId,
        subscriptionId,
        filename,
      );
      this.response
        .status(200)
        .contentType('application/octet-stream')
        .send(downloadBucket);
      return downloadBucket;
    } catch (error) {
      return validationErrorExternalHandler(error);
    }
  }

  /**
   * get the subscription by id
   * @param subscriptionId the subscription id
   * @param filter the subscriptions search filter
   * @returns the subscriptions objects
   */
  @authorize({allowedRoles: [Roles.MANAGERS]})
  @intercept(SubscriptionInterceptor.BINDING_KEY)
  @get('/v1/subscriptions/{subscriptionId}', {
    'x-controller-name': 'Subscriptions',
    summary: "Retourne le détail d'une souscription",
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Subscriptions model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Subscription),
          },
        },
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
    },
  })
  async findById(
    @param.path.string('subscriptionId', {description: `L'identifiant de la demande`})
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
  @put('/v1/subscriptions/{subscriptionId}/validate', {
    'x-controller-name': 'Subscriptions',
    summary: 'Valide une souscription',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'La demande est validée',
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
        description: "La demande n'est pas au bon status",
      },
      [StatusCode.UnprocessableEntity]: {
        description: "La demande n'est pas au bon format",
      },
    },
  })
  async validate(
    @param.path.string('subscriptionId', {description: `L'identifiant de la demande`})
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
    // Vérification de l'existence de la subscription
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (subscription.status === SUBSCRIPTION_STATUS.TO_PROCESS) {
      const result = this.subscriptionService.checkPayment(payment);
      await this.subscriptionService.validateSubscription(result, subscription);
    } else {
      throw new ValidationError(
        'subscriptions.error.bad.status',
        '/subscriptionBadStatus',
        StatusCode.PreconditionFailed,
        ResourceName.Subscription,
      );
    }
  }

  /**
   * Subscriptions rejection by subscription id
   * @param subscriptionId the subscription id
   * @param reason the property to update
   */
  @authorize({allowedRoles: [Roles.MANAGERS]})
  @intercept(SubscriptionInterceptor.BINDING_KEY)
  @put('/v1/subscriptions/{subscriptionId}/reject', {
    'x-controller-name': 'Subscriptions',
    summary: 'Rejette une souscription',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'La demande est rejetée',
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
        description: "La demande n'est pas au bon status",
      },
      [StatusCode.UnprocessableEntity]: {
        description: "La demande n'est pas au bon format",
      },
    },
  })
  async reject(
    @param.path.string('subscriptionId', {description: `L'identifiant de la demande`})
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
    // Vérification de l'existence de la subscription
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (subscription.status === SUBSCRIPTION_STATUS.TO_PROCESS) {
      const result = this.subscriptionService.checkRefusMotif(reason);
      await this.subscriptionService.rejectSubscription(result, subscription);
    } else {
      throw new ValidationError(
        'subscriptions.error.bad.status',
        '/subscriptionBadStatus',
        StatusCode.PreconditionFailed,
        ResourceName.Subscription,
      );
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
        description: "Métadonnées d'un utilisateur",
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
      [StatusCode.Unauthorized]: {
        description: "L'utilisateur est non connecté",
      },
      [StatusCode.Forbidden]: {
        description: "L'utilisateur n'a pas les droits pour récupérer les métadonnées",
      },
      [StatusCode.NotFound]: {
        description: "Ces métadonnées n'existent pas",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 404,
                name: 'Error',
                message: 'Metadata not found',
                path: '/metadataNotFound',
                resourceName: 'Metadata',
              },
            },
          },
        },
      },
    },
  })
  async getMetadata(
    @param.path.string('metadataId', {
      description: `L'identifiant des métadonnées à envoyer \
      lors de la souscription d'une aide pour un citoyen`,
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

      // Get fileName for each invoices
      const fileNameList = metadata.attachmentMetadata.invoices.map(
        (invoice: Invoice) => {
          return {fileName: getInvoiceFilename(invoice)};
        },
      );

      return {
        incentiveId: metadata.incentiveId,
        citizenId: metadata.citizenId,
        attachmentMetadata: fileNameList,
      };
    } catch (error) {
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
                  example: '6d0efef1-4dc9-422e-a17d-40c1bf1c37c4',
                },
              },
            },
          },
        },
      },
      [StatusCode.Unauthorized]: {
        description: "L'utilisateur est non connecté",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 401,
                name: 'Error',
                message: 'Authorization header not found',
                path: '/authorization',
              },
            },
          },
        },
      },
      [StatusCode.Forbidden]: {
        description:
          "L'utilisateur n'a pas les droits pour envoyer les métadonnées pour cette aide",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 403,
                name: 'Error',
                message: 'Access denied',
                path: '/authorization',
              },
            },
          },
        },
      },
      [StatusCode.UnprocessableEntity]: {
        description: "Les métadonnées ne sont pas conformes au contrat d'interface",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 422,
                name: 'UnprocessableEntityError',
                message:
                  'The request body is invalid. See error object `details` property for more info.',
                code: 'VALIDATION_FAILED',
                details: [
                  {
                    path: '/attachmentMetadata/invoices/0/enterprise',
                    code: 'required',
                    message: "should have required property 'enterpriseName'",
                    info: {
                      missingProperty: 'enterpriseName',
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
  ): Promise<
    Response<{subscriptionURL: string; metadataId: string}> | HttpErrors.HttpError
  > {
    try {
      const result = await this.metadataRepository.create(metadata);
      return this.response.status(201).send({
        // eslint-disable-next-line
        subscriptionURL: `${WEBSITE_FQDN}/subscriptions/new?incentiveId=${result.incentiveId}&metadataId=${result.id}`,
        metadataId: result.id,
      });
    } catch (error) {
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
    responses: {
      [StatusCode.NoContent]: {
        description: 'Modification de la souscription réussie',
      },
      [StatusCode.Unauthorized]: {
        description: "L'utilisateur est non connecté",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 401,
                name: 'Error',
                message: 'Authorization header not found',
                path: '/authorization',
              },
            },
          },
        },
      },
      [StatusCode.Forbidden]: {
        description: "L'utilisateur n'a pas les droits pour modifier la souscription",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 403,
                name: 'Error',
                message: 'Access denied',
              },
            },
          },
        },
      },
      [StatusCode.NotFound]: {
        description: "La souscription ou l'aide n'existe pas",
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
        description: "Aucun champ spécifique n'a été fourni",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 412,
                name: 'Error',
                message: 'At least one specific field must be provided',
                path: '/subscriptionWithoutData',
                resourceName: 'Souscription',
              },
            },
          },
        },
      },
      [StatusCode.UnprocessableEntity]: {
        description: 'Une erreur est survenue sur la modification de la souscription',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 422,
                name: 'Error',
                message: 'Incentive without specific fields',
                path: '/incentiveWithoutSpecificFields',
                resourceName: 'Souscription',
              },
            },
          },
        },
      },
    },
  })
  async updateById(
    @param.path.string('subscriptionId', {description: `L'identifiant de la demande`})
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
    const subscription: Subscription = await this.subscriptionRepository.findById(
      subscriptionId,
    );

    // Update subscription specific fields
    await this.subscriptionRepository.updateById(subscriptionId, {
      specificFields: Object.assign(
        subscription.specificFields!,
        rawSubscriptionSpecificFields,
      ),
    });
  }
}

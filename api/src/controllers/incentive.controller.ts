import {inject, intercept, service} from '@loopback/core';
import {
  AnyObject,
  Count,
  CountSchema,
  Filter,
  PredicateComparison,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  del,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {SecurityBindings} from '@loopback/security';

import {Incentive, Link, SpecificField, Error} from '../models';
import {
  IncentiveRepository,
  CollectivityRepository,
  EnterpriseRepository,
  CitizenRepository,
} from '../repositories';
import {
  IncentiveInterceptor,
  AffiliationInterceptor,
  AffiliationPublicInterceptor,
} from '../interceptors';
import {FunderService, IncentiveService, IUser, checkMaas} from '../services';
import {ValidationError} from '../validationError';
import {
  INCENTIVE_TYPE,
  ResourceName,
  Roles,
  StatusCode,
  SECURITY_SPEC_KC_PASSWORD,
  FUNDER_TYPE,
  AFFILIATION_STATUS,
  CITIZEN_STATUS,
  SECURITY_SPEC_ALL,
  HTTP_METHOD,
  SECURITY_SPEC_JWT_KC_PASSWORD_KC_CREDENTIALS,
  SECURITY_SPEC_API_KEY,
  GET_INCENTIVES_INFORMATION_MESSAGES,
  AUTH_STRATEGY,
} from '../utils';
import {TAG_MAAS, WEBSITE_FQDN} from '../constants';

@intercept(IncentiveInterceptor.BINDING_KEY)
export class IncentiveController {
  constructor(
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @repository(CollectivityRepository)
    public collectivityRepository: CollectivityRepository,
    @repository(EnterpriseRepository)
    public enterpriseRepository: EnterpriseRepository,
    @repository(CitizenRepository)
    public citizenRepository: CitizenRepository,
    @inject('services.IncentiveService')
    public incentiveService: IncentiveService,
    @service(FunderService)
    public funderService: FunderService,
    @inject(SecurityBindings.USER, {optional: true})
    private currentUser?: IUser,
  ) {}

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @post('/v1/incentives', {
    'x-controller-name': 'Incentives',
    summary: 'Crée une aide',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Incentives model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Incentive),
          },
        },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Incentive),
        },
      },
    })
    incentive: Incentive,
  ): Promise<Incentive> {
    if (incentive.incentiveType === INCENTIVE_TYPE.TERRITORY_INCENTIVE) {
      const collectivity = await this.collectivityRepository.find({
        where: {name: incentive.funderName},
      });
      if (collectivity.length > 0) {
        incentive.funderId = collectivity[0].id;
      }
    } else if (incentive.incentiveType === INCENTIVE_TYPE.EMPLOYER_INCENTIVE) {
      const enterprise = await this.enterpriseRepository.find({
        where: {name: incentive.funderName},
      });
      if (enterprise.length > 0) {
        incentive.funderId = enterprise[0].id;
      } else {
        throw new ValidationError(
          `incentives.error.fundername.enterprise.notExist`,
          '/enterpriseNotExist',
          StatusCode.NotFound,
          ResourceName.Enterprise,
        );
      }
    }
    if (incentive.specificFields) {
      incentive.jsonSchema = this.incentiveService.convertSpecificFields(
        incentive.title,
        incentive.specificFields,
      );
    }
    return this.incentiveRepository.create(incentive);
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({
    allowedRoles: [Roles.MANAGERS, Roles.CONTENT_EDITOR, Roles.MAAS, Roles.MAAS_BACKEND],
  })
  @get('/v1/incentives', {
    'x-controller-name': 'Incentives',
    summary: 'Retourne les aides',
    security: SECURITY_SPEC_JWT_KC_PASSWORD_KC_CREDENTIALS,
    tags: ['Incentives', TAG_MAAS],
    responses: {
      [StatusCode.Success]: {
        description: 'La liste des aides',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Incentive),
            },
          },
        },
      },
      [StatusCode.ContentDifferent]: {
        description: 'La liste des aides nationales et du territoire concerné',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                response: {
                  type: 'array',
                  items: {
                    allOf: [
                      getModelSchemaRef(Incentive, {
                        title: 'Incentive',
                        exclude: [
                          'description',
                          'territoryName',
                          'conditions',
                          'paymentMethod',
                          'allocatedAmount',
                          'attachments',
                          'additionalInfos',
                          'contact',
                          'validityDuration',
                          'isMCMStaff',
                          'jsonSchema',
                          'subscriptionLink',
                          'createdAt',
                          'specificFields',
                          'links',
                        ],
                      }),
                      {
                        type: 'object',
                        properties: {
                          specificFields: {
                            type: 'array',
                            items: getModelSchemaRef(SpecificField),
                          },
                        },
                      },
                      {
                        type: 'object',
                        properties: {
                          links: {
                            type: 'array',
                            items: getModelSchemaRef(Link),
                          },
                        },
                      },
                    ],
                  },
                },
                message: {
                  type: 'string',
                  enum: Object.values(GET_INCENTIVES_INFORMATION_MESSAGES),
                  example:
                    GET_INCENTIVES_INFORMATION_MESSAGES.CITIZEN_AFFILIATED_WITHOUT_INCENTIVES,
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
          "L'utilisateur n'a pas les droits pour accéder au catalogue des aides",
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
    },
  })
  async find(
    @inject(RestBindings.Http.RESPONSE) resp: Response,
  ): Promise<Incentive[] | Response<{response: Incentive[]; message?: string}>> {
    const {id, roles} = this.currentUser!;
    if (roles && roles.includes(Roles.CONTENT_EDITOR)) {
      return this.incentiveRepository.find({
        order: ['updatedAt DESC'],
      });
    }

    if (roles && roles.includes(Roles.MANAGERS)) {
      const withParams: AnyObject[] = [
        {funderName: this.currentUser!.funderName},
        {incentiveType: this.currentUser!.incentiveType},
      ];
      return this.incentiveRepository.find({
        where: {
          and: withParams,
        },
        fields: {
          id: true,
          title: true,
        },
      });
    }

    const commonFilter: Filter<Incentive> = {
      order: ['updatedAt DESC'],
      fields: {
        id: true,
        funderId: true,
        title: true,
        incentiveType: true,
        funderName: true,
        minAmount: true,
        transportList: true,
        validityDate: true,
        updatedAt: true,
      },
    };
    const incentiveList: Incentive[] = await this.incentiveRepository.find({
      where: {
        or: [
          {incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE as PredicateComparison<any>},
          {incentiveType: INCENTIVE_TYPE.NATIONAL_INCENTIVE as PredicateComparison<any>},
        ],
      },
      ...commonFilter,
    });

    if (roles && roles.includes(Roles.MAAS_BACKEND)) {
      return incentiveList;
    }

    if (roles && roles.includes(Roles.MAAS)) {
      // Get our funder to be matched to get  the affilated user
      const funders = await this.funderService.getFunders();

      // WE gonna find our affiliated user with the user context id coming from interceptor
      const citizen = await this.citizenRepository.findOne({where: {id}});

      const funderMatch = funders.find(
        ({id}) => citizen?.affiliation?.enterpriseId === id,
      );

      let isAffiliatedWithoutIncentive: boolean = false;
      let isCitizenNotAffiliated: boolean = false;
      let isCitizenAffiliated: boolean = false;
      let isEveryoneAllowed: any = false;
      let incentiveEnterpriseList: Incentive[] = [];

      if (funderMatch?.id && citizen?.affiliation) {
        incentiveEnterpriseList = await this.incentiveRepository.find({
          where: {funderId: funderMatch.id},
          ...commonFilter,
        });

        isCitizenAffiliated =
          funderMatch?.funderType === FUNDER_TYPE.enterprise &&
          citizen.affiliation.affiliationStatus === AFFILIATION_STATUS.AFFILIATED;

        isCitizenNotAffiliated =
          citizen.affiliation.affiliationStatus === AFFILIATION_STATUS.TO_AFFILIATE;

        isAffiliatedWithoutIncentive =
          incentiveEnterpriseList.length === 0 &&
          citizen.affiliation.affiliationStatus === AFFILIATION_STATUS.AFFILIATED;
      } else {
        isEveryoneAllowed = citizen && citizen.status !== CITIZEN_STATUS.EMPLOYEE;
      }

      if (isAffiliatedWithoutIncentive) {
        return resp.status(210).send({
          response: incentiveList,
          message:
            GET_INCENTIVES_INFORMATION_MESSAGES.CITIZEN_AFFILIATED_WITHOUT_INCENTIVES,
        });
      }

      if (isCitizenAffiliated) {
        return [...incentiveList, ...incentiveEnterpriseList];
      }

      if (isCitizenNotAffiliated) {
        return resp.status(210).send({
          response: incentiveList,
          message: GET_INCENTIVES_INFORMATION_MESSAGES.CITIZEN_NOT_AFFILIATED,
        });
      }

      if (isEveryoneAllowed) {
        return incentiveList;
      }
    }
    return [];
  }
  @authenticate(AUTH_STRATEGY.API_KEY)
  @authorize({allowedRoles: [Roles.API_KEY]})
  @get('/v1/incentives/search', {
    'x-controller-name': 'Incentives',
    summary: 'Recherche les aides correspondantes',
    security: SECURITY_SPEC_API_KEY,
    responses: {
      [StatusCode.Success]: {
        description: 'Array of Incentive model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Incentive),
            },
          },
        },
      },
    },
  })
  async search(
    @param.query.string('_q') textSearch?: string,
    @param.query.string('incentiveType') incentiveType?: string,
    @param.query.string('enterpriseId') enterpriseId?: string,
  ): Promise<Incentive[]> {
    const sort: any = textSearch ? {score: {$meta: 'textScore'}} : {updatedAt: -1};
    const match: any = textSearch ? {$text: {$search: textSearch, $language: 'fr'}} : {};

    if (incentiveType) {
      match['$or'] = [];
      const incentiveTypeList = incentiveType.split(',');
      for (const row of incentiveTypeList) {
        match['$or'].push({incentiveType: row});
      }
    }

    if (enterpriseId) {
      match['$or'].push({
        incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
        funderId: enterpriseId,
      });
    }

    return this.incentiveRepository
      .execute('Incentive', 'aggregate', [
        {$match: match},
        {$sort: sort},
        {$addFields: {id: '$_id'}},
        {$project: {_id: 0}},
      ])
      .then(res => res.get())
      .catch(err => err);
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/incentives/count', {
    'x-controller-name': 'Incentives',
    summary: "Retourne le nombre d'aides",
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Incentives model count',
        content: {
          'application/json': {
            schema: {...CountSchema, ...{title: 'Count'}},
          },
        },
      },
    },
  })
  async count(@param.where(Incentive) where?: Where<Incentive>): Promise<Count> {
    return this.incentiveRepository.count(where);
  }

  /**
   * get incentive by id
   * @param incentiveId the incentive id
   * @returns incentive object details
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK, AUTH_STRATEGY.API_KEY)
  @authorize({
    allowedRoles: [
      Roles.API_KEY,
      Roles.CONTENT_EDITOR,
      Roles.MAAS,
      Roles.MAAS_BACKEND,
      Roles.PLATFORM,
    ],
  })
  @intercept(AffiliationPublicInterceptor.BINDING_KEY)
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @get('/v1/incentives/{incentiveId}', {
    'x-controller-name': 'Incentives',
    summary: "Retourne le détail d'une aide",
    security: SECURITY_SPEC_ALL,
    tags: ['Incentives', TAG_MAAS],
    responses: {
      [StatusCode.Success]: {
        description: "Le détail de l'aide",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Incentive),
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
          "L'utilisateur n'a pas les droits pour accéder au détail de cette aide",
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
        description: "Cette aide n'existe pas",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 404,
                name: 'Error',
                message: 'Incentive not found',
                path: '/incentiveNotFound',
                resourceName: 'Incentive',
              },
            },
          },
        },
      },
    },
  })
  async findIncentiveById(
    @param.path.string('incentiveId', {description: `L'identifiant de l'aide`})
    incentiveId: string,
  ): Promise<Incentive> {
    const incentive: Incentive = await this.incentiveRepository.findById(incentiveId);

    if (incentive?.isMCMStaff) {
      const links: Link[] = [
        new Link({
          href: `${WEBSITE_FQDN}/subscriptions/new?incentiveId=${incentive.id}`,
          rel: 'subscribe',
          method: HTTP_METHOD.GET,
        }),
      ];
      incentive.links = links;
    }

    return incentive;
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @patch('/v1/incentives/{incentiveId}', {
    'x-controller-name': 'Incentives',
    summary: 'Modifie une aide',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'Incentives put success',
      },
      [StatusCode.NotFound]: {
        description: "Cette aide n'existe pas",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 404,
                name: 'Error',
                message: 'Incentive not found',
                path: '/incentiveNotFound',
                resourceName: 'Incentive',
              },
            },
          },
        },
      },
    },
  })
  async updateById(
    @param.path.string('incentiveId', {description: `L'identifiant de l'aide`})
    incentiveId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Incentive, {title: 'IncentiveUpdate', partial: true}),
        },
      },
    })
    incentive: Incentive,
  ): Promise<Incentive> {
    // Add new specificFields and unset subscription link
    if (
      incentive.isMCMStaff &&
      incentive.specificFields &&
      incentive.specificFields.length
    ) {
      // Add json schema from specific fields
      incentive.jsonSchema = this.incentiveService.convertSpecificFields(
        incentive.title,
        incentive.specificFields,
      );
      // Remove subscription from incentive object
      delete incentive.subscriptionLink;
      // Unset subscription
      await this.incentiveRepository.updateById(incentiveId, {
        $unset: {subscriptionLink: ''},
      } as any);
    }

    // Add subscription link and unset specificFields and jsonSchema
    if (
      (!incentive.isMCMStaff && incentive.subscriptionLink) ||
      (incentive?.specificFields && !incentive.specificFields.length)
    ) {
      // Remove specific field && jsonSchema from incentive object
      delete incentive.specificFields;
      delete incentive.jsonSchema;
      // Unset specificFields && jsonSchema
      await this.incentiveRepository.updateById(incentiveId, {
        $unset: {specificFields: '', jsonSchema: ''},
      } as any);
    }
    await this.incentiveRepository.updateById(incentiveId, incentive);
    incentive.id = incentiveId;
    return incentive;
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @del('/v1/incentives/{incentiveId}', {
    'x-controller-name': 'Incentives',
    summary: 'Supprime une aide',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'Incentives DELETE success',
      },
      [StatusCode.NotFound]: {
        description: "Cette aide n'existe pas",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 404,
                name: 'Error',
                message: 'Incentive not found',
                path: '/incentiveNotFound',
                resourceName: 'Incentive',
              },
            },
          },
        },
      },
    },
  })
  async deleteById(
    @param.path.string('incentiveId', {description: `L'identifiant de l'aide`})
    incentiveId: string,
  ): Promise<void> {
    await this.incentiveRepository.deleteById(incentiveId);
  }
}

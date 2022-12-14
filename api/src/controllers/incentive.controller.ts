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

import {Incentive, Link, SpecificField, Error, Citizen, Territory} from '../models';
import {
  IncentiveRepository,
  CollectivityRepository,
  EnterpriseRepository,
  CitizenRepository,
  TerritoryRepository,
} from '../repositories';
import {
  IncentiveInterceptor,
  AffiliationInterceptor,
  AffiliationPublicInterceptor,
} from '../interceptors';
import {FunderService, IncentiveService} from '../services';
import {ValidationError} from '../validationError';
import {
  INCENTIVE_TYPE,
  ResourceName,
  Roles,
  StatusCode,
  SECURITY_SPEC_KC_PASSWORD,
  AFFILIATION_STATUS,
  SECURITY_SPEC_ALL,
  HTTP_METHOD,
  SECURITY_SPEC_JWT_KC_PASSWORD_KC_CREDENTIALS,
  SECURITY_SPEC_API_KEY,
  GET_INCENTIVES_INFORMATION_MESSAGES,
  AUTH_STRATEGY,
  IScore,
  IUpdateAt,
  IUser,
} from '../utils';
import {TAG_MAAS, WEBSITE_FQDN} from '../constants';
import {
  incentiveExample,
  incentiveContentDifferentExample,
} from './utils/incentiveExample';
import {TerritoryService} from '../services/territory.service';
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
    @repository(TerritoryRepository)
    public territoryRepository: TerritoryRepository,
    @inject('services.IncentiveService')
    public incentiveService: IncentiveService,
    @service(FunderService)
    public funderService: FunderService,
    @service(TerritoryService)
    public territoryService: TerritoryService,
    @inject(SecurityBindings.USER, {optional: true})
    private currentUser?: IUser,
  ) {}

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @post('/v1/incentives', {
    'x-controller-name': 'Incentives',
    summary: 'Cr??e une aide',
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
    let createdTerritory: Territory;
    try {
      /**
       * Check if the territory ID is provided.
       */
      if (incentive.territory.id) {
        /**
         * Check if the provided ID exists in the territoy collection.
         */
        const territoryResult: Territory = await this.territoryRepository.findById(
          incentive.territory.id,
        );

        /**
         * Check if the name provided matches the territory name.
         */
        if (
          territoryResult.name !== incentive.territory.name ||
          (incentive.territoryName && incentive?.territoryName !== territoryResult.name) // TODO: REMOVING DEPRECATED territoryName.
        ) {
          throw new ValidationError(
            'territory.name.mismatch',
            '/territory',
            StatusCode.UnprocessableEntity,
            ResourceName.Territory,
          );
        }
      } else {
        /**
         * Create Territory
         */
        createdTerritory = await this.territoryService.createTerritory({
          name: incentive.territory.name,
        } as Territory);

        incentive.territory = createdTerritory;
      }

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
      return await this.incentiveRepository.create(incentive);
    } catch (error) {
      if (createdTerritory!) {
        await this.territoryRepository.deleteById(createdTerritory.id);
      }
      throw error;
    }
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
              title: 'Incentive',
              type: 'array',
              items: {
                title: 'Incentive',
                allOf: [
                  getModelSchemaRef(Incentive, {
                    exclude: ['specificFields', 'links'],
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
                ],
              },
              example: incentiveExample,
            },
          },
        },
      },
      [StatusCode.ContentDifferent]: {
        description: 'La liste des aides nationales et du territoire concern??',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                response: {
                  type: 'array',
                  items: {
                    title: 'Incentive',
                    allOf: [
                      getModelSchemaRef(Incentive, {
                        exclude: [
                          'attachments',
                          'additionalInfos',
                          'contact',
                          'jsonSchema',
                          'subscriptionLink',
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
              example: incentiveContentDifferentExample,
            },
          },
        },
      },
      [StatusCode.Unauthorized]: {
        description: "L'utilisateur est non connect??",
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
          "L'utilisateur n'a pas les droits pour acc??der au catalogue des aides",
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
        conditions: true,
        paymentMethod: true,
        allocatedAmount: true,
        funderName: true,
        minAmount: true,
        transportList: true,
        validityDate: true,
        createdAt: true,
        updatedAt: true,
        description: true,
        isMCMStaff: true,
        territory: true,
        territoryName: true,
      },
    };
    const incentiveList: Incentive[] = await this.incentiveRepository.find({
      where: {
        or: [
          {
            incentiveType:
              INCENTIVE_TYPE.TERRITORY_INCENTIVE as PredicateComparison<string>,
          },
          {
            incentiveType:
              INCENTIVE_TYPE.NATIONAL_INCENTIVE as PredicateComparison<string>,
          },
        ],
      },
      ...commonFilter,
    });

    if (roles && roles.includes(Roles.MAAS_BACKEND)) {
      return incentiveList;
    }

    if (roles && roles.includes(Roles.MAAS)) {
      const citizen: Citizen | null = await this.citizenRepository.findOne({where: {id}});
      const citizenFunderId: string | null | undefined =
        citizen?.affiliation?.enterpriseId;
      const citizenStatus: string | null | undefined =
        citizen?.affiliation?.affiliationStatus;

      if (citizenFunderId && citizenStatus === AFFILIATION_STATUS.AFFILIATED) {
        const incentiveEnterpriseList: Incentive[] = await this.incentiveRepository.find({
          where: {funderId: citizenFunderId},
          ...commonFilter,
        });

        if (incentiveEnterpriseList.length === 0)
          return resp.status(210).send({
            response: incentiveList,
            message:
              GET_INCENTIVES_INFORMATION_MESSAGES.CITIZEN_AFFILIATED_WITHOUT_INCENTIVES,
          });
        return [...incentiveList, ...incentiveEnterpriseList];
      }

      if (
        citizenStatus ===
        (AFFILIATION_STATUS.TO_AFFILIATE || AFFILIATION_STATUS.DISAFFILIATED)
      ) {
        return resp.status(210).send({
          response: incentiveList,
          message: GET_INCENTIVES_INFORMATION_MESSAGES.CITIZEN_NOT_AFFILIATED,
        });
      }
      return incentiveList;
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
    const sort: IScore | IUpdateAt = textSearch
      ? {score: {$meta: 'textScore'}}
      : {updatedAt: -1};
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
    summary: "Retourne le d??tail d'une aide",
    security: SECURITY_SPEC_ALL,
    tags: ['Incentives', TAG_MAAS],
    responses: {
      [StatusCode.Success]: {
        description: "Le d??tail de l'aide",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Incentive),
          },
        },
      },
      [StatusCode.Unauthorized]: {
        description: "L'utilisateur est non connect??",
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
          "L'utilisateur n'a pas les droits pour acc??der au d??tail de cette aide",
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
          schema: getModelSchemaRef(Incentive, {
            title: 'IncentiveUpdate',
            partial: true,
          }),
        },
      },
    })
    incentive: Incentive,
  ): Promise<Incentive> {
    // Remove contact from incentive object
    if (!incentive.contact) {
      delete incentive.contact;
      await this.incentiveRepository.updateById(incentiveId, {
        $unset: {contact: ''},
      } as any);
    }
    // Remove validityDuration from incentive object
    if (!incentive.validityDuration) {
      delete incentive.validityDuration;
      await this.incentiveRepository.updateById(incentiveId, {
        $unset: {validityDuration: ''},
      } as any);
    }
    // Remove additionalInfos from incentive object
    if (!incentive.additionalInfos) {
      delete incentive.additionalInfos;
      await this.incentiveRepository.updateById(incentiveId, {
        $unset: {additionalInfos: ''},
      } as any);
    }
    // Remove validityDate from incentive object
    if (!incentive.validityDate) {
      delete incentive.validityDate;
      await this.incentiveRepository.updateById(incentiveId, {
        $unset: {validityDate: ''},
      } as any);
    }
    // Remove subscriptionLink from incentive object
    if (!incentive.subscriptionLink) {
      delete incentive.subscriptionLink;
      await this.incentiveRepository.updateById(incentiveId, {
        $unset: {subscriptionLink: ''},
      } as any);
    }

    if (incentive.territory) {
      if (!incentive.territory.id) {
        throw new ValidationError(
          'territory.id.undefined',
          '/territory',
          StatusCode.PreconditionFailed,
          ResourceName.Territory,
        );
      }
      /**
       * Check if the provided ID exists in the territoy collection.
       */
      const territoryResult: Territory = await this.territoryRepository.findById(
        incentive.territory.id,
      );

      /**
       * Check if the name provided matches the territory name.
       */
      if (
        territoryResult.name !== incentive.territory.name ||
        (incentive.territoryName && incentive?.territoryName !== territoryResult.name) // TODO: REMOVING DEPRECATED territoryName.
      ) {
        throw new ValidationError(
          'territory.name.mismatch',
          '/territory',
          StatusCode.UnprocessableEntity,
          ResourceName.Territory,
        );
      }
    }

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

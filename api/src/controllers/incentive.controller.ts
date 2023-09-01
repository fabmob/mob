import {inject, intercept, service} from '@loopback/core';
import {
  AnyObject,
  Count,
  CountSchema,
  Fields,
  Filter,
  PositionalParameters,
  repository,
  Where,
} from '@loopback/repository';
import {post, param, get, getModelSchemaRef, patch, del, requestBody, RestBindings} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {SecurityBindings} from '@loopback/security';

import {
  Incentive,
  Link,
  SpecificField,
  Citizen,
  Territory,
  EligibilityCheck,
  IncentiveEligibilityChecks,
  Funder,
  Collectivity,
  Enterprise,
} from '../models';
import {
  IncentiveRepository,
  TerritoryRepository,
  IncentiveEligibilityChecksRepository,
  FunderRepository,
  AffiliationRepository,
} from '../repositories';
import {IncentiveInterceptor, AffiliationInterceptor, AffiliationPublicInterceptor} from '../interceptors';
import {CitizenService, GeoApiGouvService, IncentiveService, TerritoryService} from '../services';
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
  AUTH_STRATEGY,
  IUser,
  ELIGIBILITY_CHECKS_LABEL,
  IGeoApiGouvResponseResult,
  SCALE,
  FilterSearchIncentive,
  convertOrderFilter,
  handleWhereFilter,
  SECURITY_SPEC_API_KEY_KC_PASSWORD,
  Logger,
  MAAS_PURGED_FIELDS,
} from '../utils';
import {incentiveExample} from './utils/incentiveExample';
import {LIMIT_DEFAULT, TAG_MAAS, WEBSITE_FQDN} from '../constants';
import {BadRequestError, NotFoundError} from '../validationError';
import {defaultSwaggerError} from './utils/swagger-errors';
import express, {Request, Response} from 'express';

@intercept(IncentiveInterceptor.BINDING_KEY)
export class IncentiveController {
  constructor(
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @repository(FunderRepository)
    public funderRepository: FunderRepository,
    @repository(TerritoryRepository)
    public territoryRepository: TerritoryRepository,
    @repository(IncentiveEligibilityChecksRepository)
    public incentiveEligibilityChecksRepository: IncentiveEligibilityChecksRepository,
    @repository(AffiliationRepository)
    public affiliationRepository: AffiliationRepository,
    @inject('services.IncentiveService')
    public incentiveService: IncentiveService,
    @service(TerritoryService)
    public territoryService: TerritoryService,
    @service(CitizenService)
    public citizenService: CitizenService,
    @service(GeoApiGouvService)
    public geoApiGouvService: GeoApiGouvService,
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
      [StatusCode.Created]: {
        description: "L'aide est créée",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Incentive),
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Incentive, {
            exclude: ['id'],
            title: 'CreateIncentive',
          }),
        },
      },
    })
    incentive: Incentive,
  ): Promise<Incentive> {
    this.response.status(201);
    let createdIncentive: Incentive;
    try {
      /**
       * Check if the provided ID exists in the territory collection.
       * For now, only one Territory is linked to an incentive
       */
      Logger.debug(IncentiveController.name, this.create.name, 'Incentive create data', incentive);

      const territoryListResult: Territory[] = await this.territoryRepository.find({
        where: {id: {inq: incentive.territoryIds}},
      });
      Logger.debug(IncentiveController.name, this.create.name, 'Territory data', territoryListResult);

      /**
       * Check if the name provided matches the territory name.
       */
      if (!territoryListResult.length) {
        throw new BadRequestError(
          IncentiveController.name,
          this.create.name,
          'territory.not.found',
          '/territory',
          ResourceName.Territory,
          incentive.territoryIds,
        );
      }

      // TODO: REMOVING DEPRECATED territoryName.
      incentive.territoryName = territoryListResult[0].name;

      if (incentive.incentiveType === INCENTIVE_TYPE.TERRITORY_INCENTIVE) {
        const funder: Collectivity | null = await this.funderRepository.getCollectivityById(
          incentive.funderId,
        );
        if (funder) {
          incentive.funderName = funder.name;
        }
      } else if (incentive.incentiveType === INCENTIVE_TYPE.EMPLOYER_INCENTIVE) {
        const funder: Enterprise | null = await this.funderRepository.getEnterpriseById(incentive.funderId);
        if (funder) {
          incentive.funderName = funder.name;
        }
      } else {
        const funder: Funder | null = await this.funderRepository.findById(incentive.funderId);
        if (funder) {
          incentive.funderName = funder.name;
        }
      }
      if (incentive.specificFields) {
        incentive.jsonSchema = this.incentiveService.convertSpecificFields(
          incentive.title,
          incentive.specificFields,
        );
      }
      Logger.debug(IncentiveController.name, this.create.name, 'Json schema data', incentive.jsonSchema);

      createdIncentive = await this.incentiveRepository.create(incentive);
      Logger.info(IncentiveController.name, this.create.name, 'Incentive created', createdIncentive.id);

      const exclusionControl: IncentiveEligibilityChecks | null =
        await this.incentiveEligibilityChecksRepository.findOne({
          where: {label: ELIGIBILITY_CHECKS_LABEL.EXCLUSION},
        });
      Logger.debug(IncentiveController.name, this.create.name, 'Exclusion control data', exclusionControl);

      const currentIncentiveExclusionControl: EligibilityCheck | undefined =
        incentive.eligibilityChecks?.find(check => {
          return check.id === exclusionControl!.id;
        });
      Logger.debug(
        IncentiveController.name,
        this.create.name,
        'Current Exclusion control data',
        currentIncentiveExclusionControl,
      );

      const exclusionsToAdd: string[] = currentIncentiveExclusionControl?.value || [];
      if (exclusionsToAdd.length > 0) {
        const incentivesToAdd: Incentive[] = await this.incentiveRepository.find({
          where: {id: {inq: exclusionsToAdd}},
        });

        // Apply exclusion for all incentives listed in the exclusion control value array
        await Promise.all([
          incentivesToAdd.map(async incentiveToAdd => {
            const updatedEligibilityChecks: EligibilityCheck[] =
              this.incentiveService.addIncentiveToExclusions(
                incentiveToAdd.eligibilityChecks,
                createdIncentive,
                exclusionControl!.id,
                currentIncentiveExclusionControl!.active,
              );
            await this.incentiveRepository.updateById(incentiveToAdd.id, {
              eligibilityChecks: updatedEligibilityChecks,
            });
          }),
        ]);
        Logger.info(
          IncentiveController.name,
          this.create.name,
          'Incentives updated with exclusion',
          exclusionsToAdd,
        );
      }

      return createdIncentive;
    } catch (error) {
      Logger.error(IncentiveController.name, this.create.name, 'Error', error);
      if (createdIncentive!) {
        await this.incentiveRepository.deleteById(createdIncentive.id);
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
    description: `Ce service permet de récupérer la liste des aides accessibles pour l'authentifié.<br>
    Si l'authentifié est un compte de service, seules les aides publiques \
    (types AideNationale|AideTerritoire) sont retournées.<br>
    Si l'authentifié est un citoyen, les aides de type AideEmployeur sont \
    retournées si les 2 conditions suivantes sont réunies :
    <ul>
    <li>le citoyen connecté est affilié</li>\
    <li>le type d'aide AideEmployeur est spécifié dans la clause \
    where du filtre OU aucun type n'est spécifié (par défaut)</li>\
    </ul>
    <p>
    Pour récupérer des aides pour un ou plusieurs territoires, il convient préalablement \
    d'acquérir les identifiants des territoires correspondants via la requête GET /v1/territories. \
    Ensuite, ces identifiants doivent être intégrés dans la clause "where" du filtre de la requête \
    comme ceci :
    </p>
    <code>{"where": {"territoryIds": {"inq" : ["TerritoireID1","TerritoireID2"]}}}</code><br>`,
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
                  getModelSchemaRef(Incentive),
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
      ...defaultSwaggerError,
    },
  })
  async find(
    @param.filter(Incentive)
    filter?: Filter<Incentive>,
  ): Promise<Incentive[]> {
    try {
      const {id, roles} = this.currentUser!;
      Logger.debug(IncentiveController.name, this.find.name, 'Roles', roles);

      const isMaasRole: boolean | undefined = roles?.includes(Roles.MAAS);
      const isMaasBackendRole: boolean | undefined = roles?.includes(Roles.MAAS_BACKEND);
      const isCitizen: boolean | undefined = roles?.includes(Roles.CITIZENS);

      // Check if filter contains limit
      const limit: number = filter?.limit ?? LIMIT_DEFAULT;
      Logger.debug(IncentiveController.name, this.find.name, 'Applied limit', limit);

      // Initialize filter variable and Add limit to commonFilter
      let commonFilter: Filter<Incentive> = {...filter, limit};

      /**
       * If user role is Maas or Maas_backend
       * Restrict access to some fields
       * Restrict Access to Employee incentive's if not affiliated
       */
      if (isMaasRole || isMaasBackendRole) {
        // Exclude Employer incentive from being fetched.
        let whereCondition: Where<Incentive> = {
          and: [
            filter?.where as Where<Incentive>,
            {
              incentiveType: {
                neq: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
              },
            },
          ],
        };

        // Get the current user's affiliation if belongs to citizen group
        if (isCitizen) {
          const affiliation = await this.affiliationRepository.findOne({where: {citizenId: id}});
          if (!affiliation) {
            throw new NotFoundError(
              IncentiveController.name,
              this.find.name,
              'affiliation.not.found.for.citizen.id',
              '/incentives',
              ResourceName.Citizen,
              id,
            );
          }

          const {enterpriseId, status} = affiliation;

          Logger.debug(IncentiveController.name, this.find.name, 'Enterprise ID', enterpriseId);
          Logger.debug(IncentiveController.name, this.find.name, 'Affiliation Status', status);

          const isAffiliated = enterpriseId && status === AFFILIATION_STATUS.AFFILIATED;

          // If current citizen is not affiliated, cannot retrieve Employees Collections
          // If current citizen is affiliated, get the incentives corresponding to the funderId
          whereCondition = {
            and: [
              filter?.where as Where<Incentive>,
              isAffiliated
                ? {
                    or: [
                      {
                        incentiveType: {
                          inq: [INCENTIVE_TYPE.NATIONAL_INCENTIVE, INCENTIVE_TYPE.TERRITORY_INCENTIVE],
                        },
                      },
                      {
                        incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
                        funderId: enterpriseId!,
                      },
                    ],
                  }
                : {
                    incentiveType: {
                      neq: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
                    },
                  },
            ],
          };
        }

        commonFilter = {
          ...commonFilter,
          fields: {...commonFilter?.fields, ...MAAS_PURGED_FIELDS},
          where: whereCondition,
        };
      }

      Logger.debug(IncentiveController.name, this.find.name, 'Applied filter', commonFilter);

      return await this.incentiveRepository.find(commonFilter);
    } catch (error) {
      Logger.error(IncentiveController.name, this.find.name, 'Error', error);
      throw error;
    }
  }

  @authenticate(AUTH_STRATEGY.API_KEY, AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.API_KEY, Roles.CITIZENS]})
  @get('/v1/incentives/search', {
    'x-controller-name': 'Incentives',
    summary: 'Recherche les aides',
    description:
      "Recherche les aides et les trie sur l'échelle du territoire associé.\
    Ce tri est adapté à la localisation du citoyen (si connue).<br> \
    Un tri par défaut (alphabétique sur le nom du financeur) est aussi\
    appliqué si aucun filtre 'order' n'est fourni.<br>\
    Les aides de type AideEmployeur sont retournées si les 2 conditions suivantes sont réunies : <br>\
    <ul>\
    <li>le citoyen connecté est affilié</li>\
    <li>le type d'aide AideEmployeur est spécifié dans la clause \
    where du filtre OU aucun type n'est spécifié   (par défaut)</li>\
    </ul>",
    security: SECURITY_SPEC_API_KEY_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'La liste des aides issues de la recherche',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Incentive),
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async search(
    @param.query.string('_q') textSearch?: string,
    @param.filter(Incentive, {exclude: ['include', 'offset', 'skip']})
    filter?: FilterSearchIncentive,
  ): Promise<Incentive[]> {
    try {
      const whereFilter: AnyObject | undefined = filter?.where;
      let territoryIdsFilter: string[] | undefined;

      if (whereFilter && 'territoryIds' in whereFilter && 'inq' in whereFilter['territoryIds']) {
        territoryIdsFilter = whereFilter['territoryIds']['inq'];
      }

      // Check if filter contains limit
      const limit: number = filter?.limit ?? LIMIT_DEFAULT;
      Logger.debug(IncentiveController.name, this.find.name, 'Applied limit', limit);

      const commonTerritoryLookup = {
        from: 'Territory',
        localField: 'territoryIds',
        foreignField: '_id',
        as: 'territoryLookup',
      };

      const commonAddFieldsScaleWeightAndId = {
        'territoryLookup.scaleWeight': {
          $function: {
            body: `function (scale) {
            const SCALE_WEIGHT = {
              "Commune": 0,
              "Agglomération": 1,
              "Département": 2,
              "Région": 3,
              "Nationale": 4
            }
            return SCALE_WEIGHT[scale];
          }`,
            args: ['$territoryLookup.scale'],
            lang: 'js',
          },
        },
        id: '$_id',
        territoryIds: {
          $map: {
            input: '$territoryIds',
            in: {$toString: '$$this'},
          },
        },
      };

      let citizen: Citizen | undefined = undefined;

      let geoApiGouvResult: IGeoApiGouvResponseResult[] | undefined = [];

      let isPersonalizedSearch: Boolean = false;

      let aggregate: {
        [key: string]:
          | Where<Incentive>
          | Fields<Incentive>
          | AnyObject
          | string[]
          | string
          | undefined
          | number;
      } = {};

      if (this.currentUser?.roles?.includes(Roles.CITIZENS)) {
        citizen = await this.citizenService.getCitizenWithAffiliationById(this.currentUser.id);
        Logger.debug(IncentiveController.name, this.search.name, 'Citizen data', citizen);

        if (citizen.postcode && citizen.city) {
          geoApiGouvResult = await this.geoApiGouvService.getCommunesByPostalCodeAndCity(
            citizen!.postcode,
            citizen!.city,
          );
          Logger.debug(IncentiveController.name, this.search.name, 'Geogouv result', geoApiGouvResult);
        }

        // Personalized Search is a connected citizen with postcode and city and geoApiGouv result
        isPersonalizedSearch = Boolean(citizen.postcode && citizen.city && geoApiGouvResult?.length);
        Logger.debug(IncentiveController.name, this.search.name, 'Personalized search', isPersonalizedSearch);
      }

      // Determine aggregate based on personalized search
      if (!isPersonalizedSearch) {
        aggregate = {
          $match: handleWhereFilter(textSearch, filter?.where, citizen),
          $lookup: commonTerritoryLookup,
          $addFields: commonAddFieldsScaleWeightAndId,
          $limit: limit,
          $sort: {
            'territoryLookup.scaleWeight': -1,
            ...convertOrderFilter(filter?.order),
          },
          $unset: ['_id', 'territoryLookup'],
        };
      } else {
        aggregate = {
          $match: handleWhereFilter(textSearch, filter?.where, citizen),
          $lookup: commonTerritoryLookup,
          $addFields: commonAddFieldsScaleWeightAndId,
          $limit: limit,
          $facet: {
            filterIncentiveByMatch: [
              {
                $match: {
                  $or: [
                    {
                      'territoryLookup.inseeValueList': {
                        $in: [
                          geoApiGouvResult![0].code,
                          geoApiGouvResult![0].codeDepartement,
                          geoApiGouvResult![0].codeRegion,
                        ],
                      },
                    },
                    {
                      'territoryLookup.scale': {$eq: SCALE.NATIONAL},
                    },
                  ],
                },
              },
              {
                $sort: {
                  'territoryLookup.scaleWeight': 1,
                  ...convertOrderFilter(filter?.order),
                },
              },
            ],
            filterIncentiveByNotMatch: [
              {
                $match: {
                  $and: [
                    {
                      'territoryLookup.inseeValueList': {
                        $nin: [
                          geoApiGouvResult![0].code,
                          geoApiGouvResult![0].codeDepartement,
                          geoApiGouvResult![0].codeRegion,
                        ],
                      },
                    },
                    {
                      'territoryLookup.scale': {
                        $ne: SCALE.NATIONAL,
                      },
                    },
                  ],
                },
              },
              {$sort: {...convertOrderFilter(filter?.order)}},
            ],
          },
          $project: {
            result: {
              $concatArrays: ['$filterIncentiveByMatch', '$filterIncentiveByNotMatch'],
            },
          },
          $unwind: '$result',
          $replaceRoot: {newRoot: '$result'},
          $unset: ['_id', 'territoryLookup'],
        };
      }

      const formattedAggregate: PositionalParameters = Object.keys(aggregate).map((key: string) => {
        return {[key]: aggregate[key]};
      });

      if (territoryIdsFilter) {
        const matchTerritoryIds = {
          $match: {territoryIds: {$in: territoryIdsFilter}},
        };
        formattedAggregate.splice(3, 0, matchTerritoryIds);
      }

      if (filter?.fields) {
        formattedAggregate.push({$project: filter?.fields});
      }

      Logger.debug(IncentiveController.name, this.search.name, 'Formatted aggregate', formattedAggregate);

      return await this.incentiveRepository
        .execute('Incentive', 'aggregate', formattedAggregate)
        .then(res => res.get())
        .catch(err => {
          Logger.error(IncentiveController.name, this.search.name, 'Error', err);
          err;
        });
    } catch (error) {
      Logger.error(IncentiveController.name, this.search.name, 'Error', error);
      throw error;
    }
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK, AUTH_STRATEGY.API_KEY)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR, Roles.API_KEY, Roles.CITIZENS]})
  @get('/v1/incentives/count', {
    'x-controller-name': 'Incentives',
    summary: "Retourne le nombre d'aides",
    security: SECURITY_SPEC_API_KEY_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: "Le nombre d'aides",
        content: {
          'application/json': {
            schema: {...CountSchema, ...{title: 'Count'}},
          },
        },
      },
      ...defaultSwaggerError,
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
    allowedRoles: [Roles.API_KEY, Roles.CONTENT_EDITOR, Roles.MAAS, Roles.MAAS_BACKEND, Roles.PLATFORM],
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
      ...defaultSwaggerError,
    },
  })
  async findIncentiveById(
    @param.path.string('incentiveId', {description: `L'identifiant de l'aide`})
    incentiveId: string,
  ): Promise<Incentive> {
    try {
      const incentive: Incentive = await this.incentiveRepository.findById(incentiveId);
      Logger.debug(IncentiveController.name, this.findIncentiveById.name, 'Incentive data', incentive);
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
    } catch (error) {
      Logger.error(IncentiveController.name, this.findIncentiveById.name, 'Error', error);
      throw error;
    }
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @patch('/v1/incentives/{incentiveId}', {
    'x-controller-name': 'Incentives',
    summary: 'Modifie une aide',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: "Modification de l'aide réussie",
      },
      ...defaultSwaggerError,
    },
  })
  async updateById(
    @param.path.string('incentiveId', {description: `L'identifiant de l'aide`})
    incentiveId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Incentive, {
            exclude: ['id'],
            title: 'IncentiveUpdate',
            partial: true,
          }),
        },
      },
    })
    incentive: Incentive,
  ): Promise<void> {
    try {
      Logger.debug(IncentiveController.name, this.updateById.name, 'Incentive to update data', incentive);
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

      /**
       * Check if the provided ID exists in the territory collection.
       * For now, only one Territory is linked to an incentive
       */
      const territoryListResult: Territory[] = await this.territoryRepository.find({
        where: {id: {inq: incentive.territoryIds}},
      });
      Logger.debug(IncentiveController.name, this.updateById.name, 'Territory data', territoryListResult);

      /**
       * Check if the name provided matches the territory name.
       */
      if (!territoryListResult.length) {
        throw new BadRequestError(
          IncentiveController.name,
          this.updateById.name,
          'territory.not.found',
          '/territory',
          ResourceName.Territory,
          incentive.territoryIds,
        );
      }

      // TODO: REMOVING DEPRECATED territoryName.
      incentive.territoryName = territoryListResult[0].name;

      // Add new specificFields and unset subscription link
      if (incentive.isMCMStaff && incentive.specificFields && incentive.specificFields.length) {
        // Add json schema from specific fields
        incentive.jsonSchema = this.incentiveService.convertSpecificFields(
          incentive.title,
          incentive.specificFields,
        );
        Logger.debug(IncentiveController.name, this.updateById.name, 'Jsonschema data', incentive.jsonSchema);
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
        Logger.info(IncentiveController.name, this.updateById.name, 'Incentive updated', incentiveId);
      }

      // Get Exclusion EligibilityCheck
      const exclusionControl: IncentiveEligibilityChecks | null =
        await this.incentiveEligibilityChecksRepository.findOne({
          where: {label: ELIGIBILITY_CHECKS_LABEL.EXCLUSION},
        });

      Logger.debug(
        IncentiveController.name,
        this.updateById.name,
        'Exclusion control data',
        exclusionControl,
      );

      // Get current and updated exclusion list
      const currentIncentive: Incentive = await this.incentiveRepository.findById(incentiveId);

      const currentIncentiveExclusionControl: EligibilityCheck | undefined =
        currentIncentive.eligibilityChecks?.find(check => {
          return check.id === exclusionControl!.id;
        });
      Logger.debug(
        IncentiveController.name,
        this.updateById.name,
        'Current exclusion control data',
        currentIncentiveExclusionControl,
      );

      const updatedExclusionControl: EligibilityCheck | undefined = incentive.eligibilityChecks?.find(
        check => {
          return check.id === exclusionControl!.id;
        },
      );

      const exclusionsToDelete: string[] = this.incentiveService.getIncentiveIdsToDelete(
        currentIncentiveExclusionControl?.value || [],
        updatedExclusionControl?.value || [],
      );
      Logger.debug(IncentiveController.name, this.updateById.name, 'Exclusion to delete', exclusionsToDelete);

      const exclusionsToAdd: string[] = this.incentiveService.getIncentiveIdsToAdd(
        currentIncentiveExclusionControl?.value || [],
        updatedExclusionControl?.value || [],
      );
      Logger.debug(IncentiveController.name, this.updateById.name, 'Exclusion to add', exclusionsToAdd);

      if (exclusionsToAdd && exclusionsToAdd.length > 0) {
        const incentivesToAdd: Incentive[] = await this.incentiveRepository.find({
          where: {id: {inq: exclusionsToAdd}},
        });

        // Add Current Incentive to All Incentives added in Exclusion List
        await Promise.all([
          incentivesToAdd.map(async incentiveToAdd => {
            const updatedEligibilityChecks: EligibilityCheck[] =
              this.incentiveService.addIncentiveToExclusions(
                incentiveToAdd.eligibilityChecks,
                currentIncentive,
                exclusionControl!.id,
                updatedExclusionControl!.active,
              );

            await this.incentiveRepository.updateById(incentiveToAdd.id, {
              eligibilityChecks: updatedEligibilityChecks,
            });
          }),
        ]);
        Logger.info(IncentiveController.name, this.updateById.name, 'Incentives updated added exclusions');
      }

      if (exclusionsToDelete && exclusionsToDelete.length > 0) {
        const incentivesToDelete: Incentive[] = await this.incentiveRepository.find({
          where: {id: {inq: exclusionsToDelete}},
        });

        // Delete Current Incentive from All Incentives deleted from Exclusion List
        await Promise.all([
          incentivesToDelete.map(async incentiveToDelete => {
            incentiveToDelete = this.incentiveService.removeIncentiveFromExclusions(
              incentiveToDelete,
              currentIncentive,
              exclusionControl!.id,
            );
            if (incentiveToDelete.eligibilityChecks) {
              await this.incentiveRepository.updateById(incentiveToDelete.id, {
                eligibilityChecks: incentiveToDelete.eligibilityChecks,
              });
            } else {
              await this.incentiveRepository.updateById(incentiveToDelete.id, {
                $unset: {eligibilityChecks: []},
              } as any);
            }
          }),
        ]);
        Logger.info(
          IncentiveController.name,
          this.updateById.name,
          'Incentives updated deleted exclusions',
          incentivesToDelete,
        );
      }

      await this.incentiveRepository.updateById(incentiveId, incentive);
    } catch (error) {
      Logger.error(IncentiveController.name, this.updateById.name, 'Error', error);
      throw error;
    }
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @del('/v1/incentives/{incentiveId}', {
    'x-controller-name': 'Incentives',
    summary: 'Supprime une aide',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: "Supprimer le détail de l'aide",
      },
      ...defaultSwaggerError,
    },
  })
  async deleteById(
    @param.path.string('incentiveId', {description: `L'identifiant de l'aide`})
    incentiveId: string,
  ): Promise<void> {
    await this.incentiveRepository.deleteById(incentiveId);
  }
}

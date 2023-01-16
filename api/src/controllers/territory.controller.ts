import {
  AnyObject,
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {service} from '@loopback/core';
import {post, param, get, getModelSchemaRef, patch, requestBody} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {Incentive, Territory} from '../models';
import {IncentiveRepository, TerritoryRepository} from '../repositories';
import {
  AUTH_STRATEGY,
  SECURITY_SPEC_KC_PASSWORD,
  StatusCode,
  Roles,
  ResourceName,
  SECURITY_SPEC_API_KEY,
} from '../utils';
import {ValidationError} from '../validationError';
import {TerritoryService} from '../services/territory.service';
import {removeWhiteSpace} from './utils/helpers';

const ObjectId = require('mongodb').ObjectId;

export class TerritoryController {
  constructor(
    @repository(TerritoryRepository)
    public territoryRepository: TerritoryRepository,
    @repository(IncentiveRepository)
    public incentiveRepository: IncentiveRepository,
    @service(TerritoryService)
    public territoryService: TerritoryService,
  ) {}

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @post('/v1/territories', {
    'x-controller-name': 'Territories',
    summary: 'Crée un territoire',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Le territoire est créé',
        content: {},
      },
      [StatusCode.Forbidden]: {
        description: "L'utilisateur n'a pas les droits pour gérer les territoires",
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
      [StatusCode.UnprocessableEntity]: {
        description: 'Le nom de territoire que vous avez fourni existe déjà',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 422,
                name: 'Error',
                message: 'territory.name.error.unique',
                path: '/territoryName',
                resourceName: 'Territoire',
              },
            },
          },
        },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Territory, {
            title: 'TerritoryCreation',
            exclude: ['id'],
          }),
        },
      },
    })
    territory: Omit<Territory, 'id'>,
  ): Promise<Territory> {
    return this.territoryService.createTerritory(territory);
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK, AUTH_STRATEGY.API_KEY)
  @authorize({
    allowedRoles: [Roles.CONTENT_EDITOR, Roles.API_KEY, Roles.CITIZENS],
  })
  @get('/v1/territories', {
    'x-controller-name': 'Territories',
    summary: 'Retourne la liste des territoires',
    security: SECURITY_SPEC_API_KEY,
    responses: {
      [StatusCode.Success]: {
        description: 'La liste des territoires est retournée',
      },
    },
  })
  async find(@param.filter(Territory) filter?: Filter<Territory>): Promise<Territory[]> {
    return this.territoryRepository.find(filter);
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/territories/count', {
    'x-controller-name': 'Territories',
    summary: 'Récupère le nombre de territoires',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Le nombre de territoires est retourné',
        content: {
          'application/json': {
            schema: {...CountSchema, ...{title: 'Count'}},
          },
        },
      },
    },
  })
  async count(@param.where(Territory) where?: Where<Territory>): Promise<Count> {
    return this.territoryRepository.count(where);
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @patch('/v1/territories/{id}', {
    'x-controller-name': 'Territories',
    summary: 'Modifie un territoire',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'Modification du territoire réussie',
      },
      [StatusCode.Unauthorized]: {
        description: "L'utilisateur est non connecté",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: StatusCode.Unauthorized,
                name: 'Error',
                message: 'Authorization header not found',
                path: '/authorization',
              },
            },
          },
        },
      },
      [StatusCode.Forbidden]: {
        description: "L'utilisateur n'a pas les droits pour gérer les territoires",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: StatusCode.Unauthorized,
                name: 'Error',
                message: 'Access denied',
              },
            },
          },
        },
      },
      [StatusCode.NotFound]: {
        description: "Le territoire que vous voulez modifier n'existe pas",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: StatusCode.NotFound,
                name: 'Error',
                message: 'Entity not found: Territory',
                code: 'ENTITY_NOT_FOUND',
              },
            },
          },
        },
      },
      [StatusCode.UnprocessableEntity]: {
        description: 'Le nom de territoire que vous avez fourni existe déjà',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: StatusCode.UnprocessableEntity,
                name: 'Error',
                message: 'territory.name.error.unique',
                path: '/territoryName',
                resourceName: 'Territoire',
              },
            },
          },
        },
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Territory, {
            title: 'TerritoryUpdate',
            exclude: ['id'],
            partial: true,
          }),
        },
      },
    })
    newTerritory: Omit<Territory, 'id'>,
  ): Promise<void> {
    /**
     * Removing white spaces.
     * Exemple : "  Mulhouse   aglo " returns "Mulhouse aglo".
     */
    newTerritory.name = removeWhiteSpace(newTerritory.name);

    /**
     * Perform a case-insensitive search excluding the territory that will be updated.
     */
    const result: Territory | null = await this.territoryRepository.findOne({
      where: {id: {neq: new ObjectId(id)}, name: {regexp: `/^${newTerritory.name}$/i`}},
    });

    /**
     * Throw an error if the territory name is duplicated.
     */
    if (result) {
      throw new ValidationError(
        'territory.name.error.unique',
        '/territoryName',
        StatusCode.UnprocessableEntity,
        ResourceName.Territory,
      );
    }

    /**
     * Get all incentives related to the territory.
     */
    const incentiveWithTerritory: Incentive[] = await this.incentiveRepository.find({
      where: {
        'territory.id': id,
      } as AnyObject,
    });

    /**
     * Loop throught the incentives and change the territory name.
     */
    await Promise.all(
      incentiveWithTerritory.map((incentive: Incentive) => {
        const queryParams = {
          'territory.name': newTerritory.name,
        } as AnyObject;
        if (incentive.territoryName) {
          queryParams.territoryName = newTerritory.name; // TODO: REMOVING DEPRECATED territoryName.
        }
        return this.incentiveRepository.updateById(incentive.id, queryParams);
      }),
    );
    await this.territoryRepository.updateById(id, newTerritory);
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/territories/{id}', {
    'x-controller-name': 'Territories',
    summary: `Retoune les informations d'un territoire`,
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Le territoire est retourné',
      },
      [StatusCode.NotFound]: {
        description: "Le territoire n'existe pas",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 404,
                name: 'Error',
                message: 'Entity not found: Territory',
                code: 'ENTITY_NOT_FOUND',
              },
            },
          },
        },
      },
    },
  })
  async findById(@param.path.string('id') id: string): Promise<Territory> {
    return this.territoryRepository.findById(id);
  }
}

import {Schema} from 'jsonschema';
import {inject} from '@loopback/context';
import {Count, CountSchema, Filter, repository, Where} from '@loopback/repository';
import {intercept, service} from '@loopback/core';
import {post, param, get, getModelSchemaRef, patch, requestBody, RestBindings} from '@loopback/rest';
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
  Logger,
  SECURITY_SPEC_ALL,
} from '../utils';
import {ConflictError} from '../validationError';
import {TerritoryService} from '../services/territory.service';
import {removeWhiteSpace} from './utils/helpers';
import {TerritoryInterceptor} from '../interceptors';
import {defaultSwaggerError} from './utils/swagger-errors';
import {TAG_MAAS} from '../constants';
import express, {Request, Response} from 'express';

@intercept(TerritoryInterceptor.BINDING_KEY)
export class TerritoryController {
  constructor(
    @inject(RestBindings.Http.RESPONSE) private response: Response,
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
      [StatusCode.Created]: {
        description: 'Le territoire est créé',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Territory),
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
          schema: getModelSchemaRef(Territory, {
            title: 'TerritoryCreation',
            exclude: ['id'],
          }),
        },
      },
    })
    territory: Omit<Territory, 'id'>,
  ): Promise<Territory> {
    this.response.status(201);
    try {
      const result: Territory = await this.territoryService.createTerritory(territory);
      Logger.info(TerritoryController.name, this.create.name, 'Territory created', result.id);
      return result;
    } catch (error) {
      Logger.error(TerritoryController.name, this.create.name, 'Error', error);
      throw error;
    }
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK, AUTH_STRATEGY.API_KEY)
  @authorize({
    allowedRoles: [Roles.CONTENT_EDITOR, Roles.API_KEY, Roles.CITIZENS, Roles.MAAS, Roles.MAAS_BACKEND],
  })
  @get('/v1/territories', {
    'x-controller-name': 'Territories',
    summary: 'Retourne la liste des territoires',
    security: SECURITY_SPEC_ALL,
    tags: ['Territories', TAG_MAAS],
    description: `Ce service permet de récupérer la liste des territoires.<br>
    Il permet également de filtrer sur les territoires en fonction des critères \
    spécifiés dans la clause where du filtre.
    Les codes INSEE peuvent être obtenus auprès de l'<a href="https://api.gouv.fr/documentation/api-geo">
    API Découpage Adminitratif</a>.
    <p><strong>Exemples de requête :</strong></p>
    <code>GET /v1/territories?filter={"where": {"name": "Mulhouse Alsace Agglomération"},
    "fields": {"id": true, "name": true, "scale": true, "inseeValueList": true}}
    </code><br><br>
    <code>GET /v1/territories?filter={"where": {"inseeValueList": {"inq": ["68224", "68"]}},
    "fields": {"id": true, "name": true, "scale": true, "inseeValueList": true}}
    </code>
    `,
    responses: {
      [StatusCode.Success]: {
        description: 'La liste des territoires',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                allOf: [getModelSchemaRef(Territory)],
              },
            },
          },
        },
      },
      ...defaultSwaggerError,
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
        description: 'Le nombre de territoires',
        content: {
          'application/json': {
            schema: {...CountSchema, ...{title: 'Count'}},
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async count(@param.where(Territory) where?: Where<Territory>): Promise<Count> {
    return this.territoryRepository.count(where);
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @patch('/v1/territories/{territoryId}', {
    'x-controller-name': 'Territories',
    summary: 'Modifie un territoire',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.NoContent]: {
        description: 'Modification du territoire réussie',
      },
      ...defaultSwaggerError,
    },
  })
  async updateById(
    @param.path.string('territoryId') id: string,
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
    try {
      /**
       * Removing white spaces.
       * Exemple : "  Mulhouse   aglo " returns "Mulhouse aglo".
       */
      newTerritory.name = removeWhiteSpace(newTerritory.name);

      /**
       * Perform a case-insensitive search excluding the territory that will be updated.
       */
      const result: Territory[] = await this.territoryRepository
        .execute('Territory', 'aggregate', [
          {
            $project: {
              name: 1,
              stringId: {$toString: '$_id'},
            },
          },
          {
            $match: {
              $and: [{stringId: {$ne: id}}, {name: {$regex: newTerritory.name, $options: 'i'}}],
            },
          },
        ])
        .then((res: any) => res.get());

      Logger.debug(TerritoryController.name, this.updateById.name, 'Case insensitive Match', result);

      /**
       * Throw an error if the territory name is duplicated.
       */
      if (result.length) {
        throw new ConflictError(
          TerritoryController.name,
          this.updateById.name,
          'territory.name.error.unique',
          '/territoryName',
          ResourceName.Territory,
          newTerritory.name,
        );
      }

      // TODO: REMOVING DEPRECATED territoryName.
      /**
       * Get all incentives related to the territory.
       */
      const incentiveWithTerritory: Incentive[] = await this.incentiveRepository.find({
        where: {
          territoryIds: id,
        } as Where<Incentive>,
        include: ['territories'],
      });

      /**
       * Loop throught the incentives and change the territory name.
       */
      await Promise.all(
        incentiveWithTerritory.map(async (incentive: Incentive) => {
          if (incentive.territoryName) {
            return this.incentiveRepository.updateById(incentive.id, {
              territoryName: newTerritory.name,
            });
          }
        }),
      );
      Logger.debug(
        TerritoryController.name,
        this.updateById.name,
        'Incentive updated',
        incentiveWithTerritory,
      );

      await this.territoryRepository.updateById(id, newTerritory);
      Logger.info(TerritoryController.name, this.updateById.name, 'Territory updated', id);
    } catch (error) {
      Logger.error(TerritoryController.name, this.updateById.name, 'Error', error);
      throw error;
    }
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/territories/{territoryId}', {
    'x-controller-name': 'Territories',
    summary: `Retoune les informations d'un territoire`,
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Le territoire est retourné',
        content: {
          'application/json': {schema: getModelSchemaRef(Territory)},
        },
      },
      ...defaultSwaggerError,
    },
  })
  async findById(@param.path.string('territoryId') id: string): Promise<Territory> {
    return this.territoryRepository.findById(id);
  }
}

import {inject} from '@loopback/core';
import {Count, CountSchema, repository, Where} from '@loopback/repository';
import {post, param, get, getModelSchemaRef, requestBody} from '@loopback/rest';
import {pick} from 'lodash';
import {authorize} from '@loopback/authorization';
import {authenticate} from '@loopback/authentication';

import {Collectivity} from '../models';
import {CollectivityRepository} from '../repositories';
import {KeycloakService} from '../services';
import {
  GROUPS,
  Roles,
  StatusCode,
  SECURITY_SPEC_KC_PASSWORD,
  AUTH_STRATEGY,
} from '../utils';

@authenticate(AUTH_STRATEGY.KEYCLOAK)
@authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
export class CollectivityController {
  constructor(
    @repository(CollectivityRepository)
    public collectivityRepository: CollectivityRepository,
    @inject('services.KeycloakService')
    public kcService: KeycloakService,
  ) {}

  /**
   * Create one collectivity
   * @param collectivity schema
   */
  @post('/v1/collectivities', {
    'x-controller-name': 'Collectivities',
    summary: 'Crée une collectivité',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Nouvelle collectivité',
        content: {'application/json': {schema: getModelSchemaRef(Collectivity)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Collectivity),
        },
      },
    })
    collectivity: Collectivity,
  ): Promise<Collectivity | undefined> {
    let keycloakGroupCreationResult;

    try {
      const {name} = collectivity;
      keycloakGroupCreationResult = await this.kcService.createGroupKc(
        name,
        GROUPS.collectivities,
      );

      if (keycloakGroupCreationResult && keycloakGroupCreationResult.id) {
        const collectivityModel = pick(collectivity, [
          'name',
          'citizensCount',
          'mobilityBudget',
          'encryptionKey',
        ]);

        const RepositoryCollectivityCreationResult =
          await this.collectivityRepository.create({
            ...collectivityModel,
            ...keycloakGroupCreationResult,
          });

        return RepositoryCollectivityCreationResult;
      }
    } catch (error) {
      if (keycloakGroupCreationResult && keycloakGroupCreationResult.id)
        await this.kcService.deleteGroupKc(keycloakGroupCreationResult.id);
      throw error;
    }
  }

  /**
   * Count the collectivities
   * @param where the collectivity where filter
   * @returns the number the collectivities
   */
  @get('/v1/collectivities/count', {
    'x-controller-name': 'Collectivities',
    summary: 'Retourne le nombre de collectivités',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Collectivity model count',
        content: {
          'application/json': {
            schema: {...CountSchema, ...{title: 'Count'}},
          },
        },
      },
    },
  })
  async count(@param.where(Collectivity) where?: Where<Collectivity>): Promise<Count> {
    return this.collectivityRepository.count(where);
  }

  /**
   * Get all collectivities
   * @returns all collectivities
   */
  @get('/v1/collectivities', {
    'x-controller-name': 'Collectivities',
    summary: 'Retourne les collectivités',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Array of Collectivity model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Collectivity),
            },
          },
        },
      },
    },
  })
  async find(): Promise<Collectivity[]> {
    return this.collectivityRepository.find();
  }
}

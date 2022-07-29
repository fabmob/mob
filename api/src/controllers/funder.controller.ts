import {post, param, get, getModelSchemaRef, requestBody} from '@loopback/rest';
import {repository, Count, CountSchema, Where} from '@loopback/repository';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';

import {orderBy, capitalize} from 'lodash';

import {Collectivity, Community, Enterprise, FunderCommunity} from '../models';
import {
  CommunityRepository,
  EnterpriseRepository,
  CollectivityRepository,
} from '../repositories';
import {FunderService} from '../services';
import {
  ResourceName,
  StatusCode,
  SECURITY_SPEC_KC_PASSWORD,
  FUNDER_TYPE,
  Roles,
  AUTH_STRATEGY,
} from '../utils';
import {ValidationError} from '../validationError';

@authenticate(AUTH_STRATEGY.KEYCLOAK)
export class FunderController {
  constructor(
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
    @repository(EnterpriseRepository)
    public enterpriseRepository: EnterpriseRepository,
    @repository(CollectivityRepository)
    public collectivityRepository: CollectivityRepository,
    @inject('services.FunderService')
    public funderService: FunderService,
  ) {}

  /**
   * Get all funders
   * @returns all funders
   */
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/funders', {
    'x-controller-name': 'Funders',
    summary: 'Retourne les financeurs',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Array of funders',
        content: {
          'application/json': {
            schema: {
              title: 'Funders',
              type: 'array',
              items: {
                allOf: [
                  {
                    anyOf: [{'x-ts-type': Enterprise}, {'x-ts-type': Collectivity}],
                  },
                  {
                    type: 'object',
                    properties: {
                      funderType: {
                        type: 'string',
                      },
                    },
                    required: ['funderType'],
                  },
                ],
              },
            },
          },
        },
      },
    },
  })
  find(): Promise<Array<(Enterprise & Collectivity) & {funderType: FUNDER_TYPE}>> {
    return this.funderService.getFunders();
  }

  /**
   * Get the number of communities
   */
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/funders/communities/count', {
    'x-controller-name': 'Funders',
    summary: 'Retourne le nombre de communautés',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Community model count',
        content: {
          'application/json': {
            schema: {...CountSchema, ...{title: 'Count'}},
          },
        },
      },
    },
  })
  async count(@param.where(Community) where?: Where<Community>): Promise<Count> {
    return this.communityRepository.count(where);
  }

  /**
   * Get all communities with associated funders
   * @returns all communities with associated funders
   */
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/funders/communities', {
    'x-controller-name': 'Funders',
    summary: 'Retourne les communautés et leurs financeurs associés',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Array of Community model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(FunderCommunity),
            },
          },
        },
      },
    },
  })
  async findCommunities(): Promise<FunderCommunity[]> {
    const funders = await this.funderService.getFunders();

    const community: Community[] = await this.communityRepository.find({
      fields: {name: true, id: true, funderId: true},
    });

    const allCommunities: any =
      community &&
      community.map((elt: any) => {
        const funder = funders && funders.find((elt1: any) => elt.funderId === elt1.id);

        return {
          ...elt,
          funderType: capitalize(funder.funderType),
          funderName: funder.name,
        };
      });

    return orderBy(allCommunities, ['funderName', 'funderType', 'name'], ['asc']);
  }

  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @post('/v1/funders/communities', {
    'x-controller-name': 'Funders',
    summary: 'Crée une communauté pour un financeur',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Community model instance',
        content: {'application/json': {schema: getModelSchemaRef(Community)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Community),
        },
      },
    })
    community: Omit<Community, 'id'>,
  ): Promise<Community> {
    const {name, funderId} = community;

    const communitiesByFunderId = await this.communityRepository.find({
      where: {funderId, name},
      fields: {id: true},
    });
    if (communitiesByFunderId.length === 0) {
      const enterprises = await this.enterpriseRepository.find({
        where: {id: funderId},
        fields: {id: true},
      });
      let collectivities = [];

      if (enterprises.length === 0) {
        collectivities = await this.collectivityRepository.find({
          where: {id: funderId},
          fields: {id: true},
        });
      }

      if (collectivities.length > 0 || enterprises.length > 0)
        return this.communityRepository.create(community);

      throw new ValidationError(
        `communities.error.funders.missed`,
        `/communities`,
        StatusCode.UnprocessableEntity,
        ResourceName.Community,
      );
    }
    throw new ValidationError(
      `communities.error.name.unique`,
      `/communities`,
      StatusCode.UnprocessableEntity,
      ResourceName.Community,
    );
  }

  @authorize({allowedRoles: [Roles.CONTENT_EDITOR, Roles.PLATFORM]})
  @get('/v1/funders/{funderId}/communities', {
    'x-controller-name': 'Funders',
    summary: "Retourne les communautés d'un financeur",
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: `Réponse si les communautés d'au moins\
         un financeur sont trouvées.`,
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Community),
            },
          },
        },
      },
    },
  })
  async findByFunderId(
    @param.path.string('funderId', {description: `L'identifiant du financeur`})
    funderId: string,
  ): Promise<Community[]> {
    return this.communityRepository.findByFunderId(funderId);
  }
}

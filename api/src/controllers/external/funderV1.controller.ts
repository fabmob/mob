import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {repository} from '@loopback/repository';
import {param, get, getModelSchemaRef} from '@loopback/rest';
import {intercept} from '@loopback/core';

import {Community} from '../../models';
import {CommunityRepository} from '../../repositories';
import {checkMaas} from '../../services';
import {AffiliationInterceptor} from '../../interceptors';
import {StatusCode, SECURITY_SPEC_JWT, AUTH_STRATEGY, Logger} from '../../utils';
import {defaultSwaggerError} from '../utils/swagger-errors';

export class FunderV1Controller {
  constructor(
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
  ) {}

  /**
   * TODO: REMOVING DEPRECATED ENDPOINT v1/maas/funders/{funderId}/communities.
   * Remove this endpoint
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: ['maas'], voters: [checkMaas]})
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @get('v1/maas/funders/{funderId}/communities', {
    'x-controller-name': 'Funders',
    summary: "Retourne les communautés d'un financeur",
    security: SECURITY_SPEC_JWT,
    deprecated: true,
    responses: {
      [StatusCode.Success]: {
        description: "La liste des communautés d'un financeur.",
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'Identifiant de la communauté',
                    example: '',
                  },
                  name: {
                    type: 'string',
                    description: 'Nom de la communauté',
                    example: 'Communauté de Mulhouse',
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
  async findCommunitiesByFunderId(
    @param.path.string('funderId', {
      description: `L'identifiant du financeur`,
    })
    funderId: string,
  ): Promise<{id: string | undefined; name: string}[]> {
    try {
      Logger.warn(
        FunderV1Controller.name,
        this.findCommunitiesByFunderId.name,
        'DEPRECATED ENDPOINT - WONT BE LOGGED',
      );
      const communities: Community[] = await this.communityRepository.findByFunderId(funderId);
      return communities.map(({id, name}) => ({id, name}));
    } catch (error) {
      Logger.error(FunderV1Controller.name, this.findCommunitiesByFunderId.name, 'Error', error);
      throw error;
    }
  }
}

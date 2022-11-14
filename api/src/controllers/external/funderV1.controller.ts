import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {repository} from '@loopback/repository';
import {param, get} from '@loopback/rest';
import {intercept} from '@loopback/core';

import {Community} from '../../models';
import {CommunityRepository} from '../../repositories';
import {checkMaas} from '../../services';
import {AffiliationInterceptor} from '../../interceptors';
import {StatusCode, SECURITY_SPEC_JWT, AUTH_STRATEGY} from '../../utils';

export class FunderV1Controller {
  constructor(
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
  ) {}
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: ['maas'], voters: [checkMaas]})
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @get('v1/maas/funders/{funderId}/communities', {
    'x-controller-name': 'Funders',
    summary: "Retourne les communautés d'un financeur",
    security: SECURITY_SPEC_JWT,
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
                  },
                  name: {
                    type: 'string',
                    description: 'Nom de la communauté',
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async findCommunitiesByFunderId(
    @param.path.string('funderId', {
      description: `L'identifiant du financeur`,
    })
    funderId: string,
  ): Promise<{id: string | undefined; name: string}[]> {
    const communities: Community[] = await this.communityRepository.findByFunderId(
      funderId,
    );
    return communities.map(({id, name}) => ({id, name}));
  }
}

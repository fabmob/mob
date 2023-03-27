import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {repository} from '@loopback/repository';
import {get} from '@loopback/rest';

import {Client} from '../models';
import {ClientScopeRepository} from '../repositories';
import {AUTH_STRATEGY, Logger, Roles, SECURITY_SPEC_KC_PASSWORD, StatusCode} from '../utils';
import {defaultSwaggerError} from './utils/swagger-errors';

export class ClientController {
  constructor(
    @repository(ClientScopeRepository)
    public clientScopeRepository: ClientScopeRepository,
  ) {}

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/clients', {
    'x-controller-name': 'Clients',
    summary: 'Retourne les clients OpenID Connect disponibles',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'La liste des clients OpenID Connect',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    description: `Identifiant`,
                    type: 'string',
                    example: '',
                  },
                  clientId: {
                    description: `Identifiant du client`,
                    type: 'string',
                    example: '',
                  },
                  name: {
                    description: `Nom du client`,
                    type: 'string',
                    example: '',
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
  async findClients(): Promise<Pick<Client, 'id' | 'clientId' | 'name'>[] | undefined> {
    try {
      const clients: Pick<Client, 'id' | 'clientId' | 'name'>[] | undefined =
        await this.clientScopeRepository.getClients();
      return clients;
    } catch (error) {
      Logger.error(ClientController.name, this.findClients.name, 'Error', error);
      throw error;
    }
  }
}

import {post, param, get, getModelSchemaRef, requestBody, put} from '@loopback/rest';
import {repository, Count, CountSchema, Where} from '@loopback/repository';
import {inject, intercept, service} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';

import {orderBy, capitalize} from 'lodash';

import {
  Collectivity,
  Community,
  Enterprise,
  FunderCommunity,
  EncryptionKey,
  Error,
  Client,
} from '../models';
import {
  CommunityRepository,
  EnterpriseRepository,
  CollectivityRepository,
  ClientScopeRepository,
} from '../repositories';
import {FunderService} from '../services';
import {
  ResourceName,
  StatusCode,
  SECURITY_SPEC_KC_PASSWORD,
  Roles,
  AUTH_STRATEGY,
  IFunder,
  IFindCommunities,
  SECURITY_SPEC_KC_CREDENTIALS,
  SECURITY_SPEC_KC_CREDENTIALS_KC_PASSWORD,
} from '../utils';
import {ValidationError} from '../validationError';
import {FunderInterceptor} from '../interceptors';
import {canAccessHisOwnData} from '../services';
import _ from 'lodash';

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
    @repository(ClientScopeRepository)
    private clientScopeRepository: ClientScopeRepository,
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
  find(): Promise<IFunder[]> {
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
  async findCommunities(): Promise<IFindCommunities[]> {
    const funders = await this.funderService.getFunders();

    const community: Community[] = await this.communityRepository.find({
      fields: {name: true, id: true, funderId: true},
    });
    const allCommunities =
      community &&
      community.map((elt: Community) => {
        const funder =
          funders && funders.find((elt1: IFunder) => elt.funderId === elt1.id);

        return {
          ...elt,
          funderType: capitalize(funder?.funderType),
          funderName: funder?.name,
        };
      });

    return orderBy(allCommunities, ['funderName', 'funderType', 'name'], ['asc']);
  }

  /**
   * Post funder's public encryption key
   * @returns funder's public encryption key
   */
  @authorize({allowedRoles: [Roles.SIRH_BACKEND, Roles.VAULT_BACKEND]})
  @intercept(FunderInterceptor.BINDING_KEY)
  @put('/v1/funders/{funderId}/encryption_key', {
    'x-controller-name': 'Funders',
    summary: 'Enregistre les paramètres de clé de chiffrement',
    security: SECURITY_SPEC_KC_CREDENTIALS,
    responses: {
      [StatusCode.NoContent]: {
        description: `Les paramètres de clé de chiffrement ont bien été enregistrés`,
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
          "L'utilisateur n'a pas les droits pour enregistrer les paramètres de clé de chiffrement",
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
        description: "Ce financeur n'existe pas",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 404,
                name: 'Error',
                message: 'Funder not found',
                path: '/Funder',
              },
            },
          },
        },
      },
      [StatusCode.UnprocessableEntity]: {
        description: 'Les informations sur la clé de chiffrement ne sont pas valides',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 422,
                name: 'Error',
                message: `encryptionKey.error.privateKeyAccess.missing`,
                path: '/EncryptionKey',
              },
            },
          },
        },
      },
    },
  })
  async storeEncryptionKey(
    @param.path.string('funderId', {description: `L'identifiant du financeur`})
    funderId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(EncryptionKey),
        },
      },
    })
    encryptionKey: EncryptionKey,
  ): Promise<void> {
    const enterprise: Enterprise | null = await this.enterpriseRepository.findOne({
      where: {id: funderId},
    });
    const collectivity: Collectivity | null = await this.collectivityRepository.findOne({
      where: {id: funderId},
    });

    if (enterprise) {
      await this.enterpriseRepository.updateById(enterprise.id, {encryptionKey});
    }

    if (collectivity) {
      await this.collectivityRepository.updateById(collectivity.id, {
        encryptionKey,
      });
    }
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

  @authorize({voters: [canAccessHisOwnData]})
  @get('/v1/funders/{funderId}', {
    'x-controller-name': 'Funders',
    summary: 'Retourne la clé privée du financeur',
    security: SECURITY_SPEC_KC_CREDENTIALS_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: `Funder`,
        content: {
          'application/json': {
            schema: {
              oneOf: [getModelSchemaRef(Community), getModelSchemaRef(Enterprise)],
            },
          },
        },
      },
      [StatusCode.Unauthorized]: {
        description: 'The user is not logged in',
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
        description: 'The user does not have access rights',
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
  async findFunderById(
    @param.path.string('funderId', {description: `L'identifiant du financeur`})
    funderId: string,
  ): Promise<Collectivity | Enterprise> {
    let funder: Collectivity | Enterprise | undefined = undefined;
    const collectivity = await this.collectivityRepository.findOne({
      where: {id: funderId},
    });
    const enterprise = await this.enterpriseRepository.findOne({
      where: {id: funderId},
    });
    funder = collectivity ? collectivity : enterprise ? enterprise : undefined;
    if (!funder) {
      throw new ValidationError(
        `Funder not found`,
        `/Funder`,
        StatusCode.NotFound,
        ResourceName.Funder,
      );
    }
    return funder;
  }

  /**
   * Get all clients with a specific scope
   * @returns all clients
   */
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/funders/clients', {
    'x-controller-name': 'Funders',
    summary: 'Retourne les financeurs',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Array of clients',
        content: {
          'application/json': {
            schema: {
              title: 'clients',
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  clientId: {
                    description: `Identifiant du client`,
                    type: 'string',
                    example: '',
                  },
                  id: {
                    description: `Identifiant`,
                    type: 'string',
                    example: '',
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async findClients(): Promise<Client[]> {
    const clients = await this.clientScopeRepository.getClients();
    return clients!;
  }
}

import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject, intercept, service} from '@loopback/core';
import {Count, CountSchema, Filter, repository, Where} from '@loopback/repository';
import {post, param, get, getModelSchemaRef, requestBody, put, RestBindings} from '@loopback/rest';
import {SecurityBindings} from '@loopback/security';
import {capitalize, orderBy} from 'lodash';
import {CitizensWithSubscriptionSchema, TAG_MAAS} from '../constants';

import {AffiliationInterceptor, FunderInterceptor} from '../interceptors';
import {
  Funder,
  Collectivity,
  Enterprise,
  NationalAdministration,
  Community,
  FunderCommunity,
  EncryptionKey,
  Citizen,
} from '../models';
import {
  ClientScopeRepository,
  CommunityRepository,
  FunderRepository,
  UserEntityRepository,
} from '../repositories';
import {CitizenService, KeycloakService, SubscriptionService} from '../services';
import {
  AFFILIATION_STATUS,
  AUTH_STRATEGY,
  FUNDER_TYPE,
  GROUPS,
  IFindCommunities,
  IUser,
  Logger,
  PartialCitizen,
  ResourceName,
  Roles,
  SECURITY_SPEC_API_KEY_KC_PASSWORD,
  SECURITY_SPEC_JWT_KC_PASSWORD,
  SECURITY_SPEC_KC_CREDENTIALS,
  SECURITY_SPEC_KC_PASSWORD,
  StatusCode,
} from '../utils';
import {BadRequestError} from '../validationError';
import {defaultSwaggerError} from './utils/swagger-errors';
import express, {Request, Response} from 'express';

export class FunderController {
  constructor(
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @repository(FunderRepository)
    public funderRepository: FunderRepository,
    @repository(CommunityRepository)
    public communityRepository: CommunityRepository,
    @repository(ClientScopeRepository)
    public clientScopeRepository: ClientScopeRepository,
    @repository(UserEntityRepository)
    public userEntityRepository: UserEntityRepository,
    @service(KeycloakService)
    public keycloakService: KeycloakService,
    @service(CitizenService)
    public citizenService: CitizenService,
    @service(SubscriptionService)
    public subscriptionService: SubscriptionService,
    @inject(SecurityBindings.USER)
    private currentUser: IUser,
  ) {}

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @intercept(FunderInterceptor.BINDING_KEY)
  @post('/v1/funders', {
    'x-controller-name': 'Funders',
    summary: 'Crée un financeur',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Created]: {
        description: 'Le financeur est créé',
        content: {'application/json': {schema: getModelSchemaRef(Funder)}},
      },
      ...defaultSwaggerError,
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            anyOf: [
              getModelSchemaRef(NationalAdministration, {
                exclude: ['id'],
                title: 'CreateNationalAdministration',
              }),
              getModelSchemaRef(Collectivity, {
                exclude: ['id'],
                title: 'CreateCollectivity',
              }),
              getModelSchemaRef(Enterprise, {
                exclude: ['id'],
                title: 'CreateEnterprise',
              }),
            ],
          },
        },
      },
    })
    funder: Funder,
  ): Promise<{id: string}> {
    this.response.status(201);
    let funderGroupKC: {id: string} | undefined;
    try {
      const FUNDER_TO_GROUPS: {[key: string]: GROUPS} = {
        [FUNDER_TYPE.ENTERPRISE]: GROUPS.enterprises,
        [FUNDER_TYPE.COLLECTIVITY]: GROUPS.collectivities,
        [FUNDER_TYPE.NATIONAL]: GROUPS.administrations_nationales,
      };

      funderGroupKC = await this.keycloakService.createGroupKc(funder.name, FUNDER_TO_GROUPS[funder.type]);

      Logger.info(FunderController.name, this.create.name, 'Funder created in KC', funderGroupKC.id);

      if (funder.clientId) {
        const serviceUser = await this.userEntityRepository.getServiceUser(funder.clientId);
        await this.keycloakService.addUserGroupMembership(serviceUser!.id, funderGroupKC.id);
        Logger.info(FunderController.name, this.create.name, 'ServiceUser added to group', funderGroupKC.id);
        // Remove clientId from object
        delete funder.clientId;
      }

      const funderRepository: Funder = await this.funderRepository.create({
        ...funder,
        ...funderGroupKC,
      });
      Logger.info(FunderController.name, this.create.name, 'Funder created in Mongo', funderGroupKC.id);
      return funderRepository;
    } catch (err) {
      if (funderGroupKC && funderGroupKC.id) {
        await this.keycloakService.deleteGroupKc(funderGroupKC.id);
        Logger.info(FunderController.name, this.create.name, 'Funder deleted from KC', funderGroupKC.id);
      }
      Logger.error(FunderController.name, this.create.name, 'Error', err);
      throw err;
    }
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/funders/count', {
    'x-controller-name': 'Funders',
    summary: 'Récupère le nombre de financeurs',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Le nombre de financeurs',
        content: {
          'application/json': {schema: {...CountSchema, ...{title: 'Count'}}},
        },
      },
      ...defaultSwaggerError,
    },
  })
  async count(@param.where(Funder) where?: Where<Funder>): Promise<Count> {
    try {
      return await this.funderRepository.count(where);
    } catch (err) {
      Logger.error(FunderController.name, this.count.name, 'Error', err);
      throw err;
    }
  }

  @authenticate(AUTH_STRATEGY.API_KEY, AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.API_KEY, Roles.CONTENT_EDITOR, Roles.CITIZENS]})
  @intercept(FunderInterceptor.BINDING_KEY)
  @get('/v1/funders', {
    'x-controller-name': 'Funders',
    summary: 'Récupère la liste des financeurs',
    security: SECURITY_SPEC_API_KEY_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'La liste des financeurs',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                anyOf: [
                  getModelSchemaRef(NationalAdministration),
                  getModelSchemaRef(Collectivity),
                  getModelSchemaRef(Enterprise),
                ],
              },
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async find(@param.filter(Funder) filter?: Filter<Funder>): Promise<Funder[]> {
    try {
      return await this.funderRepository.find(filter);
    } catch (err) {
      Logger.error(FunderController.name, this.find.name, 'Error', err);
      throw err;
    }
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.FUNDERS, Roles.CONTENT_EDITOR]})
  @intercept(FunderInterceptor.BINDING_KEY)
  @get('/v1/funders/{funderId}', {
    'x-controller-name': 'Funders',
    summary: `Retourne les informations d'un financeur`,
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Les informations du financeur',
        content: {
          'application/json': {
            schema: {
              oneOf: [
                getModelSchemaRef(NationalAdministration),
                getModelSchemaRef(Collectivity),
                getModelSchemaRef(Enterprise),
              ],
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async findById(@param.path.string('funderId') funderId: string): Promise<Funder> {
    try {
      return await this.funderRepository.findById(funderId);
    } catch (err) {
      Logger.error(FunderController.name, this.findById.name, 'Error', err);
      throw err;
    }
  }

  /**
   * Post funder's public encryption key
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
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
      ...defaultSwaggerError,
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
    try {
      const funder: Funder = await this.funderRepository.findById(funderId);
      Logger.debug(FunderController.name, this.storeEncryptionKey.name, 'Funder result', funder);
      if (funder) {
        await this.funderRepository.updateById(funder.id, {encryptionKey});
        Logger.info(FunderController.name, this.storeEncryptionKey.name, 'Funder updated', funder.id);
      }
    } catch (error) {
      Logger.error(FunderController.name, this.storeEncryptionKey.name, 'Error', error);
      throw error;
    }
  }

  /**
   * Get the number of communities
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/funders/communities/count', {
    'x-controller-name': 'Funders',
    summary: 'Retourne le nombre de communautés',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Le nombre de communautés financeur',
        content: {
          'application/json': {
            schema: {...CountSchema, ...{title: 'Count'}},
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async countCommunities(@param.where(Community) where?: Where<Community>): Promise<Count> {
    return this.communityRepository.count(where);
  }

  /**
   * Get all communities with associated funders
   * @returns all communities with associated funders
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/funders/communities', {
    'x-controller-name': 'Funders',
    summary: 'Retourne les communautés et leurs financeurs associés',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'La liste des communautés financeur',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(FunderCommunity),
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async findCommunities(@param.filter(Community) filter?: Filter<Community>): Promise<IFindCommunities[]> {
    try {
      // Check if where filter contains limit
      const limit: number | null = filter?.limit ?? 10;
      Logger.debug(FunderController.name, this.findCommunities.name, 'Applied limit', limit);

      const funderList: Pick<Funder, 'id' | 'type' | 'name'>[] = await this.funderRepository.find({
        fields: {id: true, type: true, name: true},
      });
      const community: Pick<Community, 'id' | 'funderId' | 'name'>[] = await this.communityRepository.find(
        filter,
        {
          fields: {name: true, id: true, funderId: true},
        },
      );

      const allCommunities =
        community &&
        community.map((elt: Pick<Community, 'id' | 'funderId' | 'name'>) => {
          const funder =
            funderList &&
            funderList.find((elt1: Pick<Funder, 'id' | 'type' | 'name'>) => elt.funderId === elt1.id);

          return {
            ...elt,
            funderType: capitalize(funder!.type),
            funderName: funder!.name,
          };
        });

      return allCommunities;
    } catch (error) {
      Logger.error(FunderController.name, this.findCommunities.name, 'Error', error);
      throw error;
    }
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @post('/v1/funders/communities', {
    'x-controller-name': 'Funders',
    summary: 'Crée une communauté pour un financeur',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Created]: {
        description: 'La communauté financeur créée',
        content: {'application/json': {schema: getModelSchemaRef(Community)}},
      },
      ...defaultSwaggerError,
    },
  })
  async createCommunity(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Community, {
            exclude: ['id'],
            title: 'CreateCommunity',
          }),
        },
      },
    })
    community: Omit<Community, 'id'>,
  ): Promise<Community | undefined> {
    this.response.status(201);
    try {
      const {name, funderId} = community;

      const communitiesByFunderId = await this.communityRepository.findOne({
        where: {funderId, name},
        fields: {id: true},
      });

      Logger.debug(
        FunderController.name,
        this.createCommunity.name,
        'Communities data',
        communitiesByFunderId,
      );

      if (!communitiesByFunderId) {
        const funder: Funder | null = await this.funderRepository.findById(funderId);

        if (funder) {
          const result: Community = await this.communityRepository.create(community);
          Logger.info(FunderController.name, this.createCommunity.name, 'Community created', result.id);
          return result;
        }
      }
      return undefined;
    } catch (error) {
      Logger.error(FunderController.name, this.createCommunity.name, 'Error', error);
      throw error;
    }
  }

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR, Roles.PLATFORM, Roles.MAAS]})
  @intercept(AffiliationInterceptor.BINDING_KEY)
  @get('/v1/funders/{funderId}/communities', {
    'x-controller-name': 'Funders',
    summary: "Retourne les communautés d'un financeur",
    security: SECURITY_SPEC_JWT_KC_PASSWORD,
    tags: ['Funders', TAG_MAAS],
    responses: {
      [StatusCode.Success]: {
        description: `La liste des communautés d'un financeur`,
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Community),
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async findByFunderId(
    @param.path.string('funderId', {description: `L'identifiant du financeur`})
    funderId: string,
  ): Promise<Community[]> {
    return this.communityRepository.findByFunderId(funderId);
  }

  /**
   * Return List of citizen based on funder type (enterprise, collectivity, or national)
   * @param funderId The ID of the funder
   * @param status The affiliation status of the citizen
   * @param lastName Lastname of the citizen
   * @param skip The number of elements to skip when paginating results
   * @param limit The maximum number of citizens to return
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @intercept(FunderInterceptor.BINDING_KEY)
  @authorize({
    allowedRoles: [Roles.MANAGERS, Roles.SUPERVISORS],
  })
  @get('/v1/funders/{funderId}/citizens', {
    'x-controller-name': 'Funders',
    summary: 'Récupère la liste de citoyens/salariés',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'La liste des citoyens/salariés',
        content: {
          'application/json': {
            schema: {type: 'array', items: CitizensWithSubscriptionSchema},
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async getCitizens(
    @param.path.string('funderId', {
      description: `L'identifiant du financeur`,
    })
    funderId: string,
    @param.query.string('status', {
      description: `Statut de l'affiliation du citoyen`,
      schema: {
        type: 'string',
        enum: ['AFFILIE', 'DESAFFILIE', 'A_AFFILIER'],
      },
    })
    status?: AFFILIATION_STATUS,
    @param.query.string('lastName', {description: 'Nom du citoyen'})
    lastName?: string,
    @param.query.number('skip', {
      description: 'Filtre pour omettre le nombre spécifié de résultats retournés',
    })
    skip?: number,
    @param.query.number('limit', {
      description: 'Nombre maximal de citoyens à retourner',
    })
    limit?: number,
  ): Promise<PartialCitizen[]> {
    try {
      const {funderType} = this.currentUser;

      if (funderType === FUNDER_TYPE.ENTERPRISE) {
        return await this.citizenService.getEnterpriseEmployees({funderId, status, lastName, skip, limit});
      } else if (funderType === FUNDER_TYPE.COLLECTIVITY || funderType === FUNDER_TYPE.NATIONAL) {
        return await this.subscriptionService.getCitizensWithSubscription({
          funderId,
          lastName,
          skip,
          limit,
        });
      } else {
        throw new BadRequestError(
          FunderController.name,
          this.getCitizens.name,
          'funderType.not.found',
          '/funderTypeNotFound',
          ResourceName.Funder,
          funderType,
        );
      }
    } catch (error) {
      Logger.error(FunderController.name, this.getCitizens.name, 'Error', error);
      throw error;
    }
  }

  /**
   * Return total of citizen based on funder type (enterprise, collectivity, or national)
   * @param funderId The ID of the funder
   * @param status The affiliation status of the citizen
   * @param lastName Lastname of the citizen
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @intercept(FunderInterceptor.BINDING_KEY)
  @authorize({
    allowedRoles: [Roles.MANAGERS, Roles.SUPERVISORS],
  })
  @get('/v1/funders/{funderId}/citizens/count', {
    'x-controller-name': 'Funders',
    summary: 'Récupère le nombre de citoyens/salariés',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Le nombre de citoyens/salariés',
        content: {
          'application/json': {
            schema: {...CountSchema, ...{title: 'Count'}},
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async getCitizensCount(
    @param.path.string('funderId', {
      description: `L'identifiant du financeur`,
    })
    funderId: string,
    @param.query.string('status', {
      description: `Statut de l'affiliation du citoyen`,
      schema: {
        type: 'string',
        enum: ['AFFILIE', 'DESAFFILIE', 'A_AFFILIER'],
      },
    })
    status?: AFFILIATION_STATUS,
    @param.query.string('lastName', {description: 'Nom du citoyen'})
    lastName?: string,
  ): Promise<Count> {
    try {
      const {funderType} = this.currentUser;

      if (funderType === FUNDER_TYPE.ENTERPRISE) {
        return await this.citizenService.getEnterpriseEmployeesCount({
          funderId,
          status,
          lastName,
        });
      } else if (funderType === FUNDER_TYPE.COLLECTIVITY || funderType === FUNDER_TYPE.NATIONAL) {
        return await this.subscriptionService.getCitizensWithSubscriptionCount({
          funderId,
          lastName,
        });
      } else {
        throw new BadRequestError(
          FunderController.name,
          this.getCitizensCount.name,
          'funderType.not.found',
          '/funderTypeNotFound',
          ResourceName.Funder,
          funderType,
        );
      }
    } catch (error) {
      Logger.error(FunderController.name, this.getCitizensCount.name, 'Error', error);
      throw error;
    }
  }
}

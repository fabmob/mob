import {inject, intercept} from '@loopback/core';
import {Count, CountSchema, repository, Where} from '@loopback/repository';
import {post, param, get, getModelSchemaRef, requestBody} from '@loopback/rest';
import {pick} from 'lodash';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';

import {KeycloakService} from '../services';
import {
  SECURITY_SPEC_KC_PASSWORD,
  GROUPS,
  Roles,
  StatusCode,
  SECURITY_SPEC_API_KEY,
  AUTH_STRATEGY,
} from '../utils';
import {isEmailFormatValid} from '../interceptors/utils';
import {ValidationError} from '../validationError';
import {Enterprise} from '../models/enterprise';
import {EnterpriseRepository} from '../repositories/enterprise.repository';
import {EnterpriseInterceptor} from '../interceptors';

export class EnterpriseController {
  constructor(
    @repository(EnterpriseRepository)
    public enterpriseRepository: EnterpriseRepository,
    @inject('services.KeycloakService')
    public kcService: KeycloakService,
  ) {}

  /**
   * Create one enterprise
   * @param enterprise the object to create
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @intercept(EnterpriseInterceptor.BINDING_KEY)
  @post('/v1/enterprises', {
    'x-controller-name': 'Enterprises',
    summary: 'Crée une entreprise',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Nouveau compte entreprise',
        content: {'application/json': {schema: getModelSchemaRef(Enterprise)}},
      },
      [StatusCode.UnprocessableEntity]: {
        description:
          "Les formats des adresses email de l'entreprise ne sont pas valides.",
        content: {
          'application/json': {
            schema: getModelSchemaRef(Error),
            example: {
              error: {
                statusCode: 422,
                name: 'Error',
                message: 'Enterprise email formats are not valid',
                path: '/enterpriseEmailBadFormat',
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
          schema: getModelSchemaRef(Enterprise),
        },
      },
    })
    enterprise: Enterprise,
  ): Promise<any> {
    let keycloakGroupCreationResult: any;

    try {
      const {name} = enterprise;
      keycloakGroupCreationResult = await this.kcService.createGroupKc(
        name,
        GROUPS.enterprises,
      );

      if (keycloakGroupCreationResult && keycloakGroupCreationResult.id) {
        const enterpriseModel = pick(enterprise, [
          'name',
          'siretNumber',
          'emailFormat',
          'employeesCount',
          'budgetAmount',
          'isHris',
        ]);

        const RepositoryEnterpriseCreationResult = await this.enterpriseRepository.create(
          {
            ...enterpriseModel,
            ...keycloakGroupCreationResult,
          },
        );

        return RepositoryEnterpriseCreationResult;
      }
    } catch (error) {
      if (keycloakGroupCreationResult && keycloakGroupCreationResult.id)
        await this.kcService.deleteGroupKc(keycloakGroupCreationResult.id);
      throw error;
    }
  }

  /**
   * Count the enterprises
   * @param where the enterprise where filter
   * @returns the number of enterprises
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/enterprises/count', {
    'x-controller-name': 'Enterprises',
    summary: "Retourne le nombre d'entreprises",
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Enterprise model count',
        content: {
          'application/json': {
            schema: {...CountSchema, ...{title: 'Count'}},
          },
        },
      },
    },
  })
  async count(@param.where(Enterprise) where?: Where<Enterprise>): Promise<Count> {
    return this.enterpriseRepository.count(where);
  }

  /**
   * Get all enterprises
   * @returns All enterprises
   */
  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.CONTENT_EDITOR]})
  @get('/v1/enterprises', {
    'x-controller-name': 'Enterprises',
    summary: 'Retourne les entreprises',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'Array of entreprises model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Enterprise),
            },
          },
        },
      },
    },
  })
  async find(): Promise<Enterprise[]> {
    return this.enterpriseRepository.find();
  }

  /**
   * Check the email format
   * @returns if the email format is ok
   */
  @authenticate(AUTH_STRATEGY.API_KEY)
  @authorize({allowedRoles: [Roles.API_KEY]})
  @get('/v1/enterprises/email_format_list', {
    'x-controller-name': 'Enterprises',
    summary: 'Retourne les informations détaillées des entreprises',
    security: SECURITY_SPEC_API_KEY,
    responses: {
      [StatusCode.Success]: {
        description: 'Array of entreprises model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    description: `Nom de l'entreprise`,
                    type: 'string',
                    example: 'Capgemini',
                  },
                  id: {
                    description: `Identifiant du l'entreprise`,
                    type: 'string',
                    example: '',
                  },
                  emailFormat: {
                    description: `Modèles d'email de l'entreprise`,
                    type: 'array',
                    items: {
                      type: 'string',
                      example: '@professional.com',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async findEmailFormat(): Promise<Pick<Enterprise, 'name' | 'id' | 'emailFormat'>[]> {
    const result: Pick<Enterprise, 'name' | 'id' | 'emailFormat'>[] =
      await this.enterpriseRepository.find({
        fields: {name: true, id: true, emailFormat: true},
      });
    return result;
  }
}

import {repository} from '@loopback/repository';
import {get, getModelSchemaRef} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {IncentiveEligibilityChecks} from '../models';
import {IncentiveEligibilityChecksRepository} from '../repositories';
import {AUTH_STRATEGY, SECURITY_SPEC_KC_PASSWORD, StatusCode, Roles} from '../utils';

export class IncentiveEligibilityChecksController {
  constructor(
    @repository(IncentiveEligibilityChecksRepository)
    public incentiveEligibilityChecksRepository: IncentiveEligibilityChecksRepository,
  ) {}

  @authenticate(AUTH_STRATEGY.KEYCLOAK)
  @authorize({
    allowedRoles: [Roles.CONTENT_EDITOR],
  })
  @get('/v1/incentive_eligibility_checks', {
    'x-controller-name': 'Incentive Eligibility Checks',
    summary: 'Retourne la liste des contrôles',
    security: SECURITY_SPEC_KC_PASSWORD,
    responses: {
      [StatusCode.Success]: {
        description: 'La liste des contrôles est retournée',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(IncentiveEligibilityChecks),
            },
          },
        },
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
          "L'utilisateur n'a pas les droits pour accéder à la liste des vérifications d'éligibilités",
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
  async getEligibilityChecks(): Promise<IncentiveEligibilityChecks[]> {
    return this.incentiveEligibilityChecksRepository.find();
  }
}

import {repository} from '@loopback/repository';
import {get, getModelSchemaRef} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {IncentiveEligibilityChecks} from '../models';
import {IncentiveEligibilityChecksRepository} from '../repositories';
import {AUTH_STRATEGY, SECURITY_SPEC_KC_PASSWORD, StatusCode, Roles, Logger} from '../utils';
import {defaultSwaggerError} from './utils/swagger-errors';

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
        description: 'La liste des contrôles',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(IncentiveEligibilityChecks),
            },
          },
        },
      },
      ...defaultSwaggerError,
    },
  })
  async getEligibilityChecks(): Promise<IncentiveEligibilityChecks[]> {
    try {
      return await this.incentiveEligibilityChecksRepository.find();
    } catch (error) {
      Logger.error(IncentiveEligibilityChecksController.name, this.getEligibilityChecks.name, 'Error', error);
      throw error;
    }
  }
}

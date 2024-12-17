import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {TrackedIncentives} from '../models';
import {TrackedIncentivesRepository} from '../repositories';
import { authenticate } from '@loopback/authentication';

@authenticate('api-key')
export class TrackedIncentivesController {
  constructor(
    @repository(TrackedIncentivesRepository)
    public trackedIncentivesRepository : TrackedIncentivesRepository,
  ) {}

  @post('/tracked-incentives')
  @response(200, {
    description: 'TrackedIncentives model instance',
    content: {'application/json': {schema: getModelSchemaRef(TrackedIncentives)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(TrackedIncentives, {
            title: 'NewTrackedIncentives',
            exclude: ['id'],
          }),
        },
      },
    })
    trackedIncentives: Omit<TrackedIncentives, 'id'>,
  ): Promise<TrackedIncentives> {
    return this.trackedIncentivesRepository.create(trackedIncentives);
  }

  @get('/tracked-incentives/count')
  @response(200, {
    description: 'TrackedIncentives model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(TrackedIncentives) where?: Where<TrackedIncentives>,
  ): Promise<Count> {
    return this.trackedIncentivesRepository.count(where);
  }

  @get('/tracked-incentives')
  @response(200, {
    description: 'Array of TrackedIncentives model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(TrackedIncentives, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(TrackedIncentives) filter?: Filter<TrackedIncentives>,
  ): Promise<TrackedIncentives[]> {
    return this.trackedIncentivesRepository.find(filter);
  }

  @patch('/tracked-incentives')
  @response(200, {
    description: 'TrackedIncentives PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(TrackedIncentives, {partial: true}),
        },
      },
    })
    trackedIncentives: TrackedIncentives,
    @param.where(TrackedIncentives) where?: Where<TrackedIncentives>,
  ): Promise<Count> {
    return this.trackedIncentivesRepository.updateAll(trackedIncentives, where);
  }

  @get('/tracked-incentives/{id}')
  @response(200, {
    description: 'TrackedIncentives model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(TrackedIncentives, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(TrackedIncentives, {exclude: 'where'}) filter?: FilterExcludingWhere<TrackedIncentives>
  ): Promise<TrackedIncentives> {
    return this.trackedIncentivesRepository.findById(id, filter);
  }

  @patch('/tracked-incentives/{id}')
  @response(204, {
    description: 'TrackedIncentives PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(TrackedIncentives, {partial: true}),
        },
      },
    })
    trackedIncentives: TrackedIncentives,
  ): Promise<void> {
    await this.trackedIncentivesRepository.updateById(id, trackedIncentives);
  }

  @put('/tracked-incentives/{id}')
  @response(204, {
    description: 'TrackedIncentives PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() trackedIncentives: TrackedIncentives,
  ): Promise<void> {
    await this.trackedIncentivesRepository.replaceById(id, trackedIncentives);
  }

  @del('/tracked-incentives/{id}')
  @response(204, {
    description: 'TrackedIncentives DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.trackedIncentivesRepository.deleteById(id);
  }
}

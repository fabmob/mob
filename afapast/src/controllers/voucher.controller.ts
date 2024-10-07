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
import {Voucher} from '../models';
import {VoucherRepository} from '../repositories';
import { authenticate } from '@loopback/authentication';

@authenticate('api-key')
export class VoucherController {
  constructor(
    @repository(VoucherRepository)
    public voucherRepository : VoucherRepository,
  ) {}

  @post('/vouchers')
  @response(200, {
    description: 'Voucher model instance',
    content: {'application/json': {schema: getModelSchemaRef(Voucher)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Voucher, {
            title: 'NewVoucher',
            exclude: ['id'],
          }),
        },
      },
    })
    voucher: Omit<Voucher, 'id'>,
  ): Promise<Voucher> {
    return this.voucherRepository.create(voucher);
  }

  @get('/vouchers/count')
  @response(200, {
    description: 'Voucher model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Voucher) where?: Where<Voucher>,
  ): Promise<Count> {
    return this.voucherRepository.count(where);
  }
  @get('/vouchers')
  @response(200, {
    description: 'Array of Voucher model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Voucher, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Voucher) filter?: Filter<Voucher>,
  ): Promise<Voucher[]> {
    return this.voucherRepository.find(filter);
  }

  @patch('/vouchers')
  @response(200, {
    description: 'Voucher PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Voucher, {partial: true}),
        },
      },
    })
    voucher: Voucher,
    @param.where(Voucher) where?: Where<Voucher>,
  ): Promise<Count> {
    return this.voucherRepository.updateAll(voucher, where);
  }

  @get('/vouchers/{id}')
  @response(200, {
    description: 'Voucher model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Voucher, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Voucher, {exclude: 'where'}) filter?: FilterExcludingWhere<Voucher>
  ): Promise<Voucher> {
    return this.voucherRepository.findById(id, filter);
  }

  @patch('/vouchers/{id}')
  @response(204, {
    description: 'Voucher PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Voucher, {partial: true}),
        },
      },
    })
    voucher: Voucher,
  ): Promise<void> {
    await this.voucherRepository.updateById(id, voucher);
  }

  @put('/vouchers/{id}')
  @response(204, {
    description: 'Voucher PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() voucher: Voucher,
  ): Promise<void> {
    await this.voucherRepository.replaceById(id, voucher);
  }

  @del('/vouchers/{id}')
  @response(204, {
    description: 'Voucher DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.voucherRepository.deleteById(id);
  }
}

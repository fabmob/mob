import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDsDataSource} from '../datasources';
import {Incentive, IncentiveRelations} from '../models';

export class IncentiveRepository extends DefaultCrudRepository<
  Incentive,
  typeof Incentive.prototype.id,
  IncentiveRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    super(Incentive, dataSource);
    (this.modelClass as any).observe('persist', async (ctx: any) => {
      ctx.data.updatedAt = new Date();
    });
  }
}

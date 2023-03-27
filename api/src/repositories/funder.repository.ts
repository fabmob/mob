import {inject} from '@loopback/core';
import {DefaultCrudRepository, Where} from '@loopback/repository';

import {MongoDsDataSource} from '../datasources';
import {Collectivity, Enterprise, Funder, FunderRelations} from '../models';
import {FUNDER_TYPE} from '../utils';

export class FunderRepository extends DefaultCrudRepository<
  Funder,
  typeof Funder.prototype.id,
  FunderRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    super(Funder, dataSource);
  }

  async getFunderByNameAndType(name: string, type: FUNDER_TYPE): Promise<Funder | null> {
    return this.findOne({
      where: {and: [{name: name}, {type: type}]},
    });
  }

  async getEnterpriseById(id: string): Promise<Enterprise | null> {
    return (await this.findOne({
      where: {and: [{id: id}, {type: FUNDER_TYPE.ENTERPRISE}]},
    })) as Enterprise;
  }

  async getEnterpriseHRISNameList(): Promise<Pick<Enterprise, 'name'>[]> {
    return (await this.find({
      where: {and: [{type: FUNDER_TYPE.ENTERPRISE}, {'enterpriseDetails.isHris': true}]} as Where<Enterprise>,
      fields: {name: true},
    })) as Enterprise[];
  }

  async getCollectivityById(id: string): Promise<Collectivity | null> {
    return (await this.findOne({
      where: {and: [{id: id}, {type: FUNDER_TYPE.COLLECTIVITY}]},
    })) as Collectivity;
  }
}

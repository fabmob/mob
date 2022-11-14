import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDsDataSource} from '../datasources';
import {Metadata, MetadataRelations} from '../models';

export class MetadataRepository extends DefaultCrudRepository<
  Metadata,
  typeof Metadata.prototype.id,
  MetadataRelations
> {
  constructor(@inject('datasources.mongoDS') dataSource: MongoDsDataSource) {
    super(Metadata, dataSource);
  }
}

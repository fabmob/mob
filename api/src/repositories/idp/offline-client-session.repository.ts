import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {IdpDbDataSource} from '../../datasources';
import {OfflineClientSession, OfflineClientSessionRelations} from '../../models';

export class OfflineClientSessionRepository extends DefaultCrudRepository<
  OfflineClientSession,
  typeof OfflineClientSession.prototype.userSessionId,
  OfflineClientSessionRelations
> {
  constructor(@inject('datasources.idpdbDS') dataSource: IdpDbDataSource) {
    super(OfflineClientSession, dataSource);
  }
}

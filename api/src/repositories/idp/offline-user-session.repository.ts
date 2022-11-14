import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {IdpDbDataSource} from '../../datasources';
import {OfflineUserSession, OfflineUserSessionRelations} from '../../models';

export class OfflineUserSessionRepository extends DefaultCrudRepository<
  OfflineUserSession,
  typeof OfflineUserSession.prototype.userSessionId,
  OfflineUserSessionRelations
> {
  constructor(@inject('datasources.idpdbDS') dataSource: IdpDbDataSource) {
    super(OfflineUserSession, dataSource);
  }
}

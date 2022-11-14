import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {IdpDbDataSource} from '../../datasources';
import {ClientScopeClient, ClientScopeClientRelations} from '../../models';

export class ClientScopeClientRepository extends DefaultCrudRepository<
  ClientScopeClient,
  typeof ClientScopeClient.prototype.clientId,
  ClientScopeClientRelations
> {
  constructor(@inject('datasources.idpdbDS') dataSource: IdpDbDataSource) {
    super(ClientScopeClient, dataSource);
  }
}

import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyThroughRepositoryFactory} from '@loopback/repository';
import {IdpDbDataSource} from '../../datasources';
import {ClientScope, ClientScopeRelations, Client, ClientScopeClient} from '../../models';
import {SCOPES} from '../../utils';
import {ClientScopeClientRepository} from './client-scope-client.repository';
import {ClientRepository} from './client.repository';

export class ClientScopeRepository extends DefaultCrudRepository<
  ClientScope,
  typeof ClientScope.prototype.id,
  ClientScopeRelations
> {
  public readonly clients: HasManyThroughRepositoryFactory<
    Client,
    typeof Client.prototype.id,
    ClientScopeClient,
    typeof ClientScope.prototype.id
  >;

  constructor(
    @inject('datasources.idpdbDS') dataSource: IdpDbDataSource,
    @repository.getter('ClientScopeClientRepository')
    protected clientScopeClientRepositoryGetter: Getter<ClientScopeClientRepository>,
    @repository.getter('ClientRepository')
    protected clientRepositoryGetter: Getter<ClientRepository>,
  ) {
    super(ClientScope, dataSource);
    this.clients = this.createHasManyThroughRepositoryFactoryFor(
      'clients',
      clientRepositoryGetter,
      clientScopeClientRepositoryGetter,
    );
    this.registerInclusionResolver('clients', this.clients.inclusionResolver);
  }

  async getClients(): Promise<Pick<Client, 'id' | 'clientId' | 'name'>[] | undefined> {
    const scopes = await this.findOne({
      include: [{relation: 'clients', scope: {fields: {id: true, clientId: true, name: true}}}],
      where: {name: SCOPES.FUNDERS_CLIENTS},
    });
    return scopes?.clients;
  }
}

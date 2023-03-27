import {createStubInstance, expect, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import {ClientController} from '../../controllers';
import {Client} from '../../models';
import {ClientScopeRepository} from '../../repositories';

describe('Client Controller ', () => {
  let clientScopeRepository: StubbedInstanceWithSinonAccessor<ClientScopeRepository>,
    clientController: ClientController;

  beforeEach(() => {
    givenStubbedRepository();
    clientController = new ClientController(clientScopeRepository);
  });

  function givenStubbedRepository() {
    clientScopeRepository = createStubInstance(ClientScopeRepository);
  }

  it('ClientController GET /v1/clients: Mongo Error', async () => {
    try {
      clientScopeRepository.stubs.getClients.rejects(new Error('Error'));
      await clientController.findClients();
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
  });

  it('ClientController GET /v1/clients: OK', async () => {
    clientScopeRepository.stubs.getClients.resolves(mockClientsList);
    const clients = await clientController.findClients();
    expect(clients).to.deepEqual(mockClientsList);
  });
});

const mockClientsList = [
  {
    clientId: '62977dc80929474f84c403de',
  } as Client,
];

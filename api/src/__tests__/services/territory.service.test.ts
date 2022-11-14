import {
  StubbedInstanceWithSinonAccessor,
  createStubInstance,
  expect,
} from '@loopback/testlab';
import {Territory} from '../../models';

import {TerritoryRepository} from '../../repositories';
import {TerritoryService} from '../../services/territory.service';
import {ResourceName, StatusCode} from '../../utils';
import {ValidationError} from '../../validationError';

describe('Territory service', () => {
  let territoryRepository: StubbedInstanceWithSinonAccessor<TerritoryRepository>,
    territoryService: TerritoryService;

  beforeEach(() => {
    territoryRepository = createStubInstance(TerritoryRepository);
    territoryService = new TerritoryService(territoryRepository);
  });

  it('TerritoryService createTerritory: successfull', async () => {
    territoryRepository.stubs.findOne.resolves(null);
    territoryRepository.stubs.create.resolves(territoryMock);

    const result = await territoryService.createTerritory(territoryPayload);
    expect(result).to.deepEqual(territoryMock);
  });

  it('TerritoryService createTerritory: unique name', async () => {
    try {
      territoryRepository.stubs.findOne.resolves(territoryMock);
      await territoryService.createTerritory(territoryPayload);
    } catch (error) {
      expect(error).to.deepEqual(territoryNameUnique);
    }
  });

  const territoryMock = new Territory({
    name: 'Toulouse',
    id: '634c83b994f56f610415f9c6',
  });

  const territoryPayload = new Territory({
    name: 'Toulouse',
  });

  const territoryNameUnique = new ValidationError(
    'territory.name.error.unique',
    '/territoryName',
    StatusCode.UnprocessableEntity,
    ResourceName.Territory,
  );
});

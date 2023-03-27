import {Incentive} from '../models';
import {IncentiveRepository, TerritoryRepository, FunderRepository} from '../repositories';
import {testdbMongo} from './repositories/testdb.datasource';

export async function givenEmptyIncentiveCollection() {
  const incentiveRepository: IncentiveRepository = new IncentiveRepository(
    testdbMongo,
    async () => territoryRepository,
    async () => funderRepository,
  );

  const territoryRepository: TerritoryRepository = new TerritoryRepository(testdbMongo);
  const funderRepository: FunderRepository = new FunderRepository(testdbMongo);

  await incentiveRepository.deleteAll();
  await territoryRepository.deleteAll();
}

export async function givenIncentives(data: Partial<Incentive>[]) {
  const territoryRepository: TerritoryRepository = new TerritoryRepository(testdbMongo);
  const funderRepository: FunderRepository = new FunderRepository(testdbMongo);
  return new IncentiveRepository(
    testdbMongo,
    async () => territoryRepository,
    async () => funderRepository,
  ).createAll(data);
}

import {
  StubbedInstanceWithSinonAccessor,
  createStubInstance,
  expect,
} from '@loopback/testlab';

import {FunderService} from '../../services';
import {Collectivity, Enterprise} from '../../models';
import {CollectivityRepository, EnterpriseRepository} from '../../repositories';
import {FUNDER_TYPE} from '../../utils';

describe('Funder services', () => {
  let collectivityRepository: StubbedInstanceWithSinonAccessor<CollectivityRepository>,
    enterpriseRepository: StubbedInstanceWithSinonAccessor<EnterpriseRepository>,
    funderService: FunderService;

  beforeEach(() => {
    collectivityRepository = createStubInstance(CollectivityRepository);
    (enterpriseRepository = createStubInstance(EnterpriseRepository)),
      (funderService = new FunderService(collectivityRepository, enterpriseRepository));
  });

  it('funderService: successfull', async () => {
    collectivityRepository.stubs.find.resolves([mockCollectivity]);
    enterpriseRepository.stubs.find.resolves([mockEnterprise]);
    const result = await funderService.getFunders();

    expect(result).to.deepEqual(mockReturnFunder);
  });

  it('funderService getFunderByName collectivity: successfull', async () => {
    collectivityRepository.stubs.find.resolves([
      new Collectivity({
        id: 'randomInputIdCollectivity',
        name: 'nameCollectivity',
      }),
    ]);

    const result = await funderService.getFunderByName('name', FUNDER_TYPE.collectivity);

    expect(result).to.deepEqual({
      id: 'randomInputIdCollectivity',
      name: 'nameCollectivity',
      funderType: FUNDER_TYPE.collectivity,
    });
  });

  it('funderService getFunderByName enterprises: successfull', async () => {
    enterpriseRepository.stubs.find.resolves([
      new Enterprise({
        id: 'randomInputEnterpriseId',
        name: 'nameenterprises',
      }),
    ]);
    const result = await funderService.getFunderByName('name', FUNDER_TYPE.enterprise);

    expect(result).to.deepEqual({
      id: 'randomInputEnterpriseId',
      name: 'nameenterprises',
      funderType: FUNDER_TYPE.enterprise,
    });
  });

  const mockCollectivity = new Collectivity({
    id: 'randomInputIdCollectivity',
    name: 'nameCollectivity',
    citizensCount: 10,
    mobilityBudget: 12,
  });

  const mockEnterprise = new Enterprise({
    id: 'randomInputIdEnterprise',
    emailFormat: ['test@outlook.com', 'test@outlook.fr', 'test@outlook.xxx'],
    name: 'nameEnterprise',
    siretNumber: 50,
    employeesCount: 2345,
    budgetAmount: 102,
  });

  const mockReturnFunder = [
    {...mockCollectivity, funderType: FUNDER_TYPE.collectivity},
    {...mockEnterprise, funderType: FUNDER_TYPE.enterprise},
  ];
});

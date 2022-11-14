import {
  createStubInstance,
  expect,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import {IncentiveRepository, TerritoryRepository} from '../../repositories';
import {TerritoryController} from '../../controllers';
import {ValidationError} from '../../validationError';
import {TerritoryService} from '../../services/territory.service';
import {Incentive, Territory} from '../../models';
import {ResourceName, StatusCode} from '../../utils';

describe('TerritoryController', () => {
  let territoryRepository: StubbedInstanceWithSinonAccessor<TerritoryRepository>,
    incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    territoryService: StubbedInstanceWithSinonAccessor<TerritoryService>,
    territoryController: TerritoryController;

  beforeEach(() => {
    givenStubbedRepository();
    givenStubbedService();
    territoryController = new TerritoryController(
      territoryRepository,
      incentiveRepository,
      territoryService,
    );
  });

  it('TerritoryController Post /territories : Succesfull', async () => {
    territoryService.stubs.createTerritory.resolves(territoryMock);
    const result = await territoryController.create(territoryPayload);
    expect(result).to.deepEqual(territoryMock);
  });

  it('TerritoryController Get /territories : Successful', async () => {
    territoryRepository.stubs.find.resolves([territoryMock]);
    const result = await territoryController.find();
    expect(result).to.deepEqual([territoryMock]);
  });

  it('TerritoryController Get /territories/{id} : Successful', async () => {
    territoryRepository.stubs.findById.resolves(territoryMock);
    const result = await territoryController.findById('634c83b994f56f610415f9c6');
    expect(result).to.deepEqual(territoryMock);
  });

  it('TerritoryController Patch /territories/{id} unique name', async () => {
    try {
      territoryRepository.stubs.findOne.resolves(territoryMockMatchName);
      await territoryController.updateById('634c83b994f56f610415f9c6', {
        name: 'new Territory name',
      } as Territory);
    } catch (error) {
      expect(error).to.deepEqual(territoryNameUnique);
    }
  });

  it('TerritoryController Patch /territories/{id} Successful', async () => {
    territoryRepository.stubs.findOne.resolves();
    incentiveRepository.stubs.find.resolves([mockIncentive]);
    territoryRepository.stubs.updateById.resolves();
    incentiveRepository.stubs.updateById.resolves();
    await territoryController.updateById('634c83b994f56f610415f9c6', {
      name: 'new Territory name',
    } as Territory);
  });

  // TODO: REMOVING DEPRECATED territoryName.
  it('TerritoryController Patch /territories/{id} Successful with territoryName', async () => {
    territoryRepository.stubs.findOne.resolves();
    incentiveRepository.stubs.find.resolves([mockIncentive2]);
    territoryRepository.stubs.updateById.resolves();
    incentiveRepository.stubs.updateById.resolves();
    await territoryController.updateById('634c83b994f56f610415f9c6', {
      name: 'new Territory name',
    } as Territory);
  });

  it('TerritoryController GET /territories/count Successful', async () => {
    const territoryCount = {
      count: 12,
    };
    territoryRepository.stubs.count.resolves(territoryCount);
    const result = await territoryController.count();
    expect(result).to.deepEqual(territoryCount);
  });

  function givenStubbedRepository() {
    territoryRepository = createStubInstance(TerritoryRepository);
    incentiveRepository = createStubInstance(IncentiveRepository);
  }

  function givenStubbedService() {
    territoryService = createStubInstance(TerritoryService);
  }

  const territoryPayload = new Territory({
    name: 'Toulouse',
  });

  const territoryMock = new Territory({
    name: 'Toulouse',
    id: '634c83b994f56f610415f9c6',
  });

  const territoryMockMatchName = new Territory({
    name: 'new Territory Name',
    id: '634c83b994f56f610415f9c6',
  });

  const territoryNameUnique = new ValidationError(
    'territory.name.error.unique',
    '/territoryName',
    StatusCode.UnprocessableEntity,
    ResourceName.Territory,
  );

  // TODO: REMOVING DEPRECATED territoryName.
  const mockIncentive2 = new Incentive({
    territory: {name: 'Toulouse', id: '634c83b994f56f610415f9c6'} as Territory,
    territoryName: 'Toulouse', // TODO: REMOVING DEPRECATED territoryName.
    additionalInfos: 'test',
    funderName: 'Mairie',
    allocatedAmount: '200 €',
    description: 'test',
    title: 'Aide pour acheter vélo électrique',
    incentiveType: 'AideTerritoire',
    createdAt: new Date('2021-04-06T09:01:30.747Z'),
    transportList: ['velo'],
    validityDate: '2022-04-06T09:01:30.778Z',
    minAmount: 'A partir de 100 €',
    contact: 'Mr le Maire',
    validityDuration: '1 an',
    paymentMethod: 'En une seule fois',
    attachments: ['RIB'],
    id: 'randomNationalId',
    conditions: 'Vivre à TOulouse',
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
    isMCMStaff: true,
  });

  const mockIncentive = new Incentive({
    territory: {name: 'Toulouse', id: '634c83b994f56f610415f9c6'} as Territory,
    additionalInfos: 'test',
    funderName: 'Mairie',
    allocatedAmount: '200 €',
    description: 'test',
    title: 'Aide pour acheter vélo électrique',
    incentiveType: 'AideTerritoire',
    createdAt: new Date('2021-04-06T09:01:30.747Z'),
    transportList: ['velo'],
    validityDate: '2022-04-06T09:01:30.778Z',
    minAmount: 'A partir de 100 €',
    contact: 'Mr le Maire',
    validityDuration: '1 an',
    paymentMethod: 'En une seule fois',
    attachments: ['RIB'],
    id: 'randomNationalId',
    conditions: 'Vivre à TOulouse',
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
    isMCMStaff: true,
  });
});

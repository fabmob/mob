import {createStubInstance, expect, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import {IncentiveRepository, TerritoryRepository} from '../../repositories';
import {TerritoryController} from '../../controllers';
import {TerritoryService} from '../../services/territory.service';
import {Incentive, Territory} from '../../models';
import {SCALE, StatusCode} from '../../utils';

describe('TerritoryController', () => {
  let territoryRepository: StubbedInstanceWithSinonAccessor<TerritoryRepository>,
    incentiveRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    territoryService: StubbedInstanceWithSinonAccessor<TerritoryService>,
    territoryController: TerritoryController;

  const response: any = {
    status: function () {
      return this;
    },
    contentType: function () {
      return this;
    },
    send: (body: any) => body,
  };
  beforeEach(() => {
    givenStubbedRepository();
    givenStubbedService();
    territoryController = new TerritoryController(
      response,
      territoryRepository,
      incentiveRepository,
      territoryService,
    );
  });

  it('TerritoryController Post /territories : Successful', async () => {
    territoryService.stubs.createTerritory.resolves(territoryMock);
    const result = await territoryController.create(territoryPayload);
    expect(result).to.deepEqual(territoryMock);
  });

  it('TerritoryController Post /territories : ERROR', async () => {
    try {
      territoryService.stubs.createTerritory.rejects(new Error('Error'));
      await territoryController.create(territoryPayload);
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
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
      territoryRepository.stubs.execute.resolves(
        Promise.resolve({
          get: () => [territoryMockMatchName],
        }),
      );
      await territoryController.updateById('634c83b994f56f610415f9c6', {
        name: 'new Territory name',
      } as Territory);
    } catch (error) {
      expect(error.message).to.equal('territory.name.error.unique');
      expect(error.statusCode).to.equal(StatusCode.Conflict);
    }
  });

  it('TerritoryController Patch /territories/{id} Successful', async () => {
    territoryRepository.stubs.execute.resolves(
      Promise.resolve({
        get: () => [],
      }),
    );
    incentiveRepository.stubs.find.resolves([mockIncentive]);
    territoryRepository.stubs.updateById.resolves();
    incentiveRepository.stubs.updateById.resolves();
    await territoryController.updateById('634c83b994f56f610415f9c6', {
      name: 'new Territory name',
    } as Territory);
  });

  // TODO: REMOVING DEPRECATED territoryName.
  it('TerritoryController Patch /territories/{id} Successful with territoryName', async () => {
    territoryRepository.stubs.execute.resolves(
      Promise.resolve({
        get: () => [],
      }),
    );
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
    scale: SCALE.NATIONAL,
    name: 'Toulouse',
  });

  const territoryMock = new Territory({
    scale: SCALE.NATIONAL,
    name: 'Toulouse',
    id: '634c83b994f56f610415f9c6',
  });

  const territoryMockMatchName = new Territory({
    name: 'new Territory Name',
    id: '634c83b994f56f610415f9c6',
  });

  // TODO: REMOVING DEPRECATED territoryName.
  const mockIncentive2 = new Incentive({
    territoryIds: ['randomTerritoryId'],
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
    territoryIds: ['randomTerritoryId'],
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

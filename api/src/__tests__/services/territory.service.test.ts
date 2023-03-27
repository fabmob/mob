import {StubbedInstanceWithSinonAccessor, createStubInstance, expect} from '@loopback/testlab';
import {Territory} from '../../models';

import {TerritoryRepository} from '../../repositories';
import {TerritoryService} from '../../services/territory.service';
import {SCALE, StatusCode} from '../../utils';

describe('Territory service', () => {
  let territoryRepository: StubbedInstanceWithSinonAccessor<TerritoryRepository>,
    territoryService: TerritoryService;

  beforeEach(() => {
    territoryRepository = createStubInstance(TerritoryRepository);
    territoryService = new TerritoryService(territoryRepository);
  });

  it('TerritoryService createTerritory: successful', async () => {
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
      expect(error.message).to.equal('territory.name.error.unique');
      expect(error.statusCode).to.equal(StatusCode.Conflict);
    }
  });

  it('TerritoryService isValidInseeCodePattern: true', () => {
    const inseeValueList: string[] = ['1112'];
    const result: Boolean = territoryService.isValidInseeCodePattern(inseeValueList);
    expect(result).equal(true);
  });

  it('TerritoryService isValidInseeCodePattern: false', () => {
    const inseeValueList: string[] = ['test'];
    const result: Boolean = territoryService.isValidInseeCodePattern(inseeValueList);
    expect(result).equal(false);
  });

  it('TerritoryService hasDuplicatedValues: true', () => {
    const inseeValueList: string[] = ['11111', '11111'];
    const result: Boolean = territoryService.hasDuplicatedValues(inseeValueList);
    expect(result).equal(true);
  });

  it('TerritoryService hasDuplicatedValues: false', () => {
    const inseeValueList: string[] = ['11111', '22222'];
    const result: Boolean = territoryService.hasDuplicatedValues(inseeValueList);
    expect(result).equal(false);
  });

  it('TerritoryService hasDuplicatedValues: false - no list', () => {
    const inseeValueList: any = undefined;
    const result: Boolean = territoryService.hasDuplicatedValues(inseeValueList);
    expect(result).equal(false);
  });

  it('TerritoryService isValidScaleInseeCodeValidation: municipality items - false', () => {
    const inseeValueList: string[] = ['22222', '11111'];
    const scale: SCALE = SCALE.MUNICIPALITY;
    const result: Boolean = territoryService.isValidScaleInseeCodeValidation(scale, inseeValueList);
    expect(result).equal(false);
  });

  it('TerritoryService isValidScaleInseeCodeValidation: municipality length - false', () => {
    const inseeValueList: string[] = ['11'];
    const scale: SCALE = SCALE.MUNICIPALITY;
    const result: Boolean = territoryService.isValidScaleInseeCodeValidation(scale, inseeValueList);
    expect(result).equal(false);
  });

  it('TerritoryService isValidScaleInseeCodeValidation: municipality - true', () => {
    const inseeValueList: string[] = ['22222'];
    const scale: SCALE = SCALE.MUNICIPALITY;
    const result: Boolean = territoryService.isValidScaleInseeCodeValidation(scale, inseeValueList);
    expect(result).equal(true);
  });

  it('TerritoryService isValidScaleInseeCodeValidation: agglo items - false', () => {
    const inseeValueList: string[] = ['22222'];
    const scale: SCALE = SCALE.AGGLOMERATION;
    const result: Boolean = territoryService.isValidScaleInseeCodeValidation(scale, inseeValueList);
    expect(result).equal(false);
  });

  it('TerritoryService isValidScaleInseeCodeValidation: agglo length - false', () => {
    const inseeValueList: string[] = ['22222', '11'];
    const scale: SCALE = SCALE.AGGLOMERATION;
    const result: Boolean = territoryService.isValidScaleInseeCodeValidation(scale, inseeValueList);
    expect(result).equal(false);
  });

  it('TerritoryService isValidScaleInseeCodeValidation: agglo - true', () => {
    const inseeValueList: string[] = ['22222', '11111'];
    const scale: SCALE = SCALE.AGGLOMERATION;
    const result: Boolean = territoryService.isValidScaleInseeCodeValidation(scale, inseeValueList);
    expect(result).equal(true);
  });

  it('TerritoryService isValidScaleInseeCodeValidation: county items - false', () => {
    const inseeValueList: string[] = ['11', '11'];
    const scale: SCALE = SCALE.COUNTY;
    const result: Boolean = territoryService.isValidScaleInseeCodeValidation(scale, inseeValueList);
    expect(result).equal(false);
  });

  it('TerritoryService isValidScaleInseeCodeValidation: county length - false', () => {
    const inseeValueList: string[] = ['1'];
    const scale: SCALE = SCALE.COUNTY;
    const result: Boolean = territoryService.isValidScaleInseeCodeValidation(scale, inseeValueList);
    expect(result).equal(false);
  });

  it('TerritoryService isValidScaleInseeCodeValidation: county 2 length - true', () => {
    const inseeValueList: string[] = ['22'];
    const scale: SCALE = SCALE.COUNTY;
    const result: Boolean = territoryService.isValidScaleInseeCodeValidation(scale, inseeValueList);
    expect(result).equal(true);
  });

  it('TerritoryService isValidScaleInseeCodeValidation: county 3 length - true', () => {
    const inseeValueList: string[] = ['333'];
    const scale: SCALE = SCALE.COUNTY;
    const result: Boolean = territoryService.isValidScaleInseeCodeValidation(scale, inseeValueList);
    expect(result).equal(true);
  });

  it('TerritoryService isValidScaleInseeCodeValidation: region items - false', () => {
    const inseeValueList: string[] = ['11', '11'];
    const scale: SCALE = SCALE.REGION;
    const result: Boolean = territoryService.isValidScaleInseeCodeValidation(scale, inseeValueList);
    expect(result).equal(false);
  });

  it('TerritoryService isValidScaleInseeCodeValidation: region length - false', () => {
    const inseeValueList: string[] = ['1'];
    const scale: SCALE = SCALE.REGION;
    const result: Boolean = territoryService.isValidScaleInseeCodeValidation(scale, inseeValueList);
    expect(result).equal(false);
  });

  it('TerritoryService isValidScaleInseeCodeValidation: region - true', () => {
    const inseeValueList: string[] = ['22'];
    const scale: SCALE = SCALE.REGION;
    const result: Boolean = territoryService.isValidScaleInseeCodeValidation(scale, inseeValueList);
    expect(result).equal(true);
  });

  it('TerritoryService isValidScaleInseeCodeValidation: national - false', () => {
    const inseeValueList: string[] = ['22222'];
    const scale: SCALE = SCALE.NATIONAL;
    const result: Boolean = territoryService.isValidScaleInseeCodeValidation(scale, inseeValueList);
    expect(result).equal(false);
  });

  const territoryMock = new Territory({
    name: 'Toulouse',
    id: '634c83b994f56f610415f9c6',
  });

  const territoryPayload = new Territory({
    name: 'Toulouse',
  });
});

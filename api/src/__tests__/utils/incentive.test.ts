import {Where} from '@loopback/repository';
import {expect} from '@loopback/testlab';
import {Affiliation, Citizen, Incentive} from '../../models';
import {AFFILIATION_STATUS, convertOrderFilter, handleWhereFilter, INCENTIVE_TYPE} from '../../utils';

describe('Incentive utils', () => {
  it('convertOrderFilter from string ASC', () => {
    const orderFilter = 'incentiveType ASC';
    const expectedResult = {incentiveType: 1};
    const result = convertOrderFilter(orderFilter);
    expect(result).deepEqual(expectedResult);
  });

  it('convertOrderFilter from string DESC', () => {
    const orderFilter = 'incentiveType DESC';
    const expectedResult = {incentiveType: -1};
    const result = convertOrderFilter(orderFilter);
    expect(result).deepEqual(expectedResult);
  });

  it('convertOrderFilter from array of string', () => {
    const orderFilter = ['incentiveType ASC', 'funderType DESC'];
    const expectedResult = {incentiveType: 1, funderType: -1};
    const result = convertOrderFilter(orderFilter);
    expect(result).deepEqual(expectedResult);
  });

  it('convertOrderFilter from undefined return default order', () => {
    const expectedResult = {funderName: 1};
    const result = convertOrderFilter(undefined);
    expect(result).deepEqual(expectedResult);
  });

  it('handleWhereFilter with all params', function () {
    const textSearch = 'hello world';
    const where: Where<Incentive> = {title: 'title'};
    const citizen: Citizen = new Citizen({
      affiliation: {
        status: AFFILIATION_STATUS.AFFILIATED,
        enterpriseId: '123',
      } as Affiliation,
    });
    const expectedResult = {
      $or: [
        {
          incentiveType: {
            $in: [INCENTIVE_TYPE.NATIONAL_INCENTIVE, INCENTIVE_TYPE.TERRITORY_INCENTIVE],
          },
        },
        {
          incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
          funderId: '123',
        },
      ],
      title: 'title',
      $text: {$search: 'hello world', $language: 'fr'},
    };
    const result = handleWhereFilter(textSearch, where, citizen);
    expect(result).to.deepEqual(expectedResult);
  });

  it('handleWhereFilter with only text search', function () {
    const textSearch = 'hello world';
    const expectedResult = {
      incentiveType: {$ne: INCENTIVE_TYPE.EMPLOYER_INCENTIVE},
      $text: {$search: 'hello world', $language: 'fr'},
    };
    const result = handleWhereFilter(textSearch, undefined, undefined);
    expect(result).to.deepEqual(expectedResult);
  });

  it('handleWhereFilter with only where', function () {
    const where: Where<Incentive> = {title: 'title'};
    const expectedResult = {
      incentiveType: {$ne: INCENTIVE_TYPE.EMPLOYER_INCENTIVE},
      title: 'title',
    };
    const result = handleWhereFilter(undefined, where, undefined);
    expect(result).to.deepEqual(expectedResult);
  });

  it('handleWhereFilter with only citizen not affiliated', function () {
    const citizen: Citizen = new Citizen({
      affiliation: {
        status: AFFILIATION_STATUS.UNKNOWN,
      } as Affiliation,
    });
    const expectedResult = {
      incentiveType: {$ne: INCENTIVE_TYPE.EMPLOYER_INCENTIVE},
    };
    const result = handleWhereFilter(undefined, undefined, citizen);
    expect(result).to.deepEqual(expectedResult);
  });

  it('handleWhereFilter with where filter and/or', function () {
    const where: Where<Incentive> = {
      and: [{title: 'title'}, {incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE}],
      or: [{funderName: 'funderName'}, {funderId: 'funderId'}],
    };
    const expectedResult = {
      $and: [{title: 'title'}, {incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE}],
      $or: [{funderName: 'funderName'}, {funderId: 'funderId'}],
      incentiveType: {$ne: INCENTIVE_TYPE.EMPLOYER_INCENTIVE},
    };
    const result = handleWhereFilter(undefined, where, undefined);
    expect(result).to.deepEqual(expectedResult);
  });
});

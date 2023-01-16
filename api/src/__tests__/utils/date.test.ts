import {expect} from '@loopback/testlab';
import {isValid} from 'date-fns';
import {convertToISODate, isExpired} from '../../utils';

describe('date functions', () => {
  it('isExpired : returns true when date is expired', async () => {
    const today = new Date();
    const expiredDate = new Date(today.setMonth(today.getMonth() - 3));
    const check2 = isExpired(expiredDate, new Date());
    expect(check2).to.deepEqual(true);
  });

  it('isExpired : returns false when date is not expired', async () => {
    const today = new Date();
    const expiredDate = new Date(today.setMonth(today.getMonth() + 3));
    const check2 = isExpired(expiredDate, new Date());
    expect(check2).to.deepEqual(false);
  });

  it('isValidDate : returns false when date is not valid', async () => {
    const check = isValid('13/89/2022');
    expect(check).to.deepEqual(false);
  });

  it('convertToISODate : returns date1 in iso', async () => {
    const result = convertToISODate('13/9/2022');
    expect(result).to.deepEqual('2022-09-13T00:00:00.000Z');
  });

  it('convertToISODate : returns date2 in iso', async () => {
    const result = convertToISODate('13-9-2022');
    expect(result).to.deepEqual('2022-09-13T00:00:00.000Z');
  });

  it('convertToISODate : invalid date', async () => {
    const result = convertToISODate('13-90-20');
    expect(result).to.deepEqual(undefined);
  });
});

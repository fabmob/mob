import {expect} from '@loopback/testlab';
import {isExpired} from '../../utils';

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
});

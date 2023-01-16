import {expect} from '@loopback/testlab';

import {Affiliation, Citizen} from '../../models';
import {AFFILIATION_STATUS, FUNDER_TYPE, isEnterpriseAffilitation} from '../../utils';

describe('affiliation functions', () => {
  it('isEnterpriseAffilitation: KO : citizen not found', async () => {
    const result = isEnterpriseAffilitation({
      inputFunderId: 'dunderId',
      citizen: null,
      funderMatch: {funderType: FUNDER_TYPE.collectivity, name: 'maasName'},
    });
    expect(result).to.equal(false);
  });

  it('isEnterpriseAffilitation: OK', async () => {
    const affiliation = new Affiliation(
      Object.assign({enterpriseId: 'funderId', enterpriseEmail: 'test@test.com'}),
    );
    affiliation.status = AFFILIATION_STATUS.AFFILIATED;

    const citizen = new Citizen({
      affiliation,
    });
    const result = isEnterpriseAffilitation({
      inputFunderId: 'funderId',
      citizen,
      funderMatch: {funderType: FUNDER_TYPE.enterprise, name: 'maasName'},
    });

    expect(result).to.equal(true);
  });
});

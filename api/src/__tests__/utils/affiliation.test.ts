import {expect} from '@loopback/testlab';

import {Affiliation, Citizen, Enterprise} from '../../models';
import {AFFILIATION_STATUS, isEnterpriseAffilitation} from '../../utils';

describe('affiliation functions', () => {
  it('isEnterpriseAffilitation: KO : citizen not found', async () => {
    const result = isEnterpriseAffilitation({
      citizen: null,
      enterprise: new Enterprise({name: 'maasName'}),
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
      citizen,
      enterprise: new Enterprise({id: 'funderId', name: 'maasName'}),
    });

    expect(result).to.equal(true);
  });
});

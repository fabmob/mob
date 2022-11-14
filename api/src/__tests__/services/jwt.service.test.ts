import {expect, sinon} from '@loopback/testlab';
import {JwtService} from '../../services';
import jwt from 'jsonwebtoken';

import {ValidationError} from '../../validationError';
import {StatusCode} from '../../utils';

const expectedError = new ValidationError(
  'jwt.error.no.affiliation',
  '/jwtNoAffiliation',
  StatusCode.PreconditionFailed,
);

describe('jwt service', () => {
  let jwtService: any = null;

  beforeEach(() => {
    jwtService = new JwtService();
  });

  it('should generateAffiliationAccessToken: OK', () => {
    const signStub = sinon.stub(jwt, 'sign').returns(mockToken as any);
    const token = jwtService.generateAffiliationAccessToken(mockCitizen);
    expect(token).to.equal(mockToken);
    signStub.restore();
  });

  it('should generateAffiliationAccessToken: KO for no affiliation', () => {
    try {
      jwtService.generateAffiliationAccessToken(mockCitizenWithoutAffiliation);
    } catch (err: any) {
      expect(err.message).to.equal(expectedError.message);
    }
  });

  it('should verifyAffiliationAccessToken: OK true', () => {
    const verifyStub = sinon.stub(jwt, 'verify').returns(mockVerifyResult as any);
    const verifyResult = jwtService.verifyAffiliationAccessToken(mockToken);
    expect(verifyResult).to.equal(true);
    verifyStub.restore();
  });

  it('should verifyAffiliationAccessToken: OK false', () => {
    const verifyStub = sinon.stub(jwt, 'verify').returns(mockVerifyResultKO as any);
    const verifyResult = jwtService.verifyAffiliationAccessToken(mockToken);
    expect(verifyResult).to.equal(false);
    verifyStub.restore();
  });

  it('should verifyAffiliationAccessToken: KO jwt', () => {
    try {
      jwtService.verifyAffiliationAccessToken(mockToken);
    } catch (err) {
      expect(err).to.deepEqual(new Error('JsonWebTokenError: jwt malformed'));
    }
  });

  it('should decodeAffiliationAccessToken: OK', () => {
    const verifyStub = sinon.stub(jwt, 'verify').returns(mockVerifyResult as any);
    const decodeResult = jwtService.decodeAffiliationAccessToken(mockToken);
    expect(decodeResult).to.deepEqual(mockVerifyResult);
    verifyStub.restore();
  });

  it('should decodeAffiliationAccessToken: KO jwt', () => {
    try {
      jwtService.decodeAffiliationAccessToken(mockToken);
    } catch (err) {
      expect(err).to.deepEqual(new Error('JsonWebTokenError: jwt malformed'));
    }
  });
});

const mockCitizen = {
  id: 'randomInputId',
  affiliation: {
    enterpriseId: 'randomInputEnterpriseId',
  },
};

const mockCitizenKO = {
  id: 'randomInputId',
  affiliation: {
    enterpriseId: 'randomInputEnterpriseId',
  },
};

const mockCitizenWithoutAffiliation = {
  id: 'randomInputId',
};

const mockToken = 'token';

const mockVerifyResult = {
  id: 'randomInputId',
  enterpriseId: 'randomInputEnterpriseId',
};

const mockVerifyResultKO = {
  id: 'randomInputId',
};

import {expect, sinon} from '@loopback/testlab';
import {GeoApiGouvService} from '../../services';
import axios from 'axios';

describe('GeoApiGouv service', () => {
  let geoApiGouvService: GeoApiGouvService;

  beforeEach(() => {
    geoApiGouvService = new GeoApiGouvService();
  });

  it('should getCommunesByPostalCodeAndCity OK', async () => {
    const expectedResult = [
      {
        nom: 'Toulouse',
        code: '11111',
        codeRegion: '11',
        codeDepartement: '11',
        _score: 1,
      },
    ];
    const axiosGetStub = sinon.stub(axios, 'get');
    axiosGetStub.resolves({
      data: [
        {
          nom: 'Toulouse',
          code: '11111',
          codeRegion: '11',
          codeDepartement: '11',
          _score: 1,
        },
      ],
    });

    const result = await geoApiGouvService.getCommunesByPostalCodeAndCity('11111', 'Toulouse');
    expect(result).to.deepEqual(expectedResult);
    sinon.assert.calledOnceWithMatch(axiosGetStub, `https://geo.api.gouv.fr/communes`, {
      params: {
        nom: 'Toulouse',
        codePostal: '11111',
        format: 'json',
        fields: 'code,codeRegion,codeDepartement',
      },
    });
    axiosGetStub.restore();
  });

  it('should getCommunesByPostalCodeAndCity KO', async () => {
    const axiosGetStub = sinon.stub(axios, 'get');
    axiosGetStub.rejects(null);
    const result = await geoApiGouvService.getCommunesByPostalCodeAndCity('11111', 'Toulouse');
    expect(result).to.deepEqual(undefined);
    sinon.assert.calledOnceWithMatch(axiosGetStub, `https://geo.api.gouv.fr/communes`, {
      params: {
        nom: 'Toulouse',
        codePostal: '11111',
        format: 'json',
        fields: 'code,codeRegion,codeDepartement',
      },
    });
    axiosGetStub.restore();
  });
});

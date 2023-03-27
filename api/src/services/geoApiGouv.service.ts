import {injectable, BindingScope} from '@loopback/core';
import axios from 'axios';
import {GeoApiGouvConfig} from '../config';

import {IGeoApiGouvRequestParam, IGeoApiGouvResponseResult, Logger} from '../utils';

const GEO_API_GOUV_REQUEST_FIELDS = ['code', 'codeRegion', 'codeDepartement'];
@injectable({scope: BindingScope.TRANSIENT})
export class GeoApiGouvService {
  private geoApiGouvConfig: GeoApiGouvConfig;

  constructor() {
    this.geoApiGouvConfig = new GeoApiGouvConfig();
  }

  public async getCommunesByPostalCodeAndCity(
    postalCode: string,
    city: string,
  ): Promise<IGeoApiGouvResponseResult[] | undefined> {
    try {
      const geoApiGouvRequestParam: IGeoApiGouvRequestParam = {
        nom: city,
        codePostal: postalCode,
        format: 'json',
        fields: GEO_API_GOUV_REQUEST_FIELDS.join(','),
      };
      return (
        await axios.get(`${this.geoApiGouvConfig.getGeoApiGouvUrl()}/communes`, {
          params: geoApiGouvRequestParam,
        })
      ).data;
    } catch (error) {
      Logger.error(GeoApiGouvService.name, this.getCommunesByPostalCodeAndCity.name, 'Error', error);
      return undefined;
    }
  }
}

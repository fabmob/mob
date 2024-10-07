import {injectable, BindingScope} from '@loopback/core';
import { HttpErrors } from '@loopback/rest';
import {Request} from 'express';

const API_KEY = process.env.API_KEY ?? 'apikey';

@injectable({scope: BindingScope.TRANSIENT})
export class AuthenticationService {
  constructor() {}

  
  /**
   * Extract apiKey from Bearer Token
   * @param request Request
   * @returns string
   */
  extractApiKey(request: Request): string {
    const apiKeyHeaderValue = String(request.headers?.['x-api-key']);

    if (!apiKeyHeaderValue || apiKeyHeaderValue === 'undefined') {
      throw new HttpErrors.Unauthorized(`Header is not of type 'X-API-Key'`);
    }

    if (apiKeyHeaderValue !== API_KEY) {
      throw new HttpErrors.Unauthorized(`Wrong Api Key'`);
    }

    return apiKeyHeaderValue;
  }

}

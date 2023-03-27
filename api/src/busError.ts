import {Logger} from './utils';

export class BusError extends Error {
  protected property?: string;
  protected path: string;
  protected statusCode: number;
  protected resourceName: string | undefined;

  constructor(message: string, property: string, path: string, statusCode = 500, resourceName = '') {
    super(message);
    this.property = property;
    this.path = path;
    this.statusCode = statusCode;
    this.resourceName = resourceName !== '' ? resourceName : undefined;

    Logger.error(BusError.name, 'subscription', message, property);
  }
}

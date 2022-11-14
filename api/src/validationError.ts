import {logger} from './utils';

export class ValidationError extends Error {
  path: string | undefined;
  statusCode?: number;
  resourceName?: string | undefined;

  constructor(message: string, path: string, statusCode = 500, resourceName = '') {
    super(message);
    this.statusCode = statusCode;
    this.path = path;
    this.resourceName = resourceName !== '' ? resourceName : undefined;
    logger.error(message);
  }
}

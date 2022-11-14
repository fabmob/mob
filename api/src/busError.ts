import {logger} from './utils';
import {ValidationError} from './validationError';

export class BusError extends ValidationError {
  property?: string;

  constructor(
    message: string,
    property: string,
    path: string,
    statusCode = 500,
    resourceName = '',
  ) {
    super(message, path, statusCode, resourceName);
    this.property = property;
    logger.error(message);
  }
}

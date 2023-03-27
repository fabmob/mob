import {Logger, StatusCode} from './utils';
export abstract class ValidationError extends Error {
  protected path: string;
  protected statusCode: number;
  protected resourceName: string | undefined;

  constructor(message: string, path: string, statusCode: number, resourceName: string) {
    super(message);
    this.path = path;
    this.statusCode = statusCode;
    this.resourceName = resourceName !== '' ? resourceName : undefined;
  }

  abstract log(className: string, methodName: string, actualValue: any, expectedValue?: any): void;
}

export class BadRequestError extends ValidationError {
  constructor(
    className: string,
    methodName: string,
    message: string,
    path: string,
    resourceName: string,
    actualValue: any,
    expectedValue?: any,
  ) {
    super(message, path, StatusCode.BadRequest, resourceName);
    this.log(className, methodName, actualValue, expectedValue);
  }

  log(className: string, methodName: string, actualValue: any, expectedValue?: any): void {
    const logParams = `Expected Value: ${JSON.stringify(expectedValue)} - Received value: ${JSON.stringify(
      actualValue,
    )}`;
    Logger.error(className, methodName, this.message, logParams);
  }
}
export class UnauthorizedError extends ValidationError {
  constructor(className: string, methodName: string, message: string, actualValue: any) {
    super(message, '/authorization', StatusCode.Unauthorized, '');
    this.log(className, methodName, actualValue);
  }

  log(className: string, methodName: string, actualValue: any): void {
    const logParams = `Received value: ${JSON.stringify(actualValue)}`;
    Logger.error(className, methodName, this.message, logParams);
  }
}
export class ForbiddenError extends ValidationError {
  constructor(className: string, methodName: string, actualValue: any, expectedValue?: any) {
    super('Access denied', '/authorization', StatusCode.Forbidden, '');
    this.log(className, methodName, actualValue, expectedValue);
  }

  log(className: string, methodName: string, actualValue: any, expectedValue?: any): void {
    const logParams = `Expected Value: ${JSON.stringify(expectedValue)} - Received value: ${JSON.stringify(
      actualValue,
    )}`;
    Logger.error(className, methodName, this.message, logParams);
  }
}
export class NotFoundError extends ValidationError {
  constructor(
    className: string,
    methodName: string,
    message: string,
    path: string,
    resourceName: string,
    actualValue: any,
  ) {
    super(message, path, StatusCode.NotFound, resourceName);
    this.log(className, methodName, actualValue);
  }

  log(className: string, methodName: string, actualValue: any): void {
    const logParams = `Received value: ${JSON.stringify(actualValue)} does not exist`;
    Logger.error(className, methodName, this.message, logParams);
  }
}
export class ConflictError extends ValidationError {
  constructor(
    className: string,
    methodName: string,
    message: string,
    path: string,
    resourceName: string,
    actualValue: any,
    expectedValue?: any,
  ) {
    super(message, path, StatusCode.Conflict, resourceName);
    this.log(className, methodName, actualValue, expectedValue);
  }

  log(className: string, methodName: string, actualValue: any, expectedValue?: any): void {
    let logParams: string;
    if (expectedValue) {
      logParams = `Expected Value: ${JSON.stringify(expectedValue)} - Received value: ${JSON.stringify(
        actualValue,
      )}`;
    } else {
      logParams = `Received value: ${JSON.stringify(actualValue)} already exists`;
    }
    Logger.error(className, methodName, this.message, logParams);
  }
}

export class UnsupportedMediaTypeError extends ValidationError {
  constructor(
    className: string,
    methodName: string,
    message: string,
    path: string,
    resourceName: string,
    actualValue: any,
  ) {
    super(message, path, StatusCode.UnsupportedMediaType, resourceName);
    this.log(className, methodName, actualValue);
  }

  log(className: string, methodName: string, actualValue: any): void {
    const logParams = `Received value: ${JSON.stringify(actualValue)}`;
    Logger.error(className, methodName, this.message, logParams);
  }
}

export class UnprocessableEntityError extends ValidationError {
  constructor(
    className: string,
    methodName: string,
    message: string,
    path: string,
    resourceName: string,
    actualValue: any,
    expectedValue?: any,
  ) {
    super(message, path, StatusCode.UnprocessableEntity, resourceName);
    this.log(className, methodName, actualValue, expectedValue);
  }

  log(className: string, methodName: string, actualValue: any, expectedValue?: any): void {
    const logParams = `Expected Value: ${JSON.stringify(expectedValue)} - Received value: ${JSON.stringify(
      actualValue,
    )}`;
    Logger.error(className, methodName, this.message, logParams);
  }
}

export class InternalServerError extends ValidationError {
  constructor(className: string, methodName: string, actualValue: any) {
    super('Error', '/internal', StatusCode.InternalServerError, '');
    this.log(className, methodName, actualValue);
  }

  log(className: string, methodName: string, actualValue: any): void {
    const logParams = `Internal Error: ${JSON.stringify(actualValue)}`;
    Logger.error(className, methodName, this.message, logParams);
  }
}

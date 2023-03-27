import {Provider} from '@loopback/core';
import {LogError, Request} from '@loopback/rest';
import {Logger} from '../utils';

export class LoggerProvider implements Provider<LogError> {
  constructor() {}

  value(): LogError {
    return this.action.bind(this);
  }

  action(err: Error, statusCode: number, req: Request) {
    Logger.error(LoggerProvider.name, this.action.name, 'lb4 error', err);
  }
}

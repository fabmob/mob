import {BindingKey} from '@loopback/context';
import {Logger} from './utils';

export namespace LoggerBindings {
  export const LOGGER = BindingKey.create<Logger>('class.logger');
}

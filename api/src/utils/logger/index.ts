import {inject} from '@loopback/context';
import {createLogger, format, transports, Logger as WinstonLogger} from 'winston';

const truncateSensitiveData = (info: any): any => {
  // DO NOT SHOW SENSITIVE INFORMATION ABOUT CITIZENS
  if (info.params && typeof info.params === 'object' && 'identity' in info.params) {
    info.params = {id: info.params.id, affiliation: info.params.affiliation};
  }
  return info;
};

const handleMessage = (info: any): string => {
  let message: string;

  if (info.userId) {
    message = `[${info.timestamp}][${info.level}][userId=${info.userId}]\
    [${info.className}][${info.methodName}]${info.message}`;
  } else {
    message = `[${info.timestamp}][${info.level}]\
    [${info.className}][${info.methodName}] ${info.message}`;
  }
  if (info.params) {
    if (typeof info.params === 'string') {
      message += ` - ${info.params}`;
    } else {
      message += ` - ${JSON.stringify(info.params)}`;
    }
  }
  return message;
};

const logger: WinstonLogger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  exitOnError: false,
  format: format.combine(
    format.cli(),
    format.timestamp(),
    format.printf(info => handleMessage(truncateSensitiveData(info))),
  ),
  transports: [new transports.Console()],
});

export class Logger {
  private static userId?: string;
  constructor(@inject('userId') private userId?: string) {
    Logger.userId = this.userId;
  }
  public static debug(className: string, methodName: string, message: string, params?: any): void {
    logger.debug({userId: Logger.userId, ...{className, methodName, message, params}});
  }
  public static info(className: string, methodName: string, message: string, params?: any): void {
    logger.info({userId: Logger.userId, ...{className, methodName, message, params}});
  }
  public static warn(className: string, methodName: string, message: string, params?: any): void {
    logger.warn({userId: Logger.userId, ...{className, methodName, message, params}});
  }
  public static error(className: string, methodName: string, message: string, params?: any): void {
    logger.error({userId: Logger.userId, ...{className, methodName, message, params}});
  }
}

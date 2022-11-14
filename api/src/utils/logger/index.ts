import {createLogger, format, transports} from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  exitOnError: false,
  format: format.combine(
    format.cli(),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    format.printf(
      info =>
        `[${info.timestamp}]-[${info.level}]: ${info.message}` +
        (info.splat !== undefined ? `${info.splat}` : ' '),
    ),
  ),
  transports: [new transports.Console()],
});

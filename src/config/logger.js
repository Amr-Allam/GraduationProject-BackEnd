import winston, { format } from 'winston';
import 'winston-daily-rotate-file';

const isVercel = !!process.env.VERCEL;
const serverLogDir = isVercel ? '/tmp/logs/server' : 'logs/server';
const requestLogDir = isVercel ? '/tmp/logs/requests' : 'logs/requests';

/**
 * Logger handles all logs in the application
 */
const logger = winston.createLogger({
  format: format.combine(format.timestamp(), format.simple()),
  colorize: true,
  transports: [
    new winston.transports.File({
      filename: `${serverLogDir}/error.log`,
      level: 'error',
      handleExceptions: true
    }),
    new winston.transports.File({
      filename: `${serverLogDir}/all.log`,
      level: 'info',
      handleExceptions: true
    }),
    new winston.transports.DailyRotateFile({
      maxFiles: '14d',
      level: 'info',
      dirname: `${serverLogDir}/daily`,
      datePattern: 'YYYY-MM-DD',
      filename: '%DATE%.log'
    }),
    new winston.transports.Console({
      level: 'debug',
      json: false,
      handleExceptions: true
    })
  ]
});

/**
 * morganLogger logs all http request in a dedicated file and on console
 */
const morganLogger = winston.createLogger({
  format: format.combine(format.simple()),
  transports: [
    new winston.transports.File({
      filename: `${requestLogDir}/all.log`,
      level: 'debug',
      handleExceptions: true
    }),
    new winston.transports.Console({
      level: 'debug',
      json: false,
      handleExceptions: true
    }),
    new winston.transports.DailyRotateFile({
      maxFiles: '14d',
      level: 'info',
      dirname: `${requestLogDir}/daily`,
      datePattern: 'YYYY-MM-DD',
      filename: '%DATE%.log'
    })
  ]
});

export const logStream = {
  /**
   * A writable stream for winston logger.
   *
   * @param {any} message
   */
  write(message) {
    morganLogger.info(message.toString());
  }
};

export default logger;

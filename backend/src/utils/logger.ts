import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  verbose: 'white',
  debug: 'green',
};

const loggingLevelsConfig = Object.freeze({
  levels,
  colors,
});

const logger = winston.createLogger({
  levels: loggingLevelsConfig.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ colors: loggingLevelsConfig.colors }),
        winston.format.simple()
      )
    })
  ]
});

export default logger;

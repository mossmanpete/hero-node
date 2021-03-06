import { default as chalk } from 'chalk';
import * as _ from 'lodash';
import * as moment from 'moment';
import { createLogger, format, transports } from 'winston';

declare namespace logger {
  type LogCallback = (
    error?: any,
    level?: string,
    msg?: string,
    meta?: any,
  ) => void;

  interface LeveledLogMethod {
    (msg: string, callback: LogCallback): any;
    (msg: string, meta: any, callback: LogCallback): any;
    (msg: string, ...meta: any[]): any;
  }

  interface ILoggerInstance {
    silly: LeveledLogMethod;
    debug: LeveledLogMethod;
    verbose: LeveledLogMethod;
    info: LeveledLogMethod;
    warn: LeveledLogMethod;
    error: LeveledLogMethod;
  }
}

interface ILoggerInstanceOption {
  colorize: boolean;
  env: string;
}

function getFormattedLevel(level: string, colorize = true) {
  let result;
  if (level) {
    const text = _.toUpper(level);
    if (!!colorize) {
      if (text === 'INFO') {
        result = chalk.blue(text);
      } else if (text === 'WARN') {
        result = chalk.yellow(text);
      } else if (text === 'ERROR') {
        result = chalk.red(text);
      } else {
        result = text;
      }
    }
    result = _.padEnd(`[${result}]`, 19);
  }
  return result;
}

function getFormattedCategory(category, colorize = true) {
  let result;
  if (category) {
    if (!!colorize) {
      result = chalk.cyan.bold(category);
    } else {
      result = category;
    }
  }
  return result;
}

export class LoggerFactory {
  static _instances = new Map<string, logger.ILoggerInstance>();

  static getLabeledInstance(
    category: string,
    callee?: string,
    options?: ILoggerInstanceOption,
  ): logger.ILoggerInstance {
    if (!category || _.isEmpty(category)) category = 'main';
    if (!callee || _.isEmpty(callee)) callee = '';

    let colorize = true;
    if (
      _.get(options, 'env') === 'prod' ||
      _.get(options, 'colorize') === false
    ) {
      colorize = false;
    }

    const identity = `${category}-${callee}`;
    let labeledInstance = this._instances.get(identity);

    if (!labeledInstance) {
      labeledInstance = createLogger({
        format: format.printf(info => {
          const categoryInfo = getFormattedCategory(category);
          const calleeInfo = getFormattedCategory(callee)
            ? `:${getFormattedCategory(callee)}`
            : '';
          return `${moment().format(
            'YYYY-MM-DD hh:mm:ss.SSS',
          )} ${getFormattedLevel(
            info.level,
            colorize,
          )} --- [${categoryInfo}${calleeInfo}]: ${info.message}`;
        }),
        transports: [new transports.Console()],
      });
      this._instances.set(identity, labeledInstance);
    }
    return labeledInstance;
  }
}

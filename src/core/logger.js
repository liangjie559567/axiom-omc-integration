/**
 * 日志系统
 */

import chalk from 'chalk';

export class Logger {
  constructor(namespace = 'App') {
    this.namespace = namespace;
  }

  info(message, data = null) {
    console.log(chalk.blue(`[${this.namespace}]`), message, data || '');
  }

  warn(message, data = null) {
    console.warn(chalk.yellow(`[${this.namespace}]`), message, data || '');
  }

  error(message, data = null) {
    console.error(chalk.red(`[${this.namespace}]`), message, data || '');
  }

  success(message, data = null) {
    console.log(chalk.green(`[${this.namespace}]`), message, data || '');
  }

  debug(message, data = null) {
    if (process.env.DEBUG) {
      console.log(chalk.gray(`[${this.namespace}]`), message, data || '');
    }
  }
}

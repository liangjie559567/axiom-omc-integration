/**
 * 日志系统
 */

import chalk from 'chalk';

export class Logger {
  constructor(namespace = 'App', options = {}) {
    this.namespace = namespace;
    this.showTimestamp = options.showTimestamp ?? true;
    this.showLevel = options.showLevel ?? true;
  }

  _formatMessage(level, message, data) {
    const parts = [];

    // 时间戳
    if (this.showTimestamp) {
      const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
      parts.push(chalk.gray(time));
    }

    // 级别
    if (this.showLevel) {
      const levelColors = {
        INFO: chalk.blue,
        WARN: chalk.yellow,
        ERROR: chalk.red,
        SUCCESS: chalk.green,
        DEBUG: chalk.gray
      };
      const colorFn = levelColors[level] || chalk.white;
      parts.push(colorFn(`[${level}]`));
    }

    // 命名空间
    parts.push(chalk.cyan(`[${this.namespace}]`));

    // 消息
    parts.push(message);

    // 数据
    if (data) {
      parts.push(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    }

    return parts.join(' ');
  }

  info(message, data = null) {
    console.log(this._formatMessage('INFO', message, data));
  }

  warn(message, data = null) {
    console.warn(this._formatMessage('WARN', message, data));
  }

  error(message, data = null) {
    console.error(this._formatMessage('ERROR', message, data));
  }

  success(message, data = null) {
    console.log(this._formatMessage('SUCCESS', message, data));
  }

  debug(message, data = null) {
    if (process.env.DEBUG) {
      console.log(this._formatMessage('DEBUG', message, data));
    }
  }

  // 新增：进度提示
  progress(message, current, total) {
    const percentage = Math.round((current / total) * 100);
    const bar = this._createProgressBar(percentage);
    console.log(chalk.cyan(`[${this.namespace}]`), message, bar, chalk.bold(`${percentage}%`));
  }

  _createProgressBar(percentage, width = 20) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  // 新增：实时操作反馈
  action(agent, operation, status = 'running') {
    const statusIcons = {
      running: chalk.yellow('⚙'),
      success: chalk.green('✓'),
      failed: chalk.red('✗')
    };
    const icon = statusIcons[status] || '•';
    console.log(icon, chalk.cyan(`[${agent}]`), operation);
  }
}

/**
 * CommandParser - 命令参数解析器
 *
 * 提供命令行参数解析功能，支持：
 * - 位置参数
 * - 命名参数（--key=value, --key value）
 * - 布尔标志（-v, --verbose）
 * - 短标志组合（-abc = -a -b -c）
 */

import { Logger } from './logger.js';

const logger = new Logger('CommandParser');

/**
 * 解析结果
 */
export class ParsedCommand {
  constructor() {
    this.command = null;        // 命令名称
    this.args = [];             // 位置参数
    this.flags = {};            // 命名参数和标志
    this.raw = '';              // 原始输入
  }
}

/**
 * 命令参数解析器
 */
export class CommandParser {
  /**
   * 解析命令字符串
   *
   * @param {string} input - 命令字符串
   * @returns {ParsedCommand} 解析结果
   */
  parse(input) {
    const result = new ParsedCommand();
    result.raw = input;

    if (!input || typeof input !== 'string') {
      return result;
    }

    // 分词
    const tokens = this.tokenize(input.trim());

    if (tokens.length === 0) {
      return result;
    }

    // 第一个 token 是命令名称
    result.command = tokens[0];

    // 解析剩余参数
    let i = 1;
    while (i < tokens.length) {
      const token = tokens[i];

      if (token.startsWith('--')) {
        // 长标志：--key 或 --key=value
        i = this.parseLongFlag(tokens, i, result);
      } else if (token.startsWith('-') && token.length > 1) {
        // 短标志：-v 或 -abc
        i = this.parseShortFlag(tokens, i, result);
      } else {
        // 位置参数
        result.args.push(token);
        i++;
      }
    }

    return result;
  }

  /**
   * 分词
   *
   * @param {string} input - 输入字符串
   * @returns {Array<string>} token 数组
   */
  tokenize(input) {
    const tokens = [];
    let current = '';
    let inQuote = false;
    let quoteChar = null;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      if ((char === '"' || char === "'") && (i === 0 || input[i - 1] !== '\\')) {
        if (!inQuote) {
          inQuote = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuote = false;
          quoteChar = null;
        } else {
          current += char;
        }
      } else if (char === ' ' && !inQuote) {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }

  /**
   * 解析长标志
   *
   * @param {Array<string>} tokens - token 数组
   * @param {number} index - 当前索引
   * @param {ParsedCommand} result - 解析结果
   * @returns {number} 新索引
   */
  parseLongFlag(tokens, index, result) {
    const token = tokens[index];
    const flagName = token.substring(2); // 移除 --

    if (flagName.includes('=')) {
      // --key=value 格式
      const [key, ...valueParts] = flagName.split('=');
      const value = valueParts.join('=');
      result.flags[key] = value;
      return index + 1;
    } else {
      // --key 或 --key value 格式
      const nextToken = tokens[index + 1];

      if (nextToken && !nextToken.startsWith('-')) {
        // --key value
        result.flags[flagName] = nextToken;
        return index + 2;
      } else {
        // --key（布尔标志）
        result.flags[flagName] = true;
        return index + 1;
      }
    }
  }

  /**
   * 解析短标志
   *
   * @param {Array<string>} tokens - token 数组
   * @param {number} index - 当前索引
   * @param {ParsedCommand} result - 解析结果
   * @returns {number} 新索引
   */
  parseShortFlag(tokens, index, result) {
    const token = tokens[index];
    const flags = token.substring(1); // 移除 -

    if (flags.length === 1) {
      // 单个短标志：-v
      const nextToken = tokens[index + 1];

      if (nextToken && !nextToken.startsWith('-')) {
        // -v value
        result.flags[flags] = nextToken;
        return index + 2;
      } else {
        // -v（布尔标志）
        result.flags[flags] = true;
        return index + 1;
      }
    } else {
      // 组合短标志：-abc = -a -b -c
      for (const flag of flags) {
        result.flags[flag] = true;
      }
      return index + 1;
    }
  }

  /**
   * 格式化命令（用于显示）
   *
   * @param {ParsedCommand} parsed - 解析结果
   * @returns {string} 格式化字符串
   */
  format(parsed) {
    const parts = [parsed.command];

    // 添加位置参数
    parts.push(...parsed.args);

    // 添加标志
    for (const [key, value] of Object.entries(parsed.flags)) {
      if (value === true) {
        parts.push(key.length === 1 ? `-${key}` : `--${key}`);
      } else {
        parts.push(key.length === 1 ? `-${key}` : `--${key}`, value);
      }
    }

    return parts.join(' ');
  }

  /**
   * 验证必需参数
   *
   * @param {ParsedCommand} parsed - 解析结果
   * @param {Object} schema - 参数模式
   * @returns {Object} 验证结果 { valid: boolean, errors: Array }
   */
  validate(parsed, schema = {}) {
    const errors = [];

    // 验证必需的位置参数
    if (schema.requiredArgs) {
      const required = schema.requiredArgs;
      if (parsed.args.length < required) {
        errors.push(`需要至少 ${required} 个参数，但只提供了 ${parsed.args.length} 个`);
      }
    }

    // 验证必需的标志
    if (schema.requiredFlags) {
      for (const flag of schema.requiredFlags) {
        if (!(flag in parsed.flags)) {
          errors.push(`缺少必需的标志: --${flag}`);
        }
      }
    }

    // 验证标志类型
    if (schema.flagTypes) {
      for (const [flag, type] of Object.entries(schema.flagTypes)) {
        if (flag in parsed.flags) {
          const value = parsed.flags[flag];

          if (type === 'number' && isNaN(Number(value))) {
            errors.push(`标志 --${flag} 必须是数字`);
          } else if (type === 'boolean' && typeof value !== 'boolean') {
            errors.push(`标志 --${flag} 必须是布尔值`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取标志值（带默认值）
   *
   * @param {ParsedCommand} parsed - 解析结果
   * @param {string} flag - 标志名称
   * @param {*} defaultValue - 默认值
   * @returns {*} 标志值
   */
  getFlag(parsed, flag, defaultValue = null) {
    return parsed.flags[flag] !== undefined ? parsed.flags[flag] : defaultValue;
  }

  /**
   * 检查标志是否存在
   *
   * @param {ParsedCommand} parsed - 解析结果
   * @param {string} flag - 标志名称
   * @returns {boolean} 是否存在
   */
  hasFlag(parsed, flag) {
    return flag in parsed.flags;
  }

  /**
   * 获取位置参数（带默认值）
   *
   * @param {ParsedCommand} parsed - 解析结果
   * @param {number} index - 参数索引
   * @param {*} defaultValue - 默认值
   * @returns {*} 参数值
   */
  getArg(parsed, index, defaultValue = null) {
    return parsed.args[index] !== undefined ? parsed.args[index] : defaultValue;
  }
}

// 导出单例
export const commandParser = new CommandParser();

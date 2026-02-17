/**
 * HookSystem - 事件驱动的钩子系统
 *
 * 提供标准化的事件钩子机制，支持：
 * - 事件注册和触发
 * - 同步/异步钩子执行
 * - 条件匹配器
 * - 命令和函数钩子
 * - 错误隔离
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { Logger } from './logger.js';

const execAsync = promisify(exec);
const logger = new Logger('HookSystem');

/**
 * 钩子上下文
 */
export class HookContext {
  constructor(event, data = {}) {
    this.event = event;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * 钩子执行器
 */
export class HookExecutor {
  /**
   * 执行命令钩子
   */
  static async executeCommand(command, context, async = false) {
    try {
      // 替换环境变量
      const expandedCommand = this.expandVariables(command, context);

      logger.info(`执行命令钩子: ${expandedCommand}`);

      if (async) {
        // 异步执行，不等待结果
        exec(expandedCommand, (error, stdout, stderr) => {
          if (error) {
            logger.error(`异步命令钩子失败: ${error.message}`);
          } else {
            logger.info(`异步命令钩子完成`);
          }
        });
        return { success: true, async: true };
      } else {
        // 同步执行，等待结果
        const { stdout, stderr } = await execAsync(expandedCommand);

        if (stderr) {
          logger.warn(`命令钩子 stderr: ${stderr}`);
        }

        return {
          success: true,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        };
      }
    } catch (error) {
      logger.error(`命令钩子执行失败: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 执行函数钩子
   */
  static async executeFunction(fn, context, async = false) {
    try {
      logger.info(`执行函数钩子`);

      if (async) {
        // 异步执行，不等待结果
        Promise.resolve(fn(context)).catch(error => {
          logger.error(`异步函数钩子失败: ${error.message}`);
        });
        return { success: true, async: true };
      } else {
        // 同步执行，等待结果
        const result = await Promise.resolve(fn(context));
        return {
          success: true,
          result
        };
      }
    } catch (error) {
      logger.error(`函数钩子执行失败: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 展开环境变量和上下文变量
   */
  static expandVariables(command, context) {
    let expanded = command;

    // 替换 ${VARIABLE} 格式的环境变量
    expanded = expanded.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      // 先检查上下文数据
      if (context.data && context.data[varName] !== undefined) {
        return context.data[varName];
      }
      // 再检查环境变量
      return process.env[varName] || match;
    });

    // 替换 $VARIABLE 格式的环境变量
    expanded = expanded.replace(/\$([A-Z_][A-Z0-9_]*)/g, (match, varName) => {
      return process.env[varName] || match;
    });

    return expanded;
  }
}

/**
 * 钩子系统
 */
export class HookSystem {
  constructor() {
    // 事件 -> 钩子配置数组
    this.hooks = new Map();

    // 统计信息
    this.stats = {
      registered: 0,
      executed: 0,
      failed: 0
    };

    logger.info('钩子系统已初始化');
  }

  /**
   * 注册钩子
   *
   * @param {string} event - 事件名称
   * @param {Object} config - 钩子配置
   * @param {string} config.matcher - 可选的匹配器（正则表达式）
   * @param {Array} config.hooks - 钩子定义数组
   */
  registerHook(event, config) {
    if (!event || typeof event !== 'string') {
      throw new Error('事件名称必须是非空字符串');
    }

    if (!config || !Array.isArray(config.hooks)) {
      throw new Error('配置必须包含 hooks 数组');
    }

    // 获取或创建事件的钩子数组
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }

    this.hooks.get(event).push(config);
    this.stats.registered++;

    logger.info(`已注册钩子: ${event}`);
  }

  /**
   * 执行钩子
   *
   * @param {string} event - 事件名称
   * @param {Object} data - 事件数据
   * @returns {Promise<Object>} 执行结果
   */
  async executeHooks(event, data = {}) {
    const context = new HookContext(event, data);

    logger.info(`执行钩子: ${event}`);

    // 获取事件的钩子配置
    const configs = this.hooks.get(event);
    if (!configs || configs.length === 0) {
      logger.debug(`没有注册的钩子: ${event}`);
      return {
        event,
        executed: 0,
        results: []
      };
    }

    const results = [];
    let executed = 0;

    // 遍历所有配置
    for (const config of configs) {
      // 检查匹配器
      if (config.matcher) {
        const matcher = new RegExp(config.matcher);
        const matchString = data.action || data.name || event;

        if (!matcher.test(matchString)) {
          logger.debug(`匹配器失败: ${matchString}`);
          continue;
        }
      }

      // 执行配置中的所有钩子
      for (const hook of config.hooks) {
        try {
          let result;

          if (hook.type === 'command') {
            result = await HookExecutor.executeCommand(
              hook.command,
              context,
              hook.async || false
            );
          } else if (hook.type === 'function') {
            result = await HookExecutor.executeFunction(
              hook.function,
              context,
              hook.async || false
            );
          } else {
            logger.warn(`未知的钩子类型: ${hook.type}`);
            continue;
          }

          results.push({
            type: hook.type,
            success: result.success,
            async: result.async || false,
            ...result
          });

          if (result.success) {
            executed++;
            this.stats.executed++;
          } else {
            this.stats.failed++;
          }
        } catch (error) {
          logger.error(`钩子执行错误: ${error.message}`);
          results.push({
            type: hook.type,
            success: false,
            error: error.message
          });
          this.stats.failed++;
        }
      }
    }

    logger.info(`已执行 ${executed} 个钩子: ${event}`);

    return {
      event,
      executed,
      results
    };
  }

  /**
   * 从配置文件加载钩子
   *
   * @param {string} configPath - 配置文件路径
   */
  async loadFromConfig(configPath) {
    try {
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      if (!config.hooks || typeof config.hooks !== 'object') {
        throw new Error('无效的钩子配置格式');
      }

      // 注册所有钩子
      for (const [event, configs] of Object.entries(config.hooks)) {
        for (const hookConfig of configs) {
          this.registerHook(event, hookConfig);
        }
      }

      logger.info(`已从配置文件加载钩子: ${configPath}`);
      return true;
    } catch (error) {
      logger.error(`加载钩子配置失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 注册函数钩子（编程方式）
   *
   * @param {string} event - 事件名称
   * @param {Function} fn - 钩子函数
   * @param {Object} options - 选项
   */
  registerFunctionHook(event, fn, options = {}) {
    this.registerHook(event, {
      matcher: options.matcher,
      hooks: [{
        type: 'function',
        function: fn,
        async: options.async || false
      }]
    });
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      events: this.hooks.size,
      hooks: Array.from(this.hooks.values()).reduce(
        (sum, configs) => sum + configs.reduce((s, c) => s + c.hooks.length, 0),
        0
      )
    };
  }

  /**
   * 清除所有钩子
   */
  clear() {
    this.hooks.clear();
    this.stats = {
      registered: 0,
      executed: 0,
      failed: 0
    };
    logger.info('已清除所有钩子');
  }

  /**
   * 移除特定事件的钩子
   */
  removeHooks(event) {
    if (this.hooks.has(event)) {
      this.hooks.delete(event);
      logger.info(`已移除钩子: ${event}`);
      return true;
    }
    return false;
  }
}

// 导出单例
export const hookSystem = new HookSystem();

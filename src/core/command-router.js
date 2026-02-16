/**
 * 统一命令路由器
 * 整合 Axiom、OMC 和 Superpowers 三个系统的命令
 */

import { EventEmitter } from 'events';
import { Logger } from './logger.js';
import { generateId } from '../utils/index.js';

const logger = new Logger('CommandRouter');

/**
 * 命令优先级枚举
 */
export const CommandPriority = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  CRITICAL: 20
};

/**
 * 命令系统枚举
 */
export const CommandSystem = {
  AXIOM: 'axiom',
  OMC: 'omc',
  SUPERPOWERS: 'superpowers',
  INTEGRATED: 'integrated'
};

/**
 * 冲突解决策略枚举
 */
export const ConflictStrategy = {
  LATEST: 'latest',           // 使用最后注册的
  OMC_PRIORITY: 'omc_priority',     // OMC 优先
  AXIOM_PRIORITY: 'axiom_priority', // Axiom 优先
  MANUAL: 'manual'            // 手动选择
};

/**
 * 命令路由器类
 */
export class CommandRouter extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} config - 配置选项
   */
  constructor(config = {}) {
    super();

    this.config = {
      conflictStrategy: config.conflictStrategy || ConflictStrategy.LATEST,
      maxHistorySize: config.maxHistorySize || 100,
      enableValidation: config.enableValidation !== false,
      enablePermissionCheck: config.enablePermissionCheck !== false,
      ...config
    };

    // 命令注册表
    this.commands = new Map(); // commandName -> command info
    this.aliases = new Map();  // alias -> commandName
    this.conflicts = new Map(); // commandName -> [conflicting commands]

    // 命令历史
    this.history = [];

    // 统计信息
    this.stats = {
      totalCommands: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      conflictsDetected: 0,
      conflictsResolved: 0
    };

    logger.info('命令路由器已初始化', {
      conflictStrategy: this.config.conflictStrategy,
      maxHistorySize: this.config.maxHistorySize
    });
  }

  /**
   * 注册命令
   * @param {string} name - 命令名称
   * @param {Function} handler - 命令处理器
   * @param {Object} options - 选项
   * @returns {boolean} - 是否成功注册
   */
  register(name, handler, options = {}) {
    if (!name || typeof name !== 'string') {
      throw new Error('命令名称必须是非空字符串');
    }

    if (!handler || typeof handler !== 'function') {
      throw new Error('命令处理器必须是函数');
    }

    const commandInfo = {
      name,
      handler,
      priority: options.priority || CommandPriority.NORMAL,
      system: options.system || CommandSystem.INTEGRATED,
      description: options.description || '',
      aliases: options.aliases || [],
      permissions: options.permissions || [],
      validation: options.validation || null,
      metadata: options.metadata || {},
      registeredAt: Date.now()
    };

    // 检测冲突
    if (this.commands.has(name)) {
      return this._handleConflict(name, commandInfo);
    }

    // 注册命令
    this.commands.set(name, commandInfo);
    this.stats.totalCommands++;

    // 注册别名
    if (commandInfo.aliases.length > 0) {
      commandInfo.aliases.forEach(alias => {
        this.aliases.set(alias, name);
      });
    }

    logger.info(`命令已注册: ${name}`, {
      system: commandInfo.system,
      priority: commandInfo.priority,
      aliases: commandInfo.aliases
    });

    this.emit('commandRegistered', commandInfo);

    return true;
  }

  /**
   * 注销命令
   * @param {string} name - 命令名称
   * @returns {boolean} - 是否成功注销
   */
  unregister(name) {
    const command = this.commands.get(name);
    if (!command) {
      return false;
    }

    // 删除别名
    command.aliases.forEach(alias => {
      this.aliases.delete(alias);
    });

    // 删除命令
    this.commands.delete(name);
    this.stats.totalCommands--;

    logger.info(`命令已注销: ${name}`);
    this.emit('commandUnregistered', { name });

    return true;
  }

  /**
   * 路由命令
   * @param {string} commandName - 命令名称
   * @param {Array} args - 命令参数
   * @param {Object} context - 执行上下文
   * @returns {Promise<any>} - 命令执行结果
   */
  async route(commandName, args = [], context = {}) {
    const startTime = Date.now();

    // 解析命令名称（可能是别名）
    const actualName = this.aliases.get(commandName) || commandName;

    // 获取命令
    const command = this.commands.get(actualName);
    if (!command) {
      throw new Error(`命令不存在: ${commandName}`);
    }

    // 验证参数
    if (this.config.enableValidation && command.validation) {
      this._validateArgs(command, args);
    }

    // 检查权限
    if (this.config.enablePermissionCheck && command.permissions.length > 0) {
      this._checkPermissions(command, context);
    }

    // 记录历史
    const executionId = generateId();
    this._recordHistory({
      id: executionId,
      command: actualName,
      args,
      context,
      startTime
    });

    this.stats.totalExecutions++;

    logger.info(`执行命令: ${actualName}`, {
      executionId,
      system: command.system
    });

    this.emit('commandExecuting', {
      id: executionId,
      command: actualName,
      args,
      context
    });

    try {
      // 执行命令
      const result = await command.handler(args, context);

      const duration = Date.now() - startTime;
      this.stats.successfulExecutions++;

      // 更新历史
      this._updateHistory(executionId, {
        status: 'success',
        result,
        duration,
        endTime: Date.now()
      });

      logger.info(`命令执行成功: ${actualName}`, {
        executionId,
        duration: `${duration}ms`
      });

      this.emit('commandExecuted', {
        id: executionId,
        command: actualName,
        result,
        duration
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.failedExecutions++;

      // 更新历史
      this._updateHistory(executionId, {
        status: 'failed',
        error: error.message,
        duration,
        endTime: Date.now()
      });

      logger.error(`命令执行失败: ${actualName}`, error);

      this.emit('commandFailed', {
        id: executionId,
        command: actualName,
        error: error.message,
        duration
      });

      throw error;
    }
  }

  /**
   * 获取命令信息
   * @param {string} name - 命令名称
   * @returns {Object|null} - 命令信息
   */
  getCommand(name) {
    const actualName = this.aliases.get(name) || name;
    return this.commands.get(actualName) || null;
  }

  /**
   * 获取所有命令
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 命令列表
   */
  getAllCommands(filters = {}) {
    let commands = Array.from(this.commands.values());

    // 按系统过滤
    if (filters.system) {
      commands = commands.filter(cmd => cmd.system === filters.system);
    }

    // 按优先级过滤
    if (filters.priority) {
      commands = commands.filter(cmd => cmd.priority >= filters.priority);
    }

    // 排序
    if (filters.sortBy === 'priority') {
      commands.sort((a, b) => b.priority - a.priority);
    } else if (filters.sortBy === 'name') {
      commands.sort((a, b) => a.name.localeCompare(b.name));
    }

    return commands;
  }

  /**
   * 检测命令冲突
   * @param {string} name - 命令名称
   * @returns {boolean} - 是否存在冲突
   */
  detectConflict(name) {
    return this.commands.has(name);
  }

  /**
   * 获取命令历史
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 历史记录
   */
  getHistory(filters = {}) {
    let history = [...this.history];

    // 按命令过滤
    if (filters.command) {
      history = history.filter(h => h.command === filters.command);
    }

    // 按状态过滤
    if (filters.status) {
      history = history.filter(h => h.status === filters.status);
    }

    // 按时间范围过滤
    if (filters.startTime) {
      history = history.filter(h => h.startTime >= filters.startTime);
    }

    if (filters.endTime) {
      history = history.filter(h => h.endTime <= filters.endTime);
    }

    // 限制数量
    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    return history;
  }

  /**
   * 清空历史
   */
  clearHistory() {
    this.history = [];
    logger.info('命令历史已清空');
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalExecutions > 0
        ? (this.stats.successfulExecutions / this.stats.totalExecutions * 100).toFixed(2) + '%'
        : '0%',
      conflictResolutionRate: this.stats.conflictsDetected > 0
        ? (this.stats.conflictsResolved / this.stats.conflictsDetected * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * 处理命令冲突
   * @private
   * @param {string} name - 命令名称
   * @param {Object} newCommand - 新命令信息
   * @returns {boolean} - 是否成功处理
   */
  _handleConflict(name, newCommand) {
    const existingCommand = this.commands.get(name);

    this.stats.conflictsDetected++;

    logger.warn(`检测到命令冲突: ${name}`, {
      existing: existingCommand.system,
      new: newCommand.system
    });

    // 记录冲突
    if (!this.conflicts.has(name)) {
      this.conflicts.set(name, []);
    }
    this.conflicts.get(name).push({
      command: newCommand,
      timestamp: Date.now()
    });

    this.emit('conflictDetected', {
      name,
      existing: existingCommand,
      new: newCommand
    });

    // 根据策略解决冲突
    const resolved = this._resolveConflict(name, existingCommand, newCommand);

    if (resolved) {
      this.stats.conflictsResolved++;
    }

    return resolved;
  }

  /**
   * 解决命令冲突
   * @private
   * @param {string} name - 命令名称
   * @param {Object} existing - 现有命令
   * @param {Object} newCommand - 新命令
   * @returns {boolean} - 是否成功解决
   */
  _resolveConflict(name, existing, newCommand) {
    const strategy = this.config.conflictStrategy;

    switch (strategy) {
      case ConflictStrategy.LATEST:
        // 使用最新的命令
        this.commands.set(name, newCommand);
        logger.info(`冲突已解决（使用最新）: ${name}`);
        return true;

      case ConflictStrategy.OMC_PRIORITY:
        // OMC 优先
        if (newCommand.system === CommandSystem.OMC) {
          this.commands.set(name, newCommand);
          logger.info(`冲突已解决（OMC 优先）: ${name}`);
          return true;
        }
        return false;

      case ConflictStrategy.AXIOM_PRIORITY:
        // Axiom 优先
        if (newCommand.system === CommandSystem.AXIOM) {
          this.commands.set(name, newCommand);
          logger.info(`冲突已解决（Axiom 优先）: ${name}`);
          return true;
        }
        return false;

      case ConflictStrategy.MANUAL:
        // 手动解决，抛出事件让外部处理
        this.emit('conflictRequiresManualResolution', {
          name,
          existing,
          new: newCommand
        });
        return false;

      default:
        logger.warn(`未知的冲突解决策略: ${strategy}`);
        return false;
    }
  }

  /**
   * 验证命令参数
   * @private
   * @param {Object} command - 命令信息
   * @param {Array} args - 参数
   */
  _validateArgs(command, args) {
    if (!command.validation) {
      return;
    }

    const result = command.validation(args);
    if (!result.valid) {
      throw new Error(`参数验证失败: ${result.error}`);
    }
  }

  /**
   * 检查命令权限
   * @private
   * @param {Object} command - 命令信息
   * @param {Object} context - 执行上下文
   */
  _checkPermissions(command, context) {
    const userPermissions = context.permissions || [];

    const hasPermission = command.permissions.every(required =>
      userPermissions.includes(required)
    );

    if (!hasPermission) {
      throw new Error(`权限不足，需要: ${command.permissions.join(', ')}`);
    }
  }

  /**
   * 记录命令历史
   * @private
   * @param {Object} record - 历史记录
   */
  _recordHistory(record) {
    this.history.push({
      ...record,
      status: 'executing'
    });

    // 保持历史记录在限制内
    if (this.history.length > this.config.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * 更新历史记录
   * @private
   * @param {string} executionId - 执行 ID
   * @param {Object} updates - 更新内容
   */
  _updateHistory(executionId, updates) {
    const record = this.history.find(h => h.id === executionId);
    if (record) {
      Object.assign(record, updates);
    }
  }
}

/**
 * 创建命令路由器
 * @param {Object} config - 配置选项
 * @returns {CommandRouter} - 路由器实例
 */
export function createCommandRouter(config) {
  return new CommandRouter(config);
}

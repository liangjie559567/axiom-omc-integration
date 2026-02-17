/**
 * CommandSystem - 命令系统
 *
 * 提供命令注册、管理和执行功能，支持：
 * - 命令注册和注销
 * - 命令别名
 * - 命令分组
 * - 命令执行
 * - 命令查找
 */

import { Logger } from './logger.js';
import { commandParser } from './CommandParser.js';

const logger = new Logger('CommandSystem');

/**
 * 命令类
 */
export class Command {
  constructor(definition) {
    this.name = definition.name;
    this.description = definition.description || '';
    this.aliases = definition.aliases || [];
    this.execute = definition.execute;
    this.options = definition.options || {};
    this.group = definition.group || 'general';
    this.hidden = definition.hidden || false;
  }

  /**
   * 执行命令
   */
  async run(parsed, context = {}) {
    if (!this.execute || typeof this.execute !== 'function') {
      throw new Error(`命令 ${this.name} 没有 execute 函数`);
    }

    return await this.execute(parsed, context);
  }
}

/**
 * 命令系统
 */
export class CommandSystem {
  constructor() {
    // 命令注册表：name -> Command
    this.commands = new Map();

    // 别名映射：alias -> name
    this.aliases = new Map();

    // 命令分组：group -> [commands]
    this.groups = new Map();

    // 命令解析器
    this.parser = commandParser;

    // 统计信息
    this.stats = {
      registered: 0,
      executed: 0,
      failed: 0
    };

    logger.info('命令系统已初始化');
  }

  /**
   * 注册命令
   *
   * @param {Object} definition - 命令定义
   * @returns {Command} 命令实例
   */
  registerCommand(definition) {
    if (!definition.name) {
      throw new Error('命令必须有名称');
    }

    if (this.commands.has(definition.name)) {
      logger.warn(`命令已存在，将被覆盖: ${definition.name}`);
    }

    const command = new Command(definition);

    // 注册命令
    this.commands.set(command.name, command);

    // 注册别名
    for (const alias of command.aliases) {
      if (this.aliases.has(alias)) {
        logger.warn(`别名已存在，将被覆盖: ${alias}`);
      }
      this.aliases.set(alias, command.name);
    }

    // 添加到分组
    if (!this.groups.has(command.group)) {
      this.groups.set(command.group, []);
    }
    this.groups.get(command.group).push(command);

    this.stats.registered++;

    logger.info(`已注册命令: ${command.name}`, {
      aliases: command.aliases,
      group: command.group
    });

    return command;
  }

  /**
   * 注销命令
   *
   * @param {string} name - 命令名称
   * @returns {boolean} 是否成功
   */
  unregisterCommand(name) {
    const command = this.commands.get(name);
    if (!command) {
      return false;
    }

    // 移除命令
    this.commands.delete(name);

    // 移除别名
    for (const alias of command.aliases) {
      this.aliases.delete(alias);
    }

    // 从分组移除
    const group = this.groups.get(command.group);
    if (group) {
      const index = group.indexOf(command);
      if (index !== -1) {
        group.splice(index, 1);
      }
    }

    logger.info(`已注销命令: ${name}`);

    return true;
  }

  /**
   * 查找命令
   *
   * @param {string} nameOrAlias - 命令名称或别名
   * @returns {Command|null} 命令实例
   */
  findCommand(nameOrAlias) {
    // 直接查找
    if (this.commands.has(nameOrAlias)) {
      return this.commands.get(nameOrAlias);
    }

    // 通过别名查找
    if (this.aliases.has(nameOrAlias)) {
      const name = this.aliases.get(nameOrAlias);
      return this.commands.get(name);
    }

    return null;
  }

  /**
   * 执行命令
   *
   * @param {string} input - 命令字符串
   * @param {Object} context - 执行上下文
   * @returns {Promise<Object>} 执行结果
   */
  async executeCommand(input, context = {}) {
    try {
      // 解析命令
      const parsed = this.parser.parse(input);

      if (!parsed.command) {
        return {
          success: false,
          error: '无效的命令'
        };
      }

      // 查找命令
      const command = this.findCommand(parsed.command);

      if (!command) {
        return {
          success: false,
          error: `未知命令: ${parsed.command}`
        };
      }

      logger.info(`执行命令: ${parsed.command}`, {
        args: parsed.args,
        flags: parsed.flags
      });

      // 执行命令
      const result = await command.run(parsed, context);

      this.stats.executed++;

      return {
        success: true,
        result,
        command: command.name
      };
    } catch (error) {
      this.stats.failed++;

      logger.error(`命令执行失败: ${error.message}`, {
        input,
        error: error.stack
      });

      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * 获取所有命令
   *
   * @param {Object} options - 选项
   * @returns {Array<Command>} 命令数组
   */
  getAllCommands(options = {}) {
    const { includeHidden = false, group = null } = options;

    let commands = Array.from(this.commands.values());

    // 过滤隐藏命令
    if (!includeHidden) {
      commands = commands.filter(cmd => !cmd.hidden);
    }

    // 按分组过滤
    if (group) {
      commands = commands.filter(cmd => cmd.group === group);
    }

    return commands;
  }

  /**
   * 获取命令分组
   *
   * @returns {Array<string>} 分组名称数组
   */
  getGroups() {
    return Array.from(this.groups.keys());
  }

  /**
   * 获取分组中的命令
   *
   * @param {string} group - 分组名称
   * @returns {Array<Command>} 命令数组
   */
  getCommandsByGroup(group) {
    return this.groups.get(group) || [];
  }

  /**
   * 搜索命令
   *
   * @param {string} query - 搜索查询
   * @returns {Array<Command>} 匹配的命令
   */
  searchCommands(query) {
    const lowerQuery = query.toLowerCase();

    return this.getAllCommands().filter(cmd => {
      // 匹配名称
      if (cmd.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // 匹配别名
      if (cmd.aliases.some(alias => alias.toLowerCase().includes(lowerQuery))) {
        return true;
      }

      // 匹配描述
      if (cmd.description.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      return false;
    });
  }

  /**
   * 获取命令帮助
   *
   * @param {string} name - 命令名称
   * @returns {Object|null} 帮助信息
   */
  getCommandHelp(name) {
    const command = this.findCommand(name);

    if (!command) {
      return null;
    }

    return {
      name: command.name,
      description: command.description,
      aliases: command.aliases,
      group: command.group,
      usage: command.options.usage || `${command.name} [options]`,
      examples: command.options.examples || []
    };
  }

  /**
   * 获取统计信息
   *
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      commands: this.commands.size,
      aliases: this.aliases.size,
      groups: this.groups.size
    };
  }

  /**
   * 清除所有命令
   */
  clear() {
    this.commands.clear();
    this.aliases.clear();
    this.groups.clear();
    this.stats = {
      registered: 0,
      executed: 0,
      failed: 0
    };

    logger.info('已清除所有命令');
  }

  /**
   * 批量注册命令
   *
   * @param {Array<Object>} definitions - 命令定义数组
   * @returns {Array<Command>} 命令实例数组
   */
  registerCommands(definitions) {
    return definitions.map(def => this.registerCommand(def));
  }

  /**
   * 检查命令是否存在
   *
   * @param {string} nameOrAlias - 命令名称或别名
   * @returns {boolean} 是否存在
   */
  hasCommand(nameOrAlias) {
    return this.findCommand(nameOrAlias) !== null;
  }

  /**
   * 获取命令建议（用于自动补全）
   *
   * @param {string} partial - 部分命令名称
   * @returns {Array<string>} 建议列表
   */
  getSuggestions(partial) {
    const lowerPartial = partial.toLowerCase();
    const suggestions = [];

    // 匹配命令名称
    for (const name of this.commands.keys()) {
      if (name.toLowerCase().startsWith(lowerPartial)) {
        suggestions.push(name);
      }
    }

    // 匹配别名
    for (const alias of this.aliases.keys()) {
      if (alias.toLowerCase().startsWith(lowerPartial)) {
        suggestions.push(alias);
      }
    }

    return suggestions.sort();
  }
}

// 导出单例
export const commandSystem = new CommandSystem();

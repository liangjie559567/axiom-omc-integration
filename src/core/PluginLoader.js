/**
 * PluginLoader - 插件加载器
 *
 * 提供动态加载命令插件的功能，支持：
 * - 从目录加载命令
 * - 从单个文件加载命令
 * - 递归扫描子目录
 * - 错误隔离（单个插件失败不影响其他）
 */

import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { pathToFileURL } from 'url';
import { Logger } from './logger.js';

const logger = new Logger('PluginLoader');

/**
 * 插件加载器
 */
export class PluginLoader {
  constructor(commandSystem) {
    this.commandSystem = commandSystem;

    // 已加载的插件
    this.loadedPlugins = new Map();

    // 统计信息
    this.stats = {
      loaded: 0,
      failed: 0
    };

    logger.info('插件加载器已初始化');
  }

  /**
   * 从文件加载插件
   *
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 加载结果
   */
  async loadPlugin(filePath) {
    try {
      logger.info(`加载插件: ${filePath}`);

      // 转换为 file:// URL（ES 模块需要）
      const fileUrl = pathToFileURL(filePath).href;

      // 动态导入
      const module = await import(fileUrl);

      // 检查导出
      if (!module.default && !module.command && !module.commands) {
        throw new Error('插件必须导出 default、command 或 commands');
      }

      // 获取命令定义
      let commands = [];

      if (module.default) {
        commands = Array.isArray(module.default) ? module.default : [module.default];
      } else if (module.commands) {
        commands = Array.isArray(module.commands) ? module.commands : [module.commands];
      } else if (module.command) {
        commands = [module.command];
      }

      // 注册命令
      const registered = [];
      for (const commandDef of commands) {
        try {
          const command = this.commandSystem.registerCommand(commandDef);
          registered.push(command);
        } catch (error) {
          logger.error(`注册命令失败: ${error.message}`, {
            file: filePath,
            command: commandDef.name
          });
        }
      }

      // 记录已加载的插件
      this.loadedPlugins.set(filePath, {
        path: filePath,
        commands: registered.map(cmd => cmd.name),
        loadedAt: Date.now()
      });

      this.stats.loaded++;

      logger.info(`插件加载成功: ${filePath}`, {
        commands: registered.map(cmd => cmd.name)
      });

      return {
        success: true,
        path: filePath,
        commands: registered
      };
    } catch (error) {
      this.stats.failed++;

      logger.error(`插件加载失败: ${filePath}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        path: filePath,
        error: error.message
      };
    }
  }

  /**
   * 从目录加载所有插件
   *
   * @param {string} directory - 目录路径
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 加载结果
   */
  async loadDirectory(directory, options = {}) {
    const {
      recursive = true,
      pattern = /\.js$/,
      exclude = []
    } = options;

    logger.info(`扫描目录: ${directory}`, { recursive });

    const results = {
      success: true,
      loaded: [],
      failed: [],
      total: 0
    };

    try {
      const files = await this.scanDirectory(directory, {
        recursive,
        pattern,
        exclude
      });

      results.total = files.length;

      logger.info(`找到 ${files.length} 个插件文件`);

      // 加载所有文件
      for (const file of files) {
        const result = await this.loadPlugin(file);

        if (result.success) {
          results.loaded.push(result);
        } else {
          results.failed.push(result);
        }
      }

      logger.info(`目录加载完成: ${directory}`, {
        loaded: results.loaded.length,
        failed: results.failed.length
      });
    } catch (error) {
      results.success = false;
      results.error = error.message;

      logger.error(`目录加载失败: ${directory}`, {
        error: error.message
      });
    }

    return results;
  }

  /**
   * 扫描目录
   *
   * @param {string} directory - 目录路径
   * @param {Object} options - 选项
   * @returns {Promise<Array<string>>} 文件路径数组
   */
  async scanDirectory(directory, options = {}) {
    const {
      recursive = true,
      pattern = /\.js$/,
      exclude = []
    } = options;

    const files = [];

    try {
      const entries = await readdir(directory);

      for (const entry of entries) {
        const fullPath = join(directory, entry);

        // 检查排除列表
        if (exclude.some(ex => fullPath.includes(ex))) {
          continue;
        }

        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          if (recursive) {
            const subFiles = await this.scanDirectory(fullPath, options);
            files.push(...subFiles);
          }
        } else if (stats.isFile()) {
          // 检查文件扩展名
          if (pattern.test(entry)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      logger.error(`扫描目录失败: ${directory}`, {
        error: error.message
      });
    }

    return files;
  }

  /**
   * 重新加载插件
   *
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 加载结果
   */
  async reloadPlugin(filePath) {
    logger.info(`重新加载插件: ${filePath}`);

    // 获取旧的命令
    const oldPlugin = this.loadedPlugins.get(filePath);

    if (oldPlugin) {
      // 注销旧命令
      for (const commandName of oldPlugin.commands) {
        this.commandSystem.unregisterCommand(commandName);
      }
    }

    // 移除缓存（强制重新加载）
    const fileUrl = pathToFileURL(filePath).href;
    delete require.cache[fileUrl];

    // 重新加载
    return await this.loadPlugin(filePath);
  }

  /**
   * 卸载插件
   *
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否成功
   */
  unloadPlugin(filePath) {
    const plugin = this.loadedPlugins.get(filePath);

    if (!plugin) {
      return false;
    }

    // 注销所有命令
    for (const commandName of plugin.commands) {
      this.commandSystem.unregisterCommand(commandName);
    }

    // 移除记录
    this.loadedPlugins.delete(filePath);

    logger.info(`插件已卸载: ${filePath}`);

    return true;
  }

  /**
   * 获取已加载的插件
   *
   * @returns {Array<Object>} 插件信息数组
   */
  getLoadedPlugins() {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * 获取统计信息
   *
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      plugins: this.loadedPlugins.size
    };
  }

  /**
   * 清除所有插件
   */
  clear() {
    // 卸载所有插件
    for (const filePath of this.loadedPlugins.keys()) {
      this.unloadPlugin(filePath);
    }

    this.stats = {
      loaded: 0,
      failed: 0
    };

    logger.info('已清除所有插件');
  }

  /**
   * 验证插件定义
   *
   * @param {Object} definition - 命令定义
   * @returns {Object} 验证结果
   */
  validatePlugin(definition) {
    const errors = [];

    if (!definition.name) {
      errors.push('缺少命令名称');
    }

    if (!definition.execute || typeof definition.execute !== 'function') {
      errors.push('缺少 execute 函数');
    }

    if (definition.aliases && !Array.isArray(definition.aliases)) {
      errors.push('aliases 必须是数组');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 批量加载插件
   *
   * @param {Array<string>} filePaths - 文件路径数组
   * @returns {Promise<Object>} 加载结果
   */
  async loadPlugins(filePaths) {
    const results = {
      loaded: [],
      failed: [],
      total: filePaths.length
    };

    for (const filePath of filePaths) {
      const result = await this.loadPlugin(filePath);

      if (result.success) {
        results.loaded.push(result);
      } else {
        results.failed.push(result);
      }
    }

    return results;
  }
}

// 导出工厂函数
export function createPluginLoader(commandSystem) {
  return new PluginLoader(commandSystem);
}

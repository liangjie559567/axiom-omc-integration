/**
 * 配置管理系统
 *
 * 功能：
 * - 支持 JSON、YAML 配置文件
 * - 环境变量覆盖
 * - 配置验证
 * - 默认配置合并
 * - 配置持久化
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from './logger.js';
import { deepMerge } from '../utils/index.js';

const logger = new Logger('ConfigManager');

/**
 * 配置管理器类
 */
export class ConfigManager {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {string} options.configPath - 配置文件目录路径
   * @param {Object} options.defaults - 默认配置
   * @param {Object} options.schema - 配置验证模式
   * @param {boolean} options.useEnv - 是否使用环境变量覆盖
   */
  constructor(options = {}) {
    this.configPath = options.configPath || path.join(process.cwd(), 'config');
    this.defaults = options.defaults || {};
    this.schema = options.schema || null;
    this.useEnv = options.useEnv !== false;
    this.config = {};
    this.loaded = false;
  }

  /**
   * 加载所有配置文件
   * @returns {Promise<Object>} 加载的配置对象
   */
  async load() {
    try {
      // 从默认配置开始
      this.config = { ...this.defaults };

      // 检查配置目录是否存在
      try {
        await fs.access(this.configPath);
      } catch {
        logger.warn(`配置目录不存在: ${this.configPath}`);
        this.loaded = true;
        return this.config;
      }

      // 读取配置目录中的所有文件
      const files = await fs.readdir(this.configPath);

      for (const file of files) {
        if (file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(this.configPath, file);
          const data = await this._loadFile(filePath);

          if (data) {
            const key = file.replace(/\.(json|yaml|yml)$/, '');
            this.config[key] = deepMerge(this.config[key] || {}, data);
          }
        }
      }

      // 应用环境变量覆盖
      if (this.useEnv) {
        this._applyEnvOverrides();
      }

      // 验证配置
      if (this.schema) {
        this._validate();
      }

      this.loaded = true;
      logger.success('配置加载完成');
      return this.config;

    } catch (error) {
      logger.error('配置加载失败:', error.message);
      throw error;
    }
  }

  /**
   * 加载单个配置文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object|null>} 配置数据
   * @private
   */
  async _loadFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      if (filePath.endsWith('.json')) {
        return JSON.parse(content);
      } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        // 简单的 YAML 解析（仅支持基本格式）
        // 生产环境应使用 js-yaml 库
        logger.warn('YAML 支持有限，建议使用 JSON 格式');
        return JSON.parse(content); // 临时方案
      }

      return null;
    } catch (error) {
      logger.error(`加载配置文件失败: ${filePath}`, error.message);
      return null;
    }
  }

  /**
   * 应用环境变量覆盖
   * 环境变量格式: APP_CONFIG_KEY1_KEY2=value
   * @private
   */
  _applyEnvOverrides() {
    const prefix = 'APP_CONFIG_';

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix)) {
        const configKey = key
          .substring(prefix.length)
          .toLowerCase()
          .replace(/_/g, '.');

        // 尝试解析 JSON 值
        let parsedValue = value;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          // 保持字符串值
        }

        this.set(configKey, parsedValue);
        logger.debug(`环境变量覆盖: ${configKey} = ${parsedValue}`);
      }
    }
  }

  /**
   * 验证配置
   * @private
   */
  _validate() {
    if (!this.schema) {
      return;
    }

    // 简单的验证逻辑
    for (const [key, rules] of Object.entries(this.schema)) {
      const value = this.get(key);

      if (rules.required && value === null) {
        throw new Error(`配置项 ${key} 是必需的`);
      }

      if (rules.type && value !== null) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          throw new Error(`配置项 ${key} 类型错误: 期望 ${rules.type}, 实际 ${actualType}`);
        }
      }

      if (rules.enum && !rules.enum.includes(value)) {
        throw new Error(`配置项 ${key} 值无效: ${value}, 允许值: ${rules.enum.join(', ')}`);
      }
    }

    logger.debug('配置验证通过');
  }

  /**
   * 获取配置值
   * @param {string} key - 配置键（支持点号分隔的路径）
   * @param {*} defaultValue - 默认值
   * @returns {*} 配置值
   */
  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * 设置配置值
   * @param {string} key - 配置键（支持点号分隔的路径）
   * @param {*} value - 配置值
   */
  set(key, value) {
    const keys = key.split('.');
    let obj = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) {
        obj[keys[i]] = {};
      }
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
  }

  /**
   * 检查配置键是否存在
   * @param {string} key - 配置键
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * 删除配置键
   * @param {string} key - 配置键
   * @returns {boolean} 是否成功删除
   */
  delete(key) {
    const keys = key.split('.');
    let obj = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj?.[keys[i]];
      if (!obj) {
        return false;
      }
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey in obj) {
      delete obj[lastKey];
      return true;
    }

    return false;
  }

  /**
   * 获取所有配置
   * @returns {Object} 配置对象
   */
  getAll() {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * 合并配置
   * @param {Object} newConfig - 新配置对象
   */
  merge(newConfig) {
    this.config = deepMerge(this.config, newConfig);
  }

  /**
   * 重置配置为默认值
   */
  reset() {
    this.config = { ...this.defaults };
    this.loaded = false;
  }

  /**
   * 保存配置到文件
   * @param {string} filename - 文件名（可选，默认为 'runtime.json'）
   * @returns {Promise<void>}
   */
  async save(filename = 'runtime.json') {
    try {
      const filePath = path.join(this.configPath, filename);

      // 确保目录存在
      await fs.mkdir(this.configPath, { recursive: true });

      // 写入配置
      await fs.writeFile(
        filePath,
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );

      logger.success(`配置已保存: ${filePath}`);
    } catch (error) {
      logger.error('保存配置失败:', error.message);
      throw error;
    }
  }

  /**
   * 从文件加载配置
   * @param {string} filename - 文件名
   * @returns {Promise<Object>} 加载的配置
   */
  async loadFile(filename) {
    const filePath = path.join(this.configPath, filename);
    const data = await this._loadFile(filePath);

    if (data) {
      this.merge(data);
    }

    return data;
  }

  /**
   * 获取配置统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const countKeys = (obj, prefix = '') => {
      let count = 0;
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          count += countKeys(value, fullKey);
        } else {
          count++;
        }
      }
      return count;
    };

    return {
      loaded: this.loaded,
      totalKeys: countKeys(this.config),
      topLevelKeys: Object.keys(this.config).length,
      configPath: this.configPath,
      useEnv: this.useEnv,
      hasSchema: this.schema !== null
    };
  }
}

/**
 * 创建配置管理器实例
 * @param {Object} options - 配置选项
 * @returns {ConfigManager} 配置管理器实例
 */
export function createConfigManager(options = {}) {
  return new ConfigManager(options);
}

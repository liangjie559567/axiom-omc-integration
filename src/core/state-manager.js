/**
 * 状态管理器
 * 事件驱动的状态管理系统，支持历史追踪、持久化和状态订阅
 */

import { EventEmitter } from 'events';
import { Logger } from './logger.js';
import fs from 'fs/promises';
import path from 'path';

const logger = new Logger('StateManager');

/**
 * 状态管理器类
 */
export class StateManager extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {string} options.persistPath - 持久化路径
   * @param {boolean} options.enableHistory - 是否启用历史追踪（默认 true）
   * @param {number} options.maxHistorySize - 最大历史记录数（默认 100）
   */
  constructor(options = {}) {
    super();
    this.state = {};
    this.history = [];
    this.persistPath = options.persistPath || '.agent/state/state.json';
    this.enableHistory = options.enableHistory !== false;
    this.maxHistorySize = options.maxHistorySize || 100;
    this.subscribers = new Map();

    logger.info('状态管理器已初始化');
  }

  /**
   * 设置状态
   * @param {string} key - 状态键
   * @param {any} value - 状态值
   * @param {Object} options - 选项
   * @param {boolean} options.silent - 是否静默（不触发事件）
   * @param {Object} options.metadata - 元数据
   * @returns {StateManager} - 返回自身以支持链式调用
   */
  setState(key, value, options = {}) {
    const { silent = false, metadata = {} } = options;
    const oldValue = this.state[key];

    // 更新状态
    this.state[key] = value;

    // 记录历史
    if (this.enableHistory) {
      const change = {
        key,
        oldValue,
        newValue: value,
        metadata,
        timestamp: new Date().toISOString()
      };

      this.history.push(change);

      // 限制历史记录大小
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }
    }

    // 触发事件
    if (!silent) {
      this.emit('stateChange', { key, oldValue, newValue: value, metadata });
      this.emit(`stateChange:${key}`, { oldValue, newValue: value, metadata });

      // 通知订阅者
      this._notifySubscribers(key, value, oldValue);
    }

    logger.debug(`状态已更新: ${key}`, { oldValue, newValue: value });

    return this;
  }

  /**
   * 获取状态
   * @param {string} key - 状态键
   * @param {any} defaultValue - 默认值
   * @returns {any} - 状态值
   */
  getState(key, defaultValue = undefined) {
    return this.state.hasOwnProperty(key) ? this.state[key] : defaultValue;
  }

  /**
   * 获取所有状态
   * @returns {Object} - 所有状态
   */
  getAllState() {
    return { ...this.state };
  }

  /**
   * 删除状态
   * @param {string} key - 状态键
   * @param {Object} options - 选项
   * @param {boolean} options.silent - 是否静默
   * @returns {boolean} - 是否成功
   */
  deleteState(key, options = {}) {
    const { silent = false } = options;

    if (!this.state.hasOwnProperty(key)) {
      logger.warn(`状态不存在: ${key}`);
      return false;
    }

    const oldValue = this.state[key];
    delete this.state[key];

    // 记录历史
    if (this.enableHistory) {
      this.history.push({
        key,
        oldValue,
        newValue: undefined,
        action: 'delete',
        timestamp: new Date().toISOString()
      });
    }

    // 触发事件
    if (!silent) {
      this.emit('stateDeleted', { key, oldValue });
      this.emit(`stateDeleted:${key}`, { oldValue });

      // 通知订阅者
      this._notifySubscribers(key, undefined, oldValue);
    }

    logger.debug(`状态已删除: ${key}`);

    return true;
  }

  /**
   * 检查状态是否存在
   * @param {string} key - 状态键
   * @returns {boolean} - 是否存在
   */
  hasState(key) {
    return this.state.hasOwnProperty(key);
  }

  /**
   * 批量设置状态
   * @param {Object} states - 状态对象
   * @param {Object} options - 选项
   * @returns {StateManager} - 返回自身
   */
  setStates(states, options = {}) {
    for (const [key, value] of Object.entries(states)) {
      this.setState(key, value, options);
    }

    return this;
  }

  /**
   * 订阅状态变化
   * @param {string} key - 状态键
   * @param {Function} callback - 回调函数
   * @returns {Function} - 取消订阅函数
   */
  subscribe(key, callback) {
    if (typeof callback !== 'function') {
      throw new Error('回调函数必须是一个函数');
    }

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key).add(callback);
    logger.debug(`已订阅状态: ${key}`);

    // 返回取消订阅函数
    return () => {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        subscribers.delete(callback);
        logger.debug(`已取消订阅状态: ${key}`);
      }
    };
  }

  /**
   * 通知订阅者
   * @param {string} key - 状态键
   * @param {any} newValue - 新值
   * @param {any} oldValue - 旧值
   * @private
   */
  _notifySubscribers(key, newValue, oldValue) {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      for (const callback of subscribers) {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          logger.error(`订阅者回调执行失败: ${key}`, error.message);
        }
      }
    }
  }

  /**
   * 获取历史记录
   * @param {string} key - 状态键（可选）
   * @param {number} limit - 限制数量
   * @returns {Array<Object>} - 历史记录
   */
  getHistory(key = null, limit = 10) {
    let history = this.history;

    if (key) {
      history = history.filter(h => h.key === key);
    }

    return history.slice(-limit);
  }

  /**
   * 清空历史记录
   */
  clearHistory() {
    this.history = [];
    logger.debug('历史记录已清空');
  }

  /**
   * 重置状态
   * @param {Object} options - 选项
   * @param {boolean} options.silent - 是否静默
   */
  reset(options = {}) {
    const { silent = false } = options;
    const oldState = { ...this.state };

    this.state = {};
    this.history = [];

    if (!silent) {
      this.emit('stateReset', { oldState });
    }

    logger.info('状态已重置');
  }

  /**
   * 保存状态到文件
   * @returns {Promise<boolean>} - 是否成功
   */
  async save() {
    try {
      // 确保目录存在
      await fs.mkdir(path.dirname(this.persistPath), { recursive: true });

      // 保存状态
      const data = {
        state: this.state,
        history: this.enableHistory ? this.history : [],
        savedAt: new Date().toISOString()
      };

      await fs.writeFile(
        this.persistPath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );

      logger.success(`状态已保存: ${this.persistPath}`);
      this.emit('stateSaved', { path: this.persistPath });

      return true;

    } catch (error) {
      logger.error('保存状态失败', error.message);
      this.emit('stateSaveFailed', { error });
      return false;
    }
  }

  /**
   * 从文件加载状态
   * @returns {Promise<boolean>} - 是否成功
   */
  async load() {
    try {
      const content = await fs.readFile(this.persistPath, 'utf-8');
      const data = JSON.parse(content);

      this.state = data.state || {};
      this.history = data.history || [];

      logger.success(`状态已加载: ${Object.keys(this.state).length} 个键`);
      this.emit('stateLoaded', { state: this.state });

      return true;

    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn('状态文件不存在，使用空状态');
      } else {
        logger.error('加载状态失败', error.message);
      }

      this.emit('stateLoadFailed', { error });
      return false;
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      stateKeys: Object.keys(this.state).length,
      historySize: this.history.length,
      subscribers: Array.from(this.subscribers.entries()).map(([key, subs]) => ({
        key,
        count: subs.size
      })),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
    };
  }

  /**
   * 创建快照
   * @returns {Object} - 状态快照
   */
  createSnapshot() {
    return {
      state: { ...this.state },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 恢复快照
   * @param {Object} snapshot - 状态快照
   * @param {Object} options - 选项
   */
  restoreSnapshot(snapshot, options = {}) {
    const { silent = false } = options;

    if (!snapshot || !snapshot.state) {
      throw new Error('无效的快照');
    }

    const oldState = { ...this.state };
    this.state = { ...snapshot.state };

    if (!silent) {
      this.emit('snapshotRestored', { oldState, newState: this.state });
    }

    logger.info('快照已恢复', { timestamp: snapshot.timestamp });
  }
}

/**
 * 创建状态管理器实例
 * @param {Object} options - 配置选项
 * @returns {StateManager} - 状态管理器实例
 */
export function createStateManager(options = {}) {
  return new StateManager(options);
}

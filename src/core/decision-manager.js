/**
 * 决策记录管理器
 * 管理项目决策、用户偏好和活动上下文
 */

import { EventEmitter } from 'events';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { Logger } from './logger.js';
import { generateId } from '../utils/index.js';

const logger = new Logger('DecisionManager');

/**
 * 决策类型枚举
 */
export const DecisionType = {
  ARCHITECTURE: 'architecture',
  TECHNICAL: 'technical',
  DESIGN: 'design',
  PROCESS: 'process',
  BUSINESS: 'business'
};

/**
 * 决策状态枚举
 */
export const DecisionStatus = {
  PROPOSED: 'proposed',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  DEPRECATED: 'deprecated',
  SUPERSEDED: 'superseded'
};

/**
 * 决策记录管理器类
 */
export class DecisionManager extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} config - 配置选项
   */
  constructor(config = {}) {
    super();

    this.config = {
      storageDir: config.storageDir || '.omc/memory',
      decisionsFile: config.decisionsFile || 'decisions.json',
      preferencesFile: config.preferencesFile || 'preferences.json',
      contextFile: config.contextFile || 'context.json',
      autoSave: config.autoSave !== false,
      maxDecisions: config.maxDecisions || 1000,
      ...config
    };

    // 决策记录
    this.decisions = new Map();

    // 用户偏好
    this.preferences = new Map();

    // 活动上下文
    this.context = {
      currentPhase: null,
      activeFiles: [],
      recentCommands: [],
      workingDirectory: null,
      metadata: {}
    };

    // 统计信息
    this.stats = {
      totalDecisions: 0,
      acceptedDecisions: 0,
      rejectedDecisions: 0,
      deprecatedDecisions: 0
    };

    logger.info('决策记录管理器已初始化', {
      storageDir: this.config.storageDir
    });
  }

  /**
   * 初始化（加载数据）
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // 确保存储目录存在
      const storageDir = this.config.storageDir;
      if (!existsSync(storageDir)) {
        await mkdir(storageDir, { recursive: true });
      }

      // 加载决策记录
      await this._loadDecisions();

      // 加载用户偏好
      await this._loadPreferences();

      // 加载活动上下文
      await this._loadContext();

      logger.info('决策记录管理器初始化完成', {
        decisions: this.decisions.size,
        preferences: this.preferences.size
      });

      this.emit('initialized');
    } catch (error) {
      logger.error('初始化失败', error);
      throw error;
    }
  }

  /**
   * 添加决策记录
   * @param {Object} decision - 决策信息
   * @returns {string} - 决策 ID
   */
  addDecision(decision) {
    const id = decision.id || generateId();

    const record = {
      id,
      timestamp: decision.timestamp || Date.now(),
      type: decision.type || DecisionType.TECHNICAL,
      status: decision.status || DecisionStatus.PROPOSED,
      title: decision.title,
      context: decision.context || '',
      decision: decision.decision,
      rationale: decision.rationale || '',
      alternatives: decision.alternatives || [],
      consequences: decision.consequences || [],
      tags: decision.tags || [],
      relatedDecisions: decision.relatedDecisions || [],
      metadata: decision.metadata || {}
    };

    this.decisions.set(id, record);
    this.stats.totalDecisions++;

    if (record.status === DecisionStatus.ACCEPTED) {
      this.stats.acceptedDecisions++;
    }

    logger.info(`决策已添加: ${id}`, {
      title: record.title,
      type: record.type
    });

    this.emit('decisionAdded', record);

    if (this.config.autoSave) {
      this._saveDecisions().catch(err => {
        logger.error('自动保存失败', err);
      });
    }

    return id;
  }

  /**
   * 更新决策记录
   * @param {string} id - 决策 ID
   * @param {Object} updates - 更新内容
   * @returns {boolean} - 是否成功
   */
  updateDecision(id, updates) {
    const decision = this.decisions.get(id);
    if (!decision) {
      return false;
    }

    const oldStatus = decision.status;

    Object.assign(decision, updates);
    decision.updatedAt = Date.now();

    // 更新统计
    if (oldStatus !== decision.status) {
      if (oldStatus === DecisionStatus.ACCEPTED) {
        this.stats.acceptedDecisions--;
      }
      if (decision.status === DecisionStatus.ACCEPTED) {
        this.stats.acceptedDecisions++;
      }
      if (decision.status === DecisionStatus.REJECTED) {
        this.stats.rejectedDecisions++;
      }
      if (decision.status === DecisionStatus.DEPRECATED) {
        this.stats.deprecatedDecisions++;
      }
    }

    logger.info(`决策已更新: ${id}`);

    this.emit('decisionUpdated', decision);

    if (this.config.autoSave) {
      this._saveDecisions().catch(err => {
        logger.error('自动保存失败', err);
      });
    }

    return true;
  }

  /**
   * 删除决策记录
   * @param {string} id - 决策 ID
   * @returns {boolean} - 是否成功
   */
  deleteDecision(id) {
    const decision = this.decisions.get(id);
    if (!decision) {
      return false;
    }

    this.decisions.delete(id);
    this.stats.totalDecisions--;

    if (decision.status === DecisionStatus.ACCEPTED) {
      this.stats.acceptedDecisions--;
    }

    logger.info(`决策已删除: ${id}`);

    this.emit('decisionDeleted', { id });

    if (this.config.autoSave) {
      this._saveDecisions().catch(err => {
        logger.error('自动保存失败', err);
      });
    }

    return true;
  }

  /**
   * 获取决策记录
   * @param {string} id - 决策 ID
   * @returns {Object|null} - 决策记录
   */
  getDecision(id) {
    return this.decisions.get(id) || null;
  }

  /**
   * 查询决策记录
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 决策列表
   */
  queryDecisions(filters = {}) {
    let decisions = Array.from(this.decisions.values());

    // 按类型过滤
    if (filters.type) {
      decisions = decisions.filter(d => d.type === filters.type);
    }

    // 按状态过滤
    if (filters.status) {
      decisions = decisions.filter(d => d.status === filters.status);
    }

    // 按标签过滤
    if (filters.tags && filters.tags.length > 0) {
      decisions = decisions.filter(d =>
        filters.tags.some(tag => d.tags.includes(tag))
      );
    }

    // 按时间范围过滤
    if (filters.startTime) {
      decisions = decisions.filter(d => d.timestamp >= filters.startTime);
    }

    if (filters.endTime) {
      decisions = decisions.filter(d => d.timestamp <= filters.endTime);
    }

    // 排序
    if (filters.sortBy === 'timestamp') {
      decisions.sort((a, b) => b.timestamp - a.timestamp);
    } else if (filters.sortBy === 'title') {
      decisions.sort((a, b) => a.title.localeCompare(b.title));
    }

    // 限制数量
    if (filters.limit) {
      decisions = decisions.slice(0, filters.limit);
    }

    return decisions;
  }

  /**
   * 设置用户偏好
   * @param {string} key - 偏好键
   * @param {any} value - 偏好值
   */
  setPreference(key, value) {
    this.preferences.set(key, {
      value,
      updatedAt: Date.now()
    });

    logger.info(`偏好已设置: ${key}`);

    this.emit('preferenceSet', { key, value });

    if (this.config.autoSave) {
      this._savePreferences().catch(err => {
        logger.error('自动保存失败', err);
      });
    }
  }

  /**
   * 获取用户偏好
   * @param {string} key - 偏好键
   * @param {any} defaultValue - 默认值
   * @returns {any} - 偏好值
   */
  getPreference(key, defaultValue = null) {
    const pref = this.preferences.get(key);
    return pref ? pref.value : defaultValue;
  }

  /**
   * 删除用户偏好
   * @param {string} key - 偏好键
   * @returns {boolean} - 是否成功
   */
  deletePreference(key) {
    const deleted = this.preferences.delete(key);

    if (deleted) {
      logger.info(`偏好已删除: ${key}`);
      this.emit('preferenceDeleted', { key });

      if (this.config.autoSave) {
        this._savePreferences().catch(err => {
          logger.error('自动保存失败', err);
        });
      }
    }

    return deleted;
  }

  /**
   * 获取所有偏好
   * @returns {Object} - 偏好对象
   */
  getAllPreferences() {
    const prefs = {};
    for (const [key, pref] of this.preferences) {
      prefs[key] = pref.value;
    }
    return prefs;
  }

  /**
   * 更新活动上下文
   * @param {Object} updates - 更新内容
   */
  updateContext(updates) {
    Object.assign(this.context, updates);
    this.context.updatedAt = Date.now();

    logger.info('上下文已更新');

    this.emit('contextUpdated', this.context);

    if (this.config.autoSave) {
      this._saveContext().catch(err => {
        logger.error('自动保存失败', err);
      });
    }
  }

  /**
   * 获取活动上下文
   * @returns {Object} - 上下文对象
   */
  getContext() {
    return { ...this.context };
  }

  /**
   * 添加活动文件
   * @param {string} filePath - 文件路径
   */
  addActiveFile(filePath) {
    if (!this.context.activeFiles.includes(filePath)) {
      this.context.activeFiles.push(filePath);
      this.updateContext({});
    }
  }

  /**
   * 移除活动文件
   * @param {string} filePath - 文件路径
   */
  removeActiveFile(filePath) {
    const index = this.context.activeFiles.indexOf(filePath);
    if (index > -1) {
      this.context.activeFiles.splice(index, 1);
      this.updateContext({});
    }
  }

  /**
   * 添加最近命令
   * @param {string} command - 命令
   */
  addRecentCommand(command) {
    this.context.recentCommands.unshift(command);

    // 保持最近 20 条
    if (this.context.recentCommands.length > 20) {
      this.context.recentCommands = this.context.recentCommands.slice(0, 20);
    }

    this.updateContext({});
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      acceptanceRate: this.stats.totalDecisions > 0
        ? (this.stats.acceptedDecisions / this.stats.totalDecisions * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * 保存所有数据
   * @returns {Promise<void>}
   */
  async saveAll() {
    await Promise.all([
      this._saveDecisions(),
      this._savePreferences(),
      this._saveContext()
    ]);

    logger.info('所有数据已保存');
  }

  /**
   * 加载决策记录
   * @private
   * @returns {Promise<void>}
   */
  async _loadDecisions() {
    const filePath = join(this.config.storageDir, this.config.decisionsFile);

    if (!existsSync(filePath)) {
      return;
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      this.decisions.clear();
      for (const decision of data.decisions || []) {
        this.decisions.set(decision.id, decision);
      }

      if (data.stats) {
        Object.assign(this.stats, data.stats);
      }

      logger.info(`已加载 ${this.decisions.size} 条决策记录`);
    } catch (error) {
      logger.error('加载决策记录失败', error);
    }
  }

  /**
   * 保存决策记录
   * @private
   * @returns {Promise<void>}
   */
  async _saveDecisions() {
    const filePath = join(this.config.storageDir, this.config.decisionsFile);

    const data = {
      decisions: Array.from(this.decisions.values()),
      stats: this.stats,
      savedAt: Date.now()
    };

    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 加载用户偏好
   * @private
   * @returns {Promise<void>}
   */
  async _loadPreferences() {
    const filePath = join(this.config.storageDir, this.config.preferencesFile);

    if (!existsSync(filePath)) {
      return;
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      this.preferences.clear();
      for (const [key, pref] of Object.entries(data.preferences || {})) {
        this.preferences.set(key, pref);
      }

      logger.info(`已加载 ${this.preferences.size} 条用户偏好`);
    } catch (error) {
      logger.error('加载用户偏好失败', error);
    }
  }

  /**
   * 保存用户偏好
   * @private
   * @returns {Promise<void>}
   */
  async _savePreferences() {
    const filePath = join(this.config.storageDir, this.config.preferencesFile);

    const preferences = {};
    for (const [key, pref] of this.preferences) {
      preferences[key] = pref;
    }

    const data = {
      preferences,
      savedAt: Date.now()
    };

    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 加载活动上下文
   * @private
   * @returns {Promise<void>}
   */
  async _loadContext() {
    const filePath = join(this.config.storageDir, this.config.contextFile);

    if (!existsSync(filePath)) {
      return;
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      Object.assign(this.context, data.context || {});

      logger.info('已加载活动上下文');
    } catch (error) {
      logger.error('加载活动上下文失败', error);
    }
  }

  /**
   * 保存活动上下文
   * @private
   * @returns {Promise<void>}
   */
  async _saveContext() {
    const filePath = join(this.config.storageDir, this.config.contextFile);

    const data = {
      context: this.context,
      savedAt: Date.now()
    };

    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 清理资源
   */
  async destroy() {
    if (this.config.autoSave) {
      await this.saveAll();
    }

    this.decisions.clear();
    this.preferences.clear();
    this.removeAllListeners();

    logger.info('决策记录管理器已销毁');
  }
}

/**
 * 创建决策记录管理器
 * @param {Object} config - 配置选项
 * @returns {DecisionManager} - 管理器实例
 */
export function createDecisionManager(config) {
  return new DecisionManager(config);
}

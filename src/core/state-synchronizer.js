/**
 * 状态同步系统
 * 实现 Axiom 和 OMC 之间的状态同步
 * 支持 Markdown ↔ JSON 双向转换、增量同步、冲突检测和解决
 */

import { EventEmitter } from 'events';
import { readFile, writeFile, stat, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { createHash } from 'crypto';
import { Logger } from './logger.js';

const logger = new Logger('StateSynchronizer');

/**
 * 同步方向枚举
 */
export const SyncDirection = {
  AXIOM_TO_OMC: 'axiom_to_omc',
  OMC_TO_AXIOM: 'omc_to_axiom',
  BIDIRECTIONAL: 'bidirectional'
};

/**
 * 冲突解决策略枚举
 */
export const ConflictResolution = {
  LATEST: 'latest',           // 使用最新的
  OMC_PRIORITY: 'omc_priority',     // OMC 优先
  AXIOM_PRIORITY: 'axiom_priority', // Axiom 优先
  MANUAL: 'manual'            // 手动解决
};

/**
 * 状态同步器类
 */
export class StateSynchronizer extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} config - 配置选项
   */
  constructor(config = {}) {
    super();

    this.config = {
      axiomRoot: config.axiomRoot || '.agent',
      omcRoot: config.omcRoot || '.omc',
      conflictResolution: config.conflictResolution || ConflictResolution.LATEST,
      autoSync: config.autoSync !== false,
      syncInterval: config.syncInterval || 5000, // 5 秒
      enableChecksum: config.enableChecksum !== false,
      maxSyncHistory: config.maxSyncHistory || 100,
      ...config
    };

    // 同步映射表
    this.syncMappings = new Map();

    // 同步历史
    this.syncHistory = [];

    // 文件校验和缓存
    this.checksums = new Map();

    // 统计信息
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflictsDetected: 0,
      conflictsResolved: 0
    };

    // 自动同步定时器
    this.syncTimer = null;

    logger.info('状态同步器已初始化', {
      axiomRoot: this.config.axiomRoot,
      omcRoot: this.config.omcRoot,
      conflictResolution: this.config.conflictResolution
    });
  }

  /**
   * 获取所有映射
   */
  get mappings() {
    return this.syncMappings;
  }

  /**
   * 注册同步映射
   * @param {string} axiomPath - Axiom 文件路径
   * @param {string} omcPath - OMC 文件路径
   * @param {Object} options - 选项
   * @returns {string} - 映射 ID
   */
  registerMapping(axiomPath, omcPath, options = {}) {
    const key = `${axiomPath}:${omcPath}`;

    const mapping = {
      id: key,
      axiomPath: join(this.config.axiomRoot, axiomPath),
      omcPath: join(this.config.omcRoot, omcPath),
      direction: options.direction || SyncDirection.BIDIRECTIONAL,
      format: options.format || 'auto', // auto, markdown, json
      transformer: options.transformer || null,
      enabled: options.enabled !== false
    };

    this.syncMappings.set(key, mapping);

    logger.info(`同步映射已注册: ${key}`, {
      direction: mapping.direction,
      format: mapping.format
    });

    this.emit('mappingRegistered', mapping);

    return key;
  }

  /**
   * 启动自动同步
   */
  startAutoSync() {
    if (this.syncTimer) {
      logger.warn('自动同步已在运行');
      return;
    }

    if (!this.config.autoSync) {
      logger.warn('自动同步未启用');
      return;
    }

    this.syncTimer = setInterval(async () => {
      try {
        await this.syncAll();
      } catch (error) {
        logger.error('自动同步失败', error);
      }
    }, this.config.syncInterval);

    logger.info('自动同步已启动', {
      interval: `${this.config.syncInterval}ms`
    });

    this.emit('autoSyncStarted');
  }

  /**
   * 停止自动同步
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      logger.info('自动同步已停止');
      this.emit('autoSyncStopped');
    }
  }

  /**
   * 同步所有映射
   * @returns {Promise<Object>} - 同步结果
   */
  async syncAll() {
    const results = {
      total: this.syncMappings.size,
      successful: 0,
      failed: 0,
      skipped: 0,
      conflicts: 0
    };

    for (const [key, mapping] of this.syncMappings) {
      if (!mapping.enabled) {
        results.skipped++;
        continue;
      }

      try {
        const result = await this.sync(mapping);
        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
        }
        if (result.conflict) {
          results.conflicts++;
        }
      } catch (error) {
        logger.error(`同步失败: ${key}`, error);
        results.failed++;
      }
    }

    logger.info('批量同步完成', results);
    this.emit('syncAllCompleted', results);

    return results;
  }

  /**
   * 同步单个映射
   * @param {Object} mapping - 同步映射
   * @returns {Promise<Object>} - 同步结果
   */
  async sync(mapping) {
    const startTime = Date.now();
    this.stats.totalSyncs++;

    try {
      // 检查文件是否存在
      const axiomExists = existsSync(mapping.axiomPath);
      const omcExists = existsSync(mapping.omcPath);

      // 如果都不存在，跳过
      if (!axiomExists && !omcExists) {
        return {
          success: true,
          skipped: true,
          reason: 'both_files_missing'
        };
      }

      // 如果只有一个存在，直接复制
      if (!axiomExists && omcExists) {
        if (mapping.direction === SyncDirection.OMC_TO_AXIOM ||
            mapping.direction === SyncDirection.BIDIRECTIONAL) {
          await this._copyFile(mapping.omcPath, mapping.axiomPath, mapping);
          this.stats.successfulSyncs++;

          const duration = Date.now() - startTime;
          this._recordSync({
            mapping,
            direction: 'omc_to_axiom',
            duration,
            success: true
          });

          return { success: true, direction: 'omc_to_axiom' };
        }
      }

      if (axiomExists && !omcExists) {
        if (mapping.direction === SyncDirection.AXIOM_TO_OMC ||
            mapping.direction === SyncDirection.BIDIRECTIONAL) {
          await this._copyFile(mapping.axiomPath, mapping.omcPath, mapping);
          this.stats.successfulSyncs++;

          const duration = Date.now() - startTime;
          this._recordSync({
            mapping,
            direction: 'axiom_to_omc',
            duration,
            success: true
          });

          return { success: true, direction: 'axiom_to_omc' };
        }
      }

      // 两个文件都存在，检查是否需要同步
      const axiomStat = await stat(mapping.axiomPath);
      const omcStat = await stat(mapping.omcPath);

      // 计算校验和
      const axiomChecksum = await this._calculateChecksum(mapping.axiomPath);
      const omcChecksum = await this._calculateChecksum(mapping.omcPath);

      // 如果内容相同，跳过
      if (axiomChecksum === omcChecksum) {
        return {
          success: true,
          skipped: true,
          reason: 'content_identical'
        };
      }

      // 检测冲突
      const conflict = await this._detectConflict(mapping, axiomStat, omcStat);

      if (conflict) {
        this.stats.conflictsDetected++;
        const resolved = await this._resolveConflict(mapping, axiomStat, omcStat);

        if (resolved) {
          this.stats.conflictsResolved++;
          this.stats.successfulSyncs++;
          return {
            success: true,
            conflict: true,
            resolved: true,
            direction: resolved.direction
          };
        } else {
          return {
            success: false,
            conflict: true,
            resolved: false
          };
        }
      }

      // 根据修改时间决定同步方向
      const direction = axiomStat.mtimeMs > omcStat.mtimeMs
        ? 'axiom_to_omc'
        : 'omc_to_axiom';

      if (direction === 'axiom_to_omc' &&
          (mapping.direction === SyncDirection.AXIOM_TO_OMC ||
           mapping.direction === SyncDirection.BIDIRECTIONAL)) {
        await this._copyFile(mapping.axiomPath, mapping.omcPath, mapping);
      } else if (direction === 'omc_to_axiom' &&
                 (mapping.direction === SyncDirection.OMC_TO_AXIOM ||
                  mapping.direction === SyncDirection.BIDIRECTIONAL)) {
        await this._copyFile(mapping.omcPath, mapping.axiomPath, mapping);
      }

      this.stats.successfulSyncs++;

      const duration = Date.now() - startTime;
      this._recordSync({
        mapping,
        direction,
        duration,
        success: true
      });

      return {
        success: true,
        direction,
        duration
      };

    } catch (error) {
      this.stats.failedSyncs++;
      logger.error('同步失败', error);

      this._recordSync({
        mapping,
        error: error.message,
        success: false
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 手动同步指定文件
   * @param {string} axiomPath - Axiom 文件路径
   * @param {string} omcPath - OMC 文件路径
   * @param {string} direction - 同步方向
   * @returns {Promise<Object>} - 同步结果
   */
  async syncManual(axiomPath, omcPath, direction) {
    const mapping = {
      axiomPath: join(this.config.axiomRoot, axiomPath),
      omcPath: join(this.config.omcRoot, omcPath),
      direction,
      format: 'auto'
    };

    return this.sync(mapping);
  }

  /**
   * 获取同步历史
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 历史记录
   */
  getSyncHistory(filters = {}) {
    let history = [...this.syncHistory];

    if (filters.success !== undefined) {
      history = history.filter(h => h.success === filters.success);
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    return history;
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalSyncs > 0
        ? (this.stats.successfulSyncs / this.stats.totalSyncs * 100).toFixed(2) + '%'
        : '0%',
      conflictResolutionRate: this.stats.conflictsDetected > 0
        ? (this.stats.conflictsResolved / this.stats.conflictsDetected * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * 复制文件
   * @private
   * @param {string} source - 源文件路径
   * @param {string} target - 目标文件路径
   * @param {Object} mapping - 同步映射
   */
  async _copyFile(source, target, mapping) {
    // 确保目标目录存在
    const targetDir = dirname(target);
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    // 读取源文件
    let content = await readFile(source, 'utf-8');

    // 应用转换器
    if (mapping.transformer) {
      content = await mapping.transformer(content, {
        source,
        target,
        direction: source === mapping.axiomPath ? 'axiom_to_omc' : 'omc_to_axiom'
      });
    }

    // 写入目标文件
    await writeFile(target, content, 'utf-8');

    logger.info(`文件已复制: ${source} -> ${target}`);
  }

  /**
   * 计算文件校验和
   * @private
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} - MD5 校验和
   */
  async _calculateChecksum(filePath) {
    if (!this.config.enableChecksum) {
      return null;
    }

    // 检查缓存
    const cached = this.checksums.get(filePath);
    if (cached) {
      const fileStat = await stat(filePath);
      if (cached.mtime === fileStat.mtimeMs) {
        return cached.checksum;
      }
    }

    // 计算新的校验和
    const content = await readFile(filePath, 'utf-8');
    const checksum = createHash('md5').update(content).digest('hex');

    // 缓存
    const fileStat = await stat(filePath);
    this.checksums.set(filePath, {
      checksum,
      mtime: fileStat.mtimeMs
    });

    return checksum;
  }

  /**
   * 检测冲突
   * @private
   * @param {Object} mapping - 同步映射
   * @param {Object} axiomStat - Axiom 文件状态
   * @param {Object} omcStat - OMC 文件状态
   * @returns {Promise<boolean>} - 是否存在冲突
   */
  async _detectConflict(mapping, axiomStat, omcStat) {
    // 如果只支持单向同步，不存在冲突
    if (mapping.direction !== SyncDirection.BIDIRECTIONAL) {
      return false;
    }

    // 检查两个文件是否都在最近被修改
    const timeDiff = Math.abs(axiomStat.mtimeMs - omcStat.mtimeMs);
    const threshold = 1000; // 1 秒

    if (timeDiff < threshold) {
      // 两个文件几乎同时被修改，可能存在冲突
      const axiomChecksum = await this._calculateChecksum(mapping.axiomPath);
      const omcChecksum = await this._calculateChecksum(mapping.omcPath);

      return axiomChecksum !== omcChecksum;
    }

    return false;
  }

  /**
   * 解决冲突
   * @private
   * @param {Object} mapping - 同步映射
   * @param {Object} axiomStat - Axiom 文件状态
   * @param {Object} omcStat - OMC 文件状态
   * @returns {Promise<Object|null>} - 解决结果
   */
  async _resolveConflict(mapping, axiomStat, omcStat) {
    const strategy = this.config.conflictResolution;

    logger.warn('检测到冲突', {
      axiomPath: mapping.axiomPath,
      omcPath: mapping.omcPath,
      strategy
    });

    this.emit('conflictDetected', {
      mapping,
      axiomStat,
      omcStat
    });

    switch (strategy) {
      case ConflictResolution.LATEST:
        // 使用最新的文件
        if (axiomStat.mtimeMs > omcStat.mtimeMs) {
          await this._copyFile(mapping.axiomPath, mapping.omcPath, mapping);
          return { direction: 'axiom_to_omc' };
        } else {
          await this._copyFile(mapping.omcPath, mapping.axiomPath, mapping);
          return { direction: 'omc_to_axiom' };
        }

      case ConflictResolution.OMC_PRIORITY:
        // OMC 优先
        await this._copyFile(mapping.omcPath, mapping.axiomPath, mapping);
        return { direction: 'omc_to_axiom' };

      case ConflictResolution.AXIOM_PRIORITY:
        // Axiom 优先
        await this._copyFile(mapping.axiomPath, mapping.omcPath, mapping);
        return { direction: 'axiom_to_omc' };

      case ConflictResolution.MANUAL:
        // 手动解决
        this.emit('conflictRequiresManualResolution', {
          mapping,
          axiomStat,
          omcStat
        });
        return null;

      default:
        logger.warn(`未知的冲突解决策略: ${strategy}`);
        return null;
    }
  }

  /**
   * 记录同步历史
   * @private
   * @param {Object} record - 同步记录
   */
  _recordSync(record) {
    this.syncHistory.push({
      ...record,
      timestamp: Date.now()
    });

    // 保持历史记录在限制内
    if (this.syncHistory.length > this.config.maxSyncHistory) {
      this.syncHistory.shift();
    }
  }

  /**
   * 获取同步历史
   * @param {Object} filters - 过滤条件
   * @returns {Array} - 历史记录
   */
  getHistory(filters = {}) {
    let history = [...this.syncHistory];

    // 按映射 ID 过滤
    if (filters.mappingId) {
      history = history.filter(h => h.mappingId === filters.mappingId);
    }

    // 限制数量
    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    return history;
  }

  /**
   * 清理资源
   */
  destroy() {
    this.stopAutoSync();
    this.syncMappings.clear();
    this.checksums.clear();
    this.removeAllListeners();
    logger.info('状态同步器已销毁');
  }
}

/**
 * 创建状态同步器
 * @param {Object} config - 配置选项
 * @returns {StateSynchronizer} - 同步器实例
 */
export function createStateSynchronizer(config) {
  return new StateSynchronizer(config);
}

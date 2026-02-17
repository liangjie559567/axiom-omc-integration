/**
 * AutoSyncEngine - 自动同步引擎（基础版）
 *
 * 负责自动同步 Axiom 和 OMC 的工作流状态，支持：
 * - 主从同步模式（单向同步）
 * - 事件监听机制
 * - 循环检测（防止无限同步）
 * - 同步历史记录
 *
 * MVP 版本：只实现主从同步模式
 */

import { EventEmitter } from 'events';
import { Logger } from './logger.js';

const logger = new Logger('AutoSyncEngine');

/**
 * AutoSyncEngine 类
 */
export class AutoSyncEngine extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} workflowIntegration - 工作流集成实例
   * @param {Object} phaseMapper - 阶段映射器实例
   */
  constructor(workflowIntegration, phaseMapper) {
    super();

    if (!workflowIntegration) {
      throw new Error('workflowIntegration 是必需的');
    }

    if (!phaseMapper) {
      throw new Error('phaseMapper 是必需的');
    }

    this.workflowIntegration = workflowIntegration;
    this.phaseMapper = phaseMapper;
    this.syncStrategy = 'master-slave'; // MVP: 只支持主从模式
    this.syncLinks = new Map(); // 工作流同步关系: sourceId -> [{ targetId, ... }]
    this.syncHistory = []; // 同步历史记录
    this.isRunning = false;
    this.syncInProgress = new Set(); // 正在同步的实例 ID（用于循环检测）

    // 绑定事件处理器（保持引用以便移除）
    this._boundHandlePhaseChange = this._handlePhaseChange.bind(this);

    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      cyclesDetected: 0
    };

    logger.info('AutoSyncEngine 已初始化', {
      strategy: this.syncStrategy
    });
  }

  /**
   * 启动自动同步
   */
  start() {
    if (this.isRunning) {
      logger.warn('AutoSyncEngine 已经在运行');
      return;
    }

    // 监听工作流阶段转换事件
    this.workflowIntegration.on('phaseTransitioned', this._boundHandlePhaseChange);

    this.isRunning = true;
    logger.info('AutoSyncEngine 已启动');
  }

  /**
   * 停止自动同步
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('AutoSyncEngine 未在运行');
      return;
    }

    // 移除事件监听
    this.workflowIntegration.removeListener('phaseTransitioned', this._boundHandlePhaseChange);

    this.isRunning = false;
    logger.info('AutoSyncEngine 已停止');
  }

  /**
   * 建立工作流同步关系
   * @param {string} sourceId - 源工作流实例 ID
   * @param {string} targetId - 目标工作流实例 ID
   * @param {Object} options - 选项
   * @param {string} options.strategy - 同步策略（MVP: 只支持 'master-slave'）
   * @param {Array} options.mappingRules - 自定义映射规则（可选）
   * @returns {Promise<void>}
   */
  async linkWorkflows(sourceId, targetId, options = {}) {
    if (!sourceId || !targetId) {
      throw new Error('sourceId 和 targetId 是必需的');
    }

    if (sourceId === targetId) {
      throw new Error('不能将工作流链接到自身');
    }

    // MVP: 只支持主从模式
    const strategy = options.strategy || this.syncStrategy;
    if (strategy !== 'master-slave') {
      throw new Error('MVP 版本只支持 master-slave 同步策略');
    }

    // 验证工作流实例存在
    const sourceInstance = this.workflowIntegration.getWorkflowInstance(sourceId);
    const targetInstance = this.workflowIntegration.getWorkflowInstance(targetId);

    if (!sourceInstance) {
      throw new Error(`源工作流实例不存在: ${sourceId}`);
    }

    if (!targetInstance) {
      throw new Error(`目标工作流实例不存在: ${targetId}`);
    }

    // 创建同步链接
    const link = {
      sourceId,
      targetId,
      strategy,
      mappingRules: options.mappingRules || [],
      createdAt: Date.now()
    };

    // 存储同步关系
    if (!this.syncLinks.has(sourceId)) {
      this.syncLinks.set(sourceId, []);
    }

    // 检查是否已存在相同的链接
    const existingLinks = this.syncLinks.get(sourceId);
    const isDuplicate = existingLinks.some(l => l.targetId === targetId);

    if (isDuplicate) {
      logger.warn('同步链接已存在', { sourceId, targetId });
      return;
    }

    existingLinks.push(link);

    logger.info('工作流同步关系已建立', {
      sourceId,
      targetId,
      strategy
    });

    this.emit('linkCreated', link);
  }

  /**
   * 手动触发同步
   * @param {string} sourceInstanceId - 源实例 ID
   * @param {string} targetInstanceId - 目标实例 ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async sync(sourceInstanceId, targetInstanceId) {
    try {
      // 1. 循环检测
      if (this._detectCycle(sourceInstanceId, targetInstanceId)) {
        logger.warn('检测到循环同步，已阻止', {
          sourceInstanceId,
          targetInstanceId
        });
        this.stats.cyclesDetected++;
        return false;
      }

      // 标记正在同步
      this.syncInProgress.add(sourceInstanceId);
      this.syncInProgress.add(targetInstanceId);

      // 2. 获取源工作流状态
      const sourceInstance = this.workflowIntegration.getWorkflowInstance(sourceInstanceId);
      if (!sourceInstance) {
        throw new Error(`源工作流实例不存在: ${sourceInstanceId}`);
      }

      // 3. 获取目标工作流状态
      const targetInstance = this.workflowIntegration.getWorkflowInstance(targetInstanceId);
      if (!targetInstance) {
        throw new Error(`目标工作流实例不存在: ${targetInstanceId}`);
      }

      // 4. 通过 PhaseMapper 映射阶段
      const mappedPhases = this.phaseMapper.map(sourceInstance.currentPhase, {
        sourceType: sourceInstance.workflowId,
        targetType: targetInstance.workflowId,
        ...sourceInstance.context
      });

      if (mappedPhases.length === 0) {
        logger.warn('无法映射阶段', {
          sourcePhase: sourceInstance.currentPhase,
          sourceInstanceId
        });
        this.stats.failedSyncs++;
        return false;
      }

      // 5. 选择最佳目标阶段（第一个，因为已按权重排序）
      const targetPhase = mappedPhases[0];

      // 6. 检查目标阶段是否与当前阶段相同
      if (targetInstance.currentPhase === targetPhase) {
        logger.debug('目标阶段已是期望阶段，跳过同步', {
          targetPhase,
          targetInstanceId
        });

        // 仍然记录同步历史（标记为跳过）
        this._recordSync({
          sourceInstanceId,
          targetInstanceId,
          sourcePhase: sourceInstance.currentPhase,
          targetPhase,
          timestamp: Date.now(),
          success: true,
          skipped: true
        });

        this.stats.totalSyncs++;
        this.stats.successfulSyncs++;

        return true;
      }

      // 7. 更新目标工作流
      const transitioned = await this.workflowIntegration.transitionTo(
        targetInstanceId,
        targetPhase,
        {
          skipIntermediate: true,
          metadata: {
            syncedFrom: sourceInstanceId,
            syncedAt: Date.now(),
            syncStrategy: 'master-slave'
          }
        }
      );

      if (!transitioned) {
        throw new Error('阶段转换失败');
      }

      // 8. 记录同步历史
      this._recordSync({
        sourceInstanceId,
        targetInstanceId,
        sourcePhase: sourceInstance.currentPhase,
        targetPhase,
        timestamp: Date.now(),
        success: true
      });

      this.stats.totalSyncs++;
      this.stats.successfulSyncs++;

      logger.info('同步完成', {
        sourcePhase: sourceInstance.currentPhase,
        targetPhase,
        sourceInstanceId,
        targetInstanceId
      });

      this.emit('syncCompleted', {
        sourceInstanceId,
        targetInstanceId,
        sourcePhase: sourceInstance.currentPhase,
        targetPhase
      });

      return true;
    } catch (error) {
      this.stats.totalSyncs++;
      this.stats.failedSyncs++;

      // 记录失败的同步
      this._recordSync({
        sourceInstanceId,
        targetInstanceId,
        timestamp: Date.now(),
        success: false,
        error: error.message
      });

      logger.error('同步失败', {
        sourceInstanceId,
        targetInstanceId,
        error: error.message
      });

      this.emit('syncFailed', {
        sourceInstanceId,
        targetInstanceId,
        error: error.message
      });

      return false;
    } finally {
      // 清除同步标记
      this.syncInProgress.delete(sourceInstanceId);
      this.syncInProgress.delete(targetInstanceId);
    }
  }

  /**
   * 获取关联的工作流
   * @param {string} instanceId - 实例 ID
   * @returns {Array<string>} - 关联的工作流 ID 列表
   */
  getLinkedWorkflows(instanceId) {
    const links = this.syncLinks.get(instanceId) || [];
    return links.map(link => link.targetId);
  }

  /**
   * 获取同步历史
   * @param {Object} filters - 过滤条件
   * @param {string} filters.instanceId - 实例 ID（可选）
   * @param {boolean} filters.success - 成功状态（可选）
   * @param {number} filters.limit - 限制数量（可选）
   * @returns {Array<Object>} - 同步历史记录
   */
  getSyncHistory(filters = {}) {
    let history = [...this.syncHistory];

    // 按实例过滤
    if (filters.instanceId) {
      history = history.filter(
        h =>
          h.sourceInstanceId === filters.instanceId ||
          h.targetInstanceId === filters.instanceId
      );
    }

    // 按成功状态过滤
    if (filters.success !== undefined) {
      history = history.filter(h => h.success === filters.success);
    }

    // 限制数量（返回最新的 N 条）
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
      totalLinks: this.syncLinks.size,
      isRunning: this.isRunning
    };
  }

  // ========== 私有方法 ==========

  /**
   * 处理阶段变化事件
   * @private
   * @param {Object} event - 事件数据
   */
  async _handlePhaseChange(event) {
    const { instanceId, from, to } = event;

    logger.debug('检测到阶段变化', { instanceId, from, to });

    // 查找需要同步的目标工作流
    const links = this.syncLinks.get(instanceId) || [];

    if (links.length === 0) {
      logger.debug('没有需要同步的目标工作流', { instanceId });
      return;
    }

    // 对每个链接的目标工作流执行同步
    for (const link of links) {
      await this.sync(instanceId, link.targetId);
    }
  }

  /**
   * 检测循环同步
   * @private
   * @param {string} sourceId - 源实例 ID
   * @param {string} targetId - 目标实例 ID
   * @returns {boolean} - 是否检测到循环
   */
  _detectCycle(sourceId, targetId) {
    // 如果源或目标正在同步中，说明可能存在循环
    if (this.syncInProgress.has(sourceId) || this.syncInProgress.has(targetId)) {
      return true;
    }

    return false;
  }

  /**
   * 记录同步历史
   * @private
   * @param {Object} record - 同步记录
   */
  _recordSync(record) {
    this.syncHistory.push(record);

    // 保持历史记录在限制内（最多 1000 条）
    if (this.syncHistory.length > 1000) {
      this.syncHistory.shift();
    }
  }

  /**
   * 清理资源
   */
  destroy() {
    this.stop();
    this.syncLinks.clear();
    this.syncHistory = [];
    this.syncInProgress.clear();
    this.removeAllListeners();
    logger.info('AutoSyncEngine 已销毁');
  }
}

/**
 * 创建 AutoSyncEngine 实例
 * @param {Object} workflowIntegration - 工作流集成实例
 * @param {Object} phaseMapper - 阶段映射器实例
 * @returns {AutoSyncEngine} - AutoSyncEngine 实例
 */
export function createAutoSyncEngine(workflowIntegration, phaseMapper) {
  return new AutoSyncEngine(workflowIntegration, phaseMapper);
}

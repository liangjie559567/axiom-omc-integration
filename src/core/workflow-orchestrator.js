/**
 * WorkflowOrchestrator - 工作流协调器（基础版）
 *
 * 统一协调和管理工作流系统的所有组件，提供简洁的 API
 * 集成：PhaseMapper、AutoSyncEngine、TemplateManager、WorkflowIntegration
 *
 * MVP 版本：提供基础协调功能
 */

import { Logger } from './logger.js';
import { PhaseMapper } from './phase-mapper.js';
import { AutoSyncEngine } from './auto-sync-engine.js';
import { TemplateManager } from './template-manager.js';

const logger = new Logger('WorkflowOrchestrator');

/**
 * WorkflowOrchestrator 类
 */
export class WorkflowOrchestrator {
  /**
   * 构造函数
   * @param {Object} workflowIntegration - 工作流集成实例
   * @param {Object} options - 选项
   * @param {boolean} options.enableAutoSync - 是否启用自动同步（默认 true）
   * @param {string} options.defaultSyncStrategy - 默认同步策略（默认 'master-slave'）
   */
  constructor(workflowIntegration, options = {}) {
    if (!workflowIntegration) {
      throw new Error('workflowIntegration 是必需的');
    }

    this.workflowIntegration = workflowIntegration;
    this.options = {
      enableAutoSync: options.enableAutoSync !== false,
      defaultSyncStrategy: options.defaultSyncStrategy || 'master-slave'
    };

    // 创建核心引擎
    this.phaseMapper = new PhaseMapper();
    this.autoSyncEngine = new AutoSyncEngine(workflowIntegration, this.phaseMapper);
    this.templateManager = new TemplateManager(workflowIntegration);

    // 如果启用自动同步，则启动
    if (this.options.enableAutoSync) {
      this.autoSyncEngine.start();
    }

    logger.info('WorkflowOrchestrator 已初始化', {
      enableAutoSync: this.options.enableAutoSync,
      defaultSyncStrategy: this.options.defaultSyncStrategy
    });
  }

  // ========== 工作流基础 API ==========

  /**
   * 启动工作流
   * @param {string} workflowId - 工作流 ID
   * @param {Object} context - 上下文
   * @returns {Promise<Object>} - 工作流实例
   */
  async startWorkflow(workflowId, context = {}) {
    const instanceId = await this.workflowIntegration.startWorkflow(workflowId, context);
    const instance = this.workflowIntegration.getWorkflowInstance(instanceId);

    logger.info('工作流已启动', {
      instanceId: instance.id,
      workflowId
    });

    return instance;
  }

  /**
   * 转换到下一个阶段
   * @param {string} instanceId - 实例 ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async transitionToNext(instanceId) {
    const result = await this.workflowIntegration.transitionToNext(instanceId);

    if (result) {
      logger.info('已转换到下一个阶段', { instanceId });
    }

    return result;
  }

  /**
   * 转换到指定阶段
   * @param {string} instanceId - 实例 ID
   * @param {string} targetPhase - 目标阶段
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} - 是否成功
   */
  async transitionTo(instanceId, targetPhase, options = {}) {
    const result = await this.workflowIntegration.transitionTo(
      instanceId,
      targetPhase,
      options
    );

    if (result) {
      logger.info('已转换到指定阶段', { instanceId, targetPhase });
    }

    return result;
  }

  /**
   * 完成工作流
   * @param {string} instanceId - 实例 ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async completeWorkflow(instanceId) {
    const result = await this.workflowIntegration.completeWorkflow(instanceId);

    if (result) {
      logger.info('工作流已完成', { instanceId });
    }

    return result;
  }

  /**
   * 获取工作流实例
   * @param {string} instanceId - 实例 ID
   * @returns {Object|null} - 工作流实例
   */
  getWorkflowInstance(instanceId) {
    return this.workflowIntegration.getWorkflowInstance(instanceId);
  }

  // ========== 映射 API ==========

  /**
   * 注册映射规则
   * @param {Object} rule - 映射规则
   * @returns {string} - 规则 ID
   */
  registerMappingRule(rule) {
    return this.phaseMapper.registerRule(rule);
  }

  /**
   * 执行阶段映射
   * @param {string} fromPhase - 源阶段
   * @param {Object} context - 上下文
   * @returns {Array<string>} - 目标阶段列表
   */
  mapPhase(fromPhase, context = {}) {
    return this.phaseMapper.map(fromPhase, context);
  }

  /**
   * 反向映射
   * @param {string} toPhase - 目标阶段
   * @param {Object} context - 上下文
   * @returns {Array<string>} - 源阶段列表
   */
  reverseMapPhase(toPhase, context = {}) {
    return this.phaseMapper.reverseMap(toPhase, context);
  }

  // ========== 同步 API ==========

  /**
   * 创建同步的工作流对
   * @param {string} axiomWorkflowId - Axiom 工作流 ID
   * @param {string} omcWorkflowId - OMC 工作流 ID
   * @param {Object} options - 选项
   * @param {Object} options.context - 上下文
   * @param {string} options.syncStrategy - 同步策略
   * @returns {Promise<Object>} - { axiomInstanceId, omcInstanceId }
   */
  async createSyncedWorkflowPair(axiomWorkflowId, omcWorkflowId, options = {}) {
    // 创建 Axiom 工作流实例
    const axiomInstance = await this.startWorkflow(axiomWorkflowId, {
      ...options.context,
      role: 'master'
    });

    // 创建 OMC 工作流实例
    const omcInstance = await this.startWorkflow(omcWorkflowId, {
      ...options.context,
      role: 'slave'
    });

    // 建立同步关系
    await this.autoSyncEngine.linkWorkflows(
      axiomInstance.id,
      omcInstance.id,
      {
        strategy: options.syncStrategy || this.options.defaultSyncStrategy
      }
    );

    logger.info('同步工作流对已创建', {
      axiomInstanceId: axiomInstance.id,
      omcInstanceId: omcInstance.id
    });

    return {
      axiomInstanceId: axiomInstance.id,
      omcInstanceId: omcInstance.id
    };
  }

  /**
   * 手动同步工作流
   * @param {string} sourceInstanceId - 源实例 ID
   * @param {string} targetInstanceId - 目标实例 ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async syncWorkflows(sourceInstanceId, targetInstanceId) {
    return await this.autoSyncEngine.sync(sourceInstanceId, targetInstanceId);
  }

  /**
   * 获取同步历史
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 同步历史
   */
  getSyncHistory(filters = {}) {
    return this.autoSyncEngine.getSyncHistory(filters);
  }

  // ========== 模板 API ==========

  /**
   * 注册模板
   * @param {Object} template - 模板对象
   * @returns {string} - 模板 ID
   */
  registerTemplate(template) {
    return this.templateManager.registerTemplate(template);
  }

  /**
   * 从模板创建工作流
   * @param {string} templateId - 模板 ID
   * @param {Object} params - 参数
   * @returns {Promise<Object>} - 工作流实例
   */
  async createFromTemplate(templateId, params = {}) {
    return await this.templateManager.createFromTemplate(templateId, params);
  }

  /**
   * 启动 TDD 工作流（便捷方法）
   * @param {Object} context - 上下文
   * @returns {Promise<Object>} - 工作流实例
   */
  async startTDDWorkflow(context = {}) {
    return await this.createFromTemplate('tdd-workflow', { context });
  }

  // ========== 统计 API ==========

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      phaseMapper: this.phaseMapper.getStats(),
      autoSyncEngine: this.autoSyncEngine.getStats(),
      templateManager: this.templateManager.getStats()
    };
  }

  /**
   * 获取性能指标
   * @returns {Object} - 性能指标
   */
  getPerformanceMetrics() {
    const stats = this.getStats();

    return {
      totalMappings: stats.phaseMapper.totalMappings,
      totalSyncs: stats.autoSyncEngine.totalSyncs,
      successfulSyncs: stats.autoSyncEngine.successfulSyncs,
      failedSyncs: stats.autoSyncEngine.failedSyncs,
      syncSuccessRate:
        stats.autoSyncEngine.totalSyncs > 0
          ? (stats.autoSyncEngine.successfulSyncs / stats.autoSyncEngine.totalSyncs) * 100
          : 0,
      totalTemplates: stats.templateManager.totalTemplates,
      totalCreatedFromTemplates: stats.templateManager.totalCreated
    };
  }

  // ========== 资源管理 ==========

  /**
   * 清理资源
   */
  destroy() {
    this.autoSyncEngine.destroy();
    this.templateManager.destroy();
    this.phaseMapper.clearRules();

    logger.info('WorkflowOrchestrator 已销毁');
  }
}

/**
 * 创建 WorkflowOrchestrator 实例
 * @param {Object} workflowIntegration - 工作流集成实例
 * @param {Object} options - 选项
 * @returns {WorkflowOrchestrator} - WorkflowOrchestrator 实例
 */
export function createWorkflowOrchestrator(workflowIntegration, options = {}) {
  return new WorkflowOrchestrator(workflowIntegration, options);
}

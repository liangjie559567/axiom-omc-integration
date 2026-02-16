/**
 * 工作流整合系统
 * 整合 Axiom 和 OMC 的工作流，提供统一的工作流管理
 */

import { EventEmitter } from 'events';
import { Logger } from './logger.js';
import { generateId } from '../utils/index.js';

const logger = new Logger('WorkflowIntegration');

/**
 * 工作流类型枚举
 */
export const WorkflowType = {
  AXIOM: 'axiom',           // Axiom 工作流
  OMC: 'omc',               // OMC 工作流
  CUSTOM: 'custom'          // 自定义工作流
};

/**
 * Axiom 工作流阶段
 */
export const AxiomPhase = {
  DRAFT: 'draft',           // 草稿阶段
  REVIEW: 'review',         // 审查阶段
  IMPLEMENT: 'implement'    // 实现阶段
};

/**
 * OMC 工作流阶段
 */
export const OMCPhase = {
  PLANNING: 'planning',     // 规划阶段
  DESIGN: 'design',         // 设计阶段
  IMPLEMENTATION: 'implementation', // 实现阶段
  TESTING: 'testing',       // 测试阶段
  DEPLOYMENT: 'deployment'  // 部署阶段
};

/**
 * 阶段状态枚举
 */
export const PhaseStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  SKIPPED: 'skipped'
};

/**
 * 工作流整合系统类
 */
export class WorkflowIntegration extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} config - 配置选项
   */
  constructor(config = {}) {
    super();

    this.config = {
      defaultWorkflowType: config.defaultWorkflowType || WorkflowType.OMC,
      enableAutoTransition: config.enableAutoTransition !== false,
      enableValidation: config.enableValidation !== false,
      ...config
    };

    // 工作流定义
    this.workflows = new Map();

    // 活动工作流实例
    this.activeWorkflows = new Map();

    // 阶段转换历史
    this.transitionHistory = [];

    // 统计信息
    this.stats = {
      totalWorkflows: 0,
      activeWorkflows: 0,
      completedWorkflows: 0,
      totalTransitions: 0
    };

    this._initializeDefaultWorkflows();

    logger.info('工作流整合系统已初始化');
  }

  /**
   * 注册工作流定义
   * @param {Object} workflow - 工作流定义
   * @returns {string} - 工作流 ID
   */
  registerWorkflow(workflow) {
    const id = workflow.id || generateId();

    const definition = {
      id,
      name: workflow.name,
      type: workflow.type || WorkflowType.CUSTOM,
      phases: workflow.phases || [],
      transitions: workflow.transitions || {},
      validation: workflow.validation || null,
      metadata: workflow.metadata || {}
    };

    this.workflows.set(id, definition);
    this.stats.totalWorkflows++;

    logger.info(`工作流已注册: ${id}`, {
      name: definition.name,
      type: definition.type,
      phases: definition.phases.length
    });

    this.emit('workflowRegistered', definition);

    return id;
  }

  /**
   * 启动工作流实例
   * @param {string} workflowId - 工作流 ID
   * @param {Object} context - 执行上下文
   * @returns {string} - 实例 ID
   */
  startWorkflow(workflowId, context = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`工作流不存在: ${workflowId}`);
    }

    const instanceId = generateId();

    const instance = {
      id: instanceId,
      workflowId,
      workflowType: workflow.type,
      currentPhase: workflow.phases[0],
      phaseIndex: 0,
      phaseStatuses: {},
      context,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      completedAt: null
    };

    // 初始化阶段状态
    for (const phase of workflow.phases) {
      instance.phaseStatuses[phase] = PhaseStatus.PENDING;
    }
    instance.phaseStatuses[workflow.phases[0]] = PhaseStatus.IN_PROGRESS;

    this.activeWorkflows.set(instanceId, instance);
    this.stats.activeWorkflows++;

    logger.info(`工作流已启动: ${instanceId}`, {
      workflow: workflow.name,
      initialPhase: instance.currentPhase
    });

    this.emit('workflowStarted', instance);

    return instanceId;
  }

  /**
   * 转换到下一个阶段
   * @param {string} instanceId - 实例 ID
   * @param {Object} options - 选项
   * @returns {boolean} - 是否成功
   */
  async transitionToNext(instanceId, options = {}) {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) {
      throw new Error(`工作流实例不存在: ${instanceId}`);
    }

    const workflow = this.workflows.get(instance.workflowId);
    const currentPhase = instance.currentPhase;
    const nextIndex = instance.phaseIndex + 1;

    // 检查是否已完成
    if (nextIndex >= workflow.phases.length) {
      return this.completeWorkflow(instanceId);
    }

    const nextPhase = workflow.phases[nextIndex];

    // 验证转换
    if (this.config.enableValidation) {
      const valid = await this._validateTransition(
        instance,
        currentPhase,
        nextPhase,
        options
      );

      if (!valid) {
        logger.warn(`阶段转换验证失败: ${currentPhase} -> ${nextPhase}`);
        return false;
      }
    }

    // 执行转换
    instance.phaseStatuses[currentPhase] = PhaseStatus.COMPLETED;
    instance.phaseStatuses[nextPhase] = PhaseStatus.IN_PROGRESS;
    instance.currentPhase = nextPhase;
    instance.phaseIndex = nextIndex;
    instance.updatedAt = Date.now();

    // 记录转换历史
    this._recordTransition({
      instanceId,
      from: currentPhase,
      to: nextPhase,
      timestamp: Date.now(),
      metadata: options.metadata || {}
    });

    this.stats.totalTransitions++;

    logger.info(`阶段已转换: ${currentPhase} -> ${nextPhase}`, {
      instance: instanceId
    });

    this.emit('phaseTransitioned', {
      instanceId,
      from: currentPhase,
      to: nextPhase,
      instance
    });

    return true;
  }

  /**
   * 转换到指定阶段
   * @param {string} instanceId - 实例 ID
   * @param {string} targetPhase - 目标阶段
   * @param {Object} options - 选项
   * @returns {boolean} - 是否成功
   */
  async transitionTo(instanceId, targetPhase, options = {}) {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) {
      throw new Error(`工作流实例不存在: ${instanceId}`);
    }

    const workflow = this.workflows.get(instance.workflowId);
    const targetIndex = workflow.phases.indexOf(targetPhase);

    if (targetIndex === -1) {
      throw new Error(`阶段不存在: ${targetPhase}`);
    }

    const currentPhase = instance.currentPhase;

    // 验证转换（跳过中间阶段时不验证转换规则）
    if (this.config.enableValidation && !options.skipIntermediate) {
      const valid = await this._validateTransition(
        instance,
        currentPhase,
        targetPhase,
        options
      );

      if (!valid) {
        logger.warn(`阶段转换验证失败: ${currentPhase} -> ${targetPhase}`);
        return false;
      }
    }

    // 更新中间阶段状态
    for (let i = instance.phaseIndex; i < targetIndex; i++) {
      const phase = workflow.phases[i];
      instance.phaseStatuses[phase] = options.skipIntermediate
        ? PhaseStatus.SKIPPED
        : PhaseStatus.COMPLETED;
    }

    // 执行转换
    instance.phaseStatuses[targetPhase] = PhaseStatus.IN_PROGRESS;
    instance.currentPhase = targetPhase;
    instance.phaseIndex = targetIndex;
    instance.updatedAt = Date.now();

    // 记录转换历史
    this._recordTransition({
      instanceId,
      from: currentPhase,
      to: targetPhase,
      timestamp: Date.now(),
      metadata: options.metadata || {}
    });

    this.stats.totalTransitions++;

    logger.info(`阶段已转换: ${currentPhase} -> ${targetPhase}`, {
      instance: instanceId
    });

    this.emit('phaseTransitioned', {
      instanceId,
      from: currentPhase,
      to: targetPhase,
      instance
    });

    return true;
  }

  /**
   * 完成工作流
   * @param {string} instanceId - 实例 ID
   * @returns {boolean} - 是否成功
   */
  completeWorkflow(instanceId) {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) {
      throw new Error(`工作流实例不存在: ${instanceId}`);
    }

    instance.completedAt = Date.now();
    instance.phaseStatuses[instance.currentPhase] = PhaseStatus.COMPLETED;

    this.activeWorkflows.delete(instanceId);
    this.stats.activeWorkflows--;
    this.stats.completedWorkflows++;

    logger.info(`工作流已完成: ${instanceId}`);

    this.emit('workflowCompleted', instance);

    return true;
  }

  /**
   * 取消工作流
   * @param {string} instanceId - 实例 ID
   * @returns {boolean} - 是否成功
   */
  cancelWorkflow(instanceId) {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) {
      return false;
    }

    this.activeWorkflows.delete(instanceId);
    this.stats.activeWorkflows--;

    logger.info(`工作流已取消: ${instanceId}`);

    this.emit('workflowCancelled', instance);

    return true;
  }

  /**
   * 获取工作流实例
   * @param {string} instanceId - 实例 ID
   * @returns {Object|null} - 实例信息
   */
  getWorkflowInstance(instanceId) {
    return this.activeWorkflows.get(instanceId) || null;
  }

  /**
   * 获取所有活动工作流
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 工作流列表
   */
  getActiveWorkflows(filters = {}) {
    let workflows = Array.from(this.activeWorkflows.values());

    // 按类型过滤
    if (filters.type) {
      workflows = workflows.filter(w => w.workflowType === filters.type);
    }

    // 按当前阶段过滤
    if (filters.currentPhase) {
      workflows = workflows.filter(w => w.currentPhase === filters.currentPhase);
    }

    return workflows;
  }

  /**
   * 获取转换历史
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 历史记录
   */
  getTransitionHistory(filters = {}) {
    let history = [...this.transitionHistory];

    // 按实例过滤
    if (filters.instanceId) {
      history = history.filter(h => h.instanceId === filters.instanceId);
    }

    // 限制数量
    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    return history;
  }

  /**
   * 映射 Axiom 阶段到 OMC 阶段
   * @param {string} axiomPhase - Axiom 阶段
   * @returns {string} - OMC 阶段
   */
  mapAxiomToOMC(axiomPhase) {
    const mapping = {
      [AxiomPhase.DRAFT]: OMCPhase.PLANNING,
      [AxiomPhase.REVIEW]: OMCPhase.DESIGN,
      [AxiomPhase.IMPLEMENT]: OMCPhase.IMPLEMENTATION
    };

    return mapping[axiomPhase] || OMCPhase.PLANNING;
  }

  /**
   * 映射 OMC 阶段到 Axiom 阶段
   * @param {string} omcPhase - OMC 阶段
   * @returns {string} - Axiom 阶段
   */
  mapOMCToAxiom(omcPhase) {
    const mapping = {
      [OMCPhase.PLANNING]: AxiomPhase.DRAFT,
      [OMCPhase.DESIGN]: AxiomPhase.REVIEW,
      [OMCPhase.IMPLEMENTATION]: AxiomPhase.IMPLEMENT,
      [OMCPhase.TESTING]: AxiomPhase.IMPLEMENT,
      [OMCPhase.DEPLOYMENT]: AxiomPhase.IMPLEMENT
    };

    return mapping[omcPhase] || AxiomPhase.DRAFT;
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 验证阶段转换
   * @private
   * @param {Object} instance - 工作流实例
   * @param {string} from - 源阶段
   * @param {string} to - 目标阶段
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} - 是否有效
   */
  async _validateTransition(instance, from, to, options) {
    const workflow = this.workflows.get(instance.workflowId);

    // 检查转换规则
    if (workflow.transitions && workflow.transitions[from]) {
      const allowedTransitions = workflow.transitions[from];
      if (!allowedTransitions.includes(to)) {
        return false;
      }
    }

    // 自定义验证
    if (workflow.validation) {
      try {
        const result = await workflow.validation(instance, from, to, options);
        return result;
      } catch (error) {
        logger.error('转换验证失败', error);
        return false;
      }
    }

    return true;
  }

  /**
   * 记录转换历史
   * @private
   * @param {Object} record - 转换记录
   */
  _recordTransition(record) {
    this.transitionHistory.push(record);

    // 保持历史记录在限制内（最多 1000 条）
    if (this.transitionHistory.length > 1000) {
      this.transitionHistory.shift();
    }
  }

  /**
   * 初始化默认工作流
   * @private
   */
  _initializeDefaultWorkflows() {
    // Axiom 工作流
    this.registerWorkflow({
      id: 'axiom-default',
      name: 'Axiom Default Workflow',
      type: WorkflowType.AXIOM,
      phases: [
        AxiomPhase.DRAFT,
        AxiomPhase.REVIEW,
        AxiomPhase.IMPLEMENT
      ],
      transitions: {
        [AxiomPhase.DRAFT]: [AxiomPhase.REVIEW],
        [AxiomPhase.REVIEW]: [AxiomPhase.IMPLEMENT, AxiomPhase.DRAFT],
        [AxiomPhase.IMPLEMENT]: []
      }
    });

    // OMC 工作流
    this.registerWorkflow({
      id: 'omc-default',
      name: 'OMC Team Pipeline',
      type: WorkflowType.OMC,
      phases: [
        OMCPhase.PLANNING,
        OMCPhase.DESIGN,
        OMCPhase.IMPLEMENTATION,
        OMCPhase.TESTING,
        OMCPhase.DEPLOYMENT
      ],
      transitions: {
        [OMCPhase.PLANNING]: [OMCPhase.DESIGN],
        [OMCPhase.DESIGN]: [OMCPhase.IMPLEMENTATION, OMCPhase.PLANNING],
        [OMCPhase.IMPLEMENTATION]: [OMCPhase.TESTING],
        [OMCPhase.TESTING]: [OMCPhase.DEPLOYMENT, OMCPhase.IMPLEMENTATION],
        [OMCPhase.DEPLOYMENT]: []
      }
    });

    logger.info('默认工作流已初始化');
  }

  /**
   * 停止工作流实例
   * @param {string} instanceId - 实例 ID
   * @returns {boolean} - 是否成功
   */
  stopWorkflow(instanceId) {
    const instance = this.activeWorkflows.get(instanceId);

    if (!instance) {
      logger.warn(`工作流实例不存在: ${instanceId}`);
      return false;
    }

    // 从活动工作流中移除
    this.activeWorkflows.delete(instanceId);

    // 触发事件
    this.emit('workflowStopped', {
      instanceId,
      workflowId: instance.workflowId,
      currentPhase: instance.currentPhase,
      stoppedAt: Date.now()
    });

    logger.info(`工作流已停止: ${instanceId}`);

    return true;
  }

  /**
   * 清理资源
   */
  destroy() {
    this.workflows.clear();
    this.activeWorkflows.clear();
    this.transitionHistory = [];
    this.removeAllListeners();

    logger.info('工作流整合系统已销毁');
  }
}

/**
 * 创建工作流整合系统
 * @param {Object} config - 配置选项
 * @returns {WorkflowIntegration} - 系统实例
 */
export function createWorkflowIntegration(config) {
  return new WorkflowIntegration(config);
}

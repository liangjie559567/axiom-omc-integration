/**
 * 高级工作流编排器
 * 提供动态工作流生成、条件分支和循环支持
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/logger.js';

const logger = new Logger('AdvancedWorkflowOrchestrator');

/**
 * 工作流状态枚举
 */
export const WorkflowStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * 节点类型枚举
 */
export const NodeType = {
  TASK: 'task',
  CONDITION: 'condition',
  LOOP: 'loop',
  PARALLEL: 'parallel',
  SEQUENCE: 'sequence'
};

/**
 * 高级工作流编排器类
 */
export class AdvancedWorkflowOrchestrator extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();

    this.options = {
      maxConcurrency: 10,
      timeout: 300000, // 5分钟
      retryAttempts: 3,
      retryDelay: 1000,
      ...options
    };

    // 工作流存储
    this.workflows = new Map();

    // 工作流模板
    this.templates = new Map();

    // 执行上下文
    this.contexts = new Map();

    // 运行中的工作流
    this.runningWorkflows = new Set();

    logger.info('高级工作流编排器已初始化', this.options);
  }

  /**
   * 注册工作流模板
   * @param {string} templateId - 模板ID
   * @param {Object} template - 模板定义
   */
  registerTemplate(templateId, template) {
    if (!template.nodes || !Array.isArray(template.nodes)) {
      throw new Error('模板必须包含 nodes 数组');
    }

    this.templates.set(templateId, {
      id: templateId,
      name: template.name,
      description: template.description,
      nodes: template.nodes,
      variables: template.variables || {},
      metadata: template.metadata || {},
      createdAt: Date.now()
    });

    logger.info('工作流模板已注册', { templateId, name: template.name });
  }

  /**
   * 从模板创建工作流
   * @param {string} templateId - 模板ID
   * @param {Object} variables - 变量值
   * @returns {string} 工作流ID
   */
  createFromTemplate(templateId, variables = {}) {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`模板未找到: ${templateId}`);
    }

    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const workflow = {
      id: workflowId,
      templateId,
      name: template.name,
      nodes: JSON.parse(JSON.stringify(template.nodes)), // 深拷贝
      variables: { ...template.variables, ...variables },
      status: WorkflowStatus.PENDING,
      currentNode: null,
      completedNodes: [],
      failedNodes: [],
      startTime: null,
      endTime: null,
      result: null,
      error: null,
      createdAt: Date.now()
    };

    this.workflows.set(workflowId, workflow);

    logger.info('工作流已创建', { workflowId, templateId });
    this.emit('workflow_created', { workflowId, templateId });

    return workflowId;
  }

  /**
   * 动态创建工作流
   * @param {Object} definition - 工作流定义
   * @returns {string} 工作流ID
   */
  createDynamic(definition) {
    if (!definition.nodes || !Array.isArray(definition.nodes)) {
      throw new Error('工作流定义必须包含 nodes 数组');
    }

    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const workflow = {
      id: workflowId,
      name: definition.name || 'Dynamic Workflow',
      nodes: definition.nodes,
      variables: definition.variables || {},
      status: WorkflowStatus.PENDING,
      currentNode: null,
      completedNodes: [],
      failedNodes: [],
      startTime: null,
      endTime: null,
      result: null,
      error: null,
      createdAt: Date.now()
    };

    this.workflows.set(workflowId, workflow);

    logger.info('动态工作流已创建', { workflowId, name: workflow.name });
    this.emit('workflow_created', { workflowId });

    return workflowId;
  }

  /**
   * 执行工作流
   * @param {string} workflowId - 工作流ID
   * @param {Object} input - 输入数据
   * @returns {Promise<Object>} 执行结果
   */
  async execute(workflowId, input = {}) {
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      throw new Error(`工作流未找到: ${workflowId}`);
    }

    if (workflow.status === WorkflowStatus.RUNNING) {
      throw new Error(`工作流正在运行: ${workflowId}`);
    }

    workflow.status = WorkflowStatus.RUNNING;
    workflow.startTime = Date.now();
    this.runningWorkflows.add(workflowId);

    // 创建执行上下文
    const context = {
      workflowId,
      input,
      variables: { ...workflow.variables },
      output: {},
      nodeResults: new Map()
    };

    this.contexts.set(workflowId, context);

    logger.info('工作流开始执行', { workflowId });
    this.emit('workflow_started', { workflowId });

    try {
      // 执行工作流节点
      const result = await this._executeNodes(workflow, context);

      workflow.status = WorkflowStatus.COMPLETED;
      workflow.endTime = Date.now();
      workflow.result = result;

      logger.info('工作流执行完成', {
        workflowId,
        duration: workflow.endTime - workflow.startTime
      });

      this.emit('workflow_completed', { workflowId, result });

      return result;

    } catch (error) {
      workflow.status = WorkflowStatus.FAILED;
      workflow.endTime = Date.now();
      workflow.error = error.message;

      logger.error('工作流执行失败', { workflowId, error: error.message });
      this.emit('workflow_failed', { workflowId, error });

      throw error;

    } finally {
      this.runningWorkflows.delete(workflowId);
    }
  }

  /**
   * 执行节点
   * @private
   */
  async _executeNodes(workflow, context, nodes = null) {
    const nodesToExecute = nodes || workflow.nodes;

    for (const node of nodesToExecute) {
      workflow.currentNode = node.id;

      try {
        const result = await this._executeNode(node, workflow, context);

        workflow.completedNodes.push(node.id);
        context.nodeResults.set(node.id, result);

        this.emit('node_completed', {
          workflowId: workflow.id,
          nodeId: node.id,
          result
        });

      } catch (error) {
        workflow.failedNodes.push(node.id);

        logger.error('节点执行失败', {
          workflowId: workflow.id,
          nodeId: node.id,
          error: error.message
        });

        this.emit('node_failed', {
          workflowId: workflow.id,
          nodeId: node.id,
          error
        });

        throw error;
      }
    }

    return context.output;
  }

  /**
   * 执行单个节点
   * @private
   */
  async _executeNode(node, workflow, context) {
    logger.info('执行节点', { workflowId: workflow.id, nodeId: node.id, type: node.type });

    switch (node.type) {
      case NodeType.TASK:
        return await this._executeTask(node, context);

      case NodeType.CONDITION:
        return await this._executeCondition(node, workflow, context);

      case NodeType.LOOP:
        return await this._executeLoop(node, workflow, context);

      case NodeType.PARALLEL:
        return await this._executeParallel(node, workflow, context);

      case NodeType.SEQUENCE:
        return await this._executeSequence(node, workflow, context);

      default:
        throw new Error(`未知节点类型: ${node.type}`);
    }
  }

  /**
   * 执行任务节点
   * @private
   */
  async _executeTask(node, context) {
    if (!node.handler) {
      throw new Error(`任务节点缺少 handler: ${node.id}`);
    }

    // 解析输入
    const input = this._resolveVariables(node.input || {}, context);

    // 执行任务
    const result = await node.handler(input, context);

    // 保存输出
    if (node.output) {
      context.variables[node.output] = result;
    }

    return result;
  }

  /**
   * 执行条件节点
   * @private
   */
  async _executeCondition(node, workflow, context) {
    if (!node.condition) {
      throw new Error(`条件节点缺少 condition: ${node.id}`);
    }

    // 评估条件
    const conditionResult = await this._evaluateCondition(node.condition, context);

    // 选择分支
    const branch = conditionResult ? node.trueBranch : node.falseBranch;

    if (branch && branch.length > 0) {
      return await this._executeNodes(workflow, context, branch);
    }

    return conditionResult;
  }

  /**
   * 执行循环节点
   * @private
   */
  async _executeLoop(node, workflow, context) {
    if (!node.condition && !node.iterations) {
      throw new Error(`循环节点缺少 condition 或 iterations: ${node.id}`);
    }

    const results = [];
    let iteration = 0;
    const maxIterations = node.iterations || 1000; // 防止无限循环

    while (iteration < maxIterations) {
      // 更新循环变量（在检查条件之前）
      context.variables._iteration = iteration;

      // 检查循环条件
      if (node.condition) {
        const shouldContinue = await this._evaluateCondition(node.condition, context);
        if (!shouldContinue) break;
      }

      // 执行循环体
      const result = await this._executeNodes(workflow, context, node.body);
      results.push(result);

      iteration++;

      // 固定次数循环
      if (node.iterations && iteration >= node.iterations) {
        break;
      }
    }

    return results;
  }

  /**
   * 执行并行节点
   * @private
   */
  async _executeParallel(node, workflow, context) {
    if (!node.branches || node.branches.length === 0) {
      throw new Error(`并行节点缺少 branches: ${node.id}`);
    }

    // 限制并发数
    const concurrency = Math.min(
      node.concurrency || this.options.maxConcurrency,
      this.options.maxConcurrency
    );

    const results = [];
    const executing = [];

    for (const branch of node.branches) {
      const promise = this._executeNodes(workflow, context, branch)
        .then(result => {
          results.push({ success: true, result });
        })
        .catch(error => {
          results.push({ success: false, error: error.message });
        });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(executing);

    return results;
  }

  /**
   * 执行序列节点
   * @private
   */
  async _executeSequence(node, workflow, context) {
    if (!node.steps || node.steps.length === 0) {
      throw new Error(`序列节点缺少 steps: ${node.id}`);
    }

    return await this._executeNodes(workflow, context, node.steps);
  }

  /**
   * 评估条件
   * @private
   */
  async _evaluateCondition(condition, context) {
    if (typeof condition === 'function') {
      return await condition(context);
    }

    if (typeof condition === 'string') {
      // 简单的变量检查
      return !!context.variables[condition];
    }

    if (typeof condition === 'object') {
      // 支持简单的比较操作
      const { variable, operator, value } = condition;
      const varValue = context.variables[variable];

      switch (operator) {
        case '==': return varValue == value;
        case '===': return varValue === value;
        case '!=': return varValue != value;
        case '!==': return varValue !== value;
        case '>': return varValue > value;
        case '>=': return varValue >= value;
        case '<': return varValue < value;
        case '<=': return varValue <= value;
        default: return false;
      }
    }

    return !!condition;
  }

  /**
   * 解析变量
   * @private
   */
  _resolveVariables(obj, context) {
    if (typeof obj === 'string') {
      // 替换变量引用 ${varName}
      return obj.replace(/\$\{(\w+)\}/g, (match, varName) => {
        return context.variables[varName] || match;
      });
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this._resolveVariables(item, context));
    }

    if (typeof obj === 'object' && obj !== null) {
      const resolved = {};
      for (const [key, value] of Object.entries(obj)) {
        resolved[key] = this._resolveVariables(value, context);
      }
      return resolved;
    }

    return obj;
  }

  /**
   * 暂停工作流
   * @param {string} workflowId - 工作流ID
   */
  pause(workflowId) {
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      throw new Error(`工作流未找到: ${workflowId}`);
    }

    if (workflow.status !== WorkflowStatus.RUNNING) {
      throw new Error(`工作流未在运行: ${workflowId}`);
    }

    workflow.status = WorkflowStatus.PAUSED;
    logger.info('工作流已暂停', { workflowId });
    this.emit('workflow_paused', { workflowId });
  }

  /**
   * 恢复工作流
   * @param {string} workflowId - 工作流ID
   */
  resume(workflowId) {
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      throw new Error(`工作流未找到: ${workflowId}`);
    }

    if (workflow.status !== WorkflowStatus.PAUSED) {
      throw new Error(`工作流未暂停: ${workflowId}`);
    }

    workflow.status = WorkflowStatus.RUNNING;
    logger.info('工作流已恢复', { workflowId });
    this.emit('workflow_resumed', { workflowId });
  }

  /**
   * 取消工作流
   * @param {string} workflowId - 工作流ID
   */
  cancel(workflowId) {
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      throw new Error(`工作流未找到: ${workflowId}`);
    }

    workflow.status = WorkflowStatus.CANCELLED;
    workflow.endTime = Date.now();
    this.runningWorkflows.delete(workflowId);

    logger.info('工作流已取消', { workflowId });
    this.emit('workflow_cancelled', { workflowId });
  }

  /**
   * 获取工作流状态
   * @param {string} workflowId - 工作流ID
   * @returns {Object} 工作流状态
   */
  getWorkflowStatus(workflowId) {
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      return null;
    }

    return {
      id: workflow.id,
      name: workflow.name,
      status: workflow.status,
      currentNode: workflow.currentNode,
      completedNodes: workflow.completedNodes.length,
      totalNodes: workflow.nodes.length,
      progress: workflow.nodes.length > 0
        ? workflow.completedNodes.length / workflow.nodes.length
        : 0,
      startTime: workflow.startTime,
      endTime: workflow.endTime,
      duration: workflow.endTime
        ? workflow.endTime - workflow.startTime
        : workflow.startTime
          ? Date.now() - workflow.startTime
          : null
    };
  }

  /**
   * 获取所有工作流
   * @returns {Array} 工作流列表
   */
  getAllWorkflows() {
    return Array.from(this.workflows.values()).map(w => ({
      id: w.id,
      name: w.name,
      status: w.status,
      createdAt: w.createdAt
    }));
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const total = this.workflows.size;
    const running = this.runningWorkflows.size;
    const completed = Array.from(this.workflows.values())
      .filter(w => w.status === WorkflowStatus.COMPLETED).length;
    const failed = Array.from(this.workflows.values())
      .filter(w => w.status === WorkflowStatus.FAILED).length;

    return {
      total,
      running,
      completed,
      failed,
      templates: this.templates.size,
      successRate: total > 0 ? completed / total : 0
    };
  }

  /**
   * 销毁编排器
   */
  destroy() {
    // 取消所有运行中的工作流
    for (const workflowId of this.runningWorkflows) {
      try {
        this.cancel(workflowId);
      } catch (error) {
        logger.error('取消工作流失败', { workflowId, error: error.message });
      }
    }

    this.workflows.clear();
    this.templates.clear();
    this.contexts.clear();
    this.runningWorkflows.clear();
    this.removeAllListeners();

    logger.info('高级工作流编排器已销毁');
  }
}

export default AdvancedWorkflowOrchestrator;

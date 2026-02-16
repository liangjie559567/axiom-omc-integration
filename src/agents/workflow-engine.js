/**
 * 工作流引擎
 * 负责多 Agent 协作的编排和执行
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/logger.js';
import { generateId } from '../utils/index.js';

const logger = new Logger('WorkflowEngine');

/**
 * 工作流状态枚举
 */
export const WorkflowStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  PAUSED: 'paused'
};

/**
 * 任务状态枚举
 */
export const TaskStatus = {
  PENDING: 'pending',
  READY: 'ready',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped'
};

/**
 * 工作流引擎类
 */
export class WorkflowEngine extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();

    this.executor = options.executor;
    this.registry = options.registry;

    // 工作流存储
    this.workflows = new Map(); // id -> workflow
    this.runningWorkflows = new Map(); // id -> workflow
    this.completedWorkflows = new Map(); // id -> workflow

    logger.info('工作流引擎已初始化');
  }

  /**
   * 创建工作流
   * @param {Object} definition - 工作流定义
   * @returns {string} - 工作流 ID
   */
  createWorkflow(definition) {
    const workflow = {
      id: generateId(),
      name: definition.name || 'Unnamed Workflow',
      description: definition.description || '',
      tasks: definition.tasks || [],
      status: WorkflowStatus.PENDING,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      duration: null,
      results: {},
      errors: {},
      metadata: definition.metadata || {}
    };

    // 验证工作流定义
    this._validateWorkflow(workflow);

    // 初始化任务状态
    workflow.tasks.forEach(task => {
      task.status = TaskStatus.PENDING;
      task.result = null;
      task.error = null;
    });

    this.workflows.set(workflow.id, workflow);

    logger.info(`创建工作流: ${workflow.id}`, {
      name: workflow.name,
      tasks: workflow.tasks.length
    });

    this.emit('workflowCreated', workflow);

    return workflow.id;
  }

  /**
   * 执行工作流
   * @param {string} workflowId - 工作流 ID
   * @param {Object} context - 执行上下文
   * @returns {Promise<Object>} - 执行结果
   */
  async executeWorkflow(workflowId, context = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`工作流不存在: ${workflowId}`);
    }

    if (workflow.status === WorkflowStatus.RUNNING) {
      throw new Error(`工作流正在运行: ${workflowId}`);
    }

    workflow.status = WorkflowStatus.RUNNING;
    workflow.startedAt = Date.now();
    workflow.context = context;

    this.runningWorkflows.set(workflowId, workflow);

    logger.info(`开始执行工作流: ${workflowId}`);
    this.emit('workflowStarted', workflow);

    try {
      // 执行工作流
      await this._executeWorkflowTasks(workflow);

      workflow.status = WorkflowStatus.COMPLETED;
      workflow.completedAt = Date.now();
      workflow.duration = workflow.completedAt - workflow.startedAt;

      logger.info(`工作流完成: ${workflowId}`, {
        duration: workflow.duration + 'ms'
      });

      this.emit('workflowCompleted', workflow);

      return {
        success: true,
        results: workflow.results,
        duration: workflow.duration
      };
    } catch (error) {
      workflow.status = WorkflowStatus.FAILED;
      workflow.completedAt = Date.now();
      workflow.duration = workflow.completedAt - workflow.startedAt;
      workflow.error = error.message;

      logger.error(`工作流失败: ${workflowId}`, error);
      this.emit('workflowFailed', workflow);

      throw error;
    } finally {
      this.runningWorkflows.delete(workflowId);
      this.completedWorkflows.set(workflowId, workflow);
    }
  }

  /**
   * 取消工作流
   * @param {string} workflowId - 工作流 ID
   * @returns {boolean} - 是否成功取消
   */
  cancelWorkflow(workflowId) {
    const workflow = this.runningWorkflows.get(workflowId);
    if (!workflow) {
      logger.warn(`工作流不存在或未运行: ${workflowId}`);
      return false;
    }

    workflow.status = WorkflowStatus.CANCELLED;
    workflow.completedAt = Date.now();
    workflow.duration = workflow.completedAt - workflow.startedAt;

    this.runningWorkflows.delete(workflowId);
    this.completedWorkflows.set(workflowId, workflow);

    logger.info(`取消工作流: ${workflowId}`);
    this.emit('workflowCancelled', workflow);

    return true;
  }

  /**
   * 获取工作流
   * @param {string} workflowId - 工作流 ID
   * @returns {Object|null} - 工作流信息
   */
  getWorkflow(workflowId) {
    return this.workflows.get(workflowId) ||
           this.runningWorkflows.get(workflowId) ||
           this.completedWorkflows.get(workflowId) ||
           null;
  }

  /**
   * 获取所有工作流
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 工作流列表
   */
  getWorkflows(filters = {}) {
    let workflows = [
      ...Array.from(this.workflows.values()),
      ...Array.from(this.runningWorkflows.values()),
      ...Array.from(this.completedWorkflows.values())
    ];

    // 按状态过滤
    if (filters.status) {
      workflows = workflows.filter(w => w.status === filters.status);
    }

    // 排序（最新的在前）
    workflows.sort((a, b) => b.createdAt - a.createdAt);

    return workflows;
  }

  /**
   * 验证工作流定义
   * @private
   * @param {Object} workflow - 工作流
   */
  _validateWorkflow(workflow) {
    if (!workflow.tasks || workflow.tasks.length === 0) {
      throw new Error('工作流必须包含至少一个任务');
    }

    // 验证任务
    workflow.tasks.forEach((task, index) => {
      if (!task.id) {
        task.id = `task-${index}`;
      }

      if (!task.agentId) {
        throw new Error(`任务 ${task.id} 缺少 agentId`);
      }

      // 验证 Agent 存在
      const agent = this.registry.getAgent(task.agentId);
      if (!agent) {
        throw new Error(`任务 ${task.id} 的 Agent 不存在: ${task.agentId}`);
      }

      // 验证依赖
      if (task.dependencies) {
        task.dependencies.forEach(depId => {
          const depTask = workflow.tasks.find(t => t.id === depId);
          if (!depTask) {
            throw new Error(`任务 ${task.id} 的依赖不存在: ${depId}`);
          }
        });
      }
    });

    // 检查循环依赖
    this._checkCircularDependencies(workflow.tasks);
  }

  /**
   * 检查循环依赖
   * @private
   * @param {Array<Object>} tasks - 任务列表
   */
  _checkCircularDependencies(tasks) {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (taskId) => {
      visited.add(taskId);
      recursionStack.add(taskId);

      const task = tasks.find(t => t.id === taskId);
      if (task && task.dependencies) {
        for (const depId of task.dependencies) {
          if (!visited.has(depId)) {
            if (hasCycle(depId)) {
              return true;
            }
          } else if (recursionStack.has(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        if (hasCycle(task.id)) {
          throw new Error('工作流存在循环依赖');
        }
      }
    }
  }

  /**
   * 执行工作流任务
   * @private
   * @param {Object} workflow - 工作流
   */
  async _executeWorkflowTasks(workflow) {
    const tasks = workflow.tasks;
    const completedTasks = new Set();

    while (completedTasks.size < tasks.length) {
      // 检查是否被取消
      if (workflow.status === WorkflowStatus.CANCELLED) {
        throw new Error('工作流已取消');
      }

      // 找到可以执行的任务
      const readyTasks = tasks.filter(task => {
        if (task.status !== TaskStatus.PENDING) {
          return false;
        }

        // 检查依赖是否完成
        if (task.dependencies && task.dependencies.length > 0) {
          return task.dependencies.every(depId => {
            const depTask = tasks.find(t => t.id === depId);
            return depTask && depTask.status === TaskStatus.COMPLETED;
          });
        }

        return true;
      });

      if (readyTasks.length === 0) {
        // 检查是否有失败的任务
        const failedTasks = tasks.filter(t => t.status === TaskStatus.FAILED);
        if (failedTasks.length > 0) {
          throw new Error(`任务失败: ${failedTasks.map(t => t.id).join(', ')}`);
        }

        // 没有可执行的任务，等待
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      // 并行执行就绪的任务
      await Promise.all(
        readyTasks.map(task => this._executeTask(workflow, task))
      );

      // 标记已完成的任务
      readyTasks.forEach(task => {
        if (task.status === TaskStatus.COMPLETED) {
          completedTasks.add(task.id);
        }
      });
    }
  }

  /**
   * 执行单个任务
   * @private
   * @param {Object} workflow - 工作流
   * @param {Object} task - 任务
   */
  async _executeTask(workflow, task) {
    task.status = TaskStatus.RUNNING;

    logger.info(`执行任务: ${task.id}`, {
      workflow: workflow.id,
      agent: task.agentId
    });

    this.emit('taskStarted', { workflow, task });

    try {
      // 准备输入（可能依赖其他任务的输出）
      const input = this._prepareTaskInput(workflow, task);

      // 执行 Agent
      const result = await this.executor.execute(
        task.agentId,
        input,
        task.options || {}
      );

      task.status = TaskStatus.COMPLETED;
      task.result = result;
      workflow.results[task.id] = result;

      logger.info(`任务完成: ${task.id}`);
      this.emit('taskCompleted', { workflow, task });
    } catch (error) {
      task.status = TaskStatus.FAILED;
      task.error = error.message;
      workflow.errors[task.id] = error.message;

      logger.error(`任务失败: ${task.id}`, error);
      this.emit('taskFailed', { workflow, task });

      // 根据配置决定是否继续
      if (!task.continueOnError) {
        throw error;
      }
    }
  }

  /**
   * 准备任务输入
   * @private
   * @param {Object} workflow - 工作流
   * @param {Object} task - 任务
   * @returns {Object} - 任务输入
   */
  _prepareTaskInput(workflow, task) {
    let input = { ...task.input };

    // 如果有依赖，将依赖任务的输出作为输入
    if (task.dependencies && task.dependencies.length > 0) {
      const dependencyResults = {};

      task.dependencies.forEach(depId => {
        const depTask = workflow.tasks.find(t => t.id === depId);
        if (depTask && depTask.result) {
          dependencyResults[depId] = depTask.result;
        }
      });

      input.dependencies = dependencyResults;
    }

    // 添加工作流上下文
    input.context = workflow.context;

    return input;
  }
}

/**
 * 创建工作流引擎
 * @param {Object} options - 配置选项
 * @returns {WorkflowEngine} - 工作流引擎实例
 */
export function createWorkflowEngine(options) {
  return new WorkflowEngine(options);
}

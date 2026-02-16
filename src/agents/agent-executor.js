/**
 * Agent 执行引擎
 * 负责 Agent 的调度、执行和结果管理
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/logger.js';
import { generateId } from '../utils/index.js';

const logger = new Logger('AgentExecutor');

/**
 * 执行状态枚举
 */
export const ExecutionStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Agent 执行器类
 */
export class AgentExecutor extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();

    this.registry = options.registry;
    this.maxConcurrent = options.maxConcurrent || 5;
    this.timeout = options.timeout || 300000; // 5 分钟默认超时

    // 执行队列
    this.executionQueue = [];
    this.runningExecutions = new Map(); // id -> execution
    this.completedExecutions = new Map(); // id -> execution
    this.executionHistory = [];

    // 统计
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      cancelledExecutions: 0
    };

    logger.info('Agent 执行器已初始化', {
      maxConcurrent: this.maxConcurrent,
      timeout: this.timeout
    });
  }

  /**
   * 执行 Agent
   * @param {string} agentId - Agent ID
   * @param {Object} input - 输入参数
   * @param {Object} options - 执行选项
   * @returns {Promise<Object>} - 执行结果
   */
  async execute(agentId, input, options = {}) {
    // 获取 Agent 定义
    const agent = this.registry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent 不存在: ${agentId}`);
    }

    // 创建执行记录
    const execution = {
      id: generateId(),
      agentId,
      agentName: agent.name,
      input,
      options,
      status: ExecutionStatus.PENDING,
      startTime: null,
      endTime: null,
      duration: null,
      result: null,
      error: null,
      metadata: {
        model: options.model || agent.preferredModel,
        timeout: options.timeout || this.timeout
      }
    };

    logger.info(`创建执行任务: ${execution.id}`, {
      agent: agentId,
      model: execution.metadata.model
    });

    // 添加到队列
    this.executionQueue.push(execution);
    this.stats.totalExecutions++;

    // 触发事件
    this.emit('executionCreated', execution);

    // 处理队列
    this._processQueue();

    // 等待执行完成
    return this._waitForExecution(execution.id);
  }

  /**
   * 批量执行 Agent
   * @param {Array<Object>} tasks - 任务列表
   * @returns {Promise<Array<Object>>} - 执行结果列表
   */
  async executeBatch(tasks) {
    logger.info(`批量执行 ${tasks.length} 个任务`);

    const promises = tasks.map(task =>
      this.execute(task.agentId, task.input, task.options)
    );

    return Promise.allSettled(promises);
  }

  /**
   * 取消执行
   * @param {string} executionId - 执行 ID
   * @returns {boolean} - 是否成功取消
   */
  cancelExecution(executionId) {
    // 检查是否在队列中
    const queueIndex = this.executionQueue.findIndex(e => e.id === executionId);
    if (queueIndex > -1) {
      const execution = this.executionQueue[queueIndex];
      execution.status = ExecutionStatus.CANCELLED;
      this.executionQueue.splice(queueIndex, 1);
      this.completedExecutions.set(executionId, execution);
      this.stats.cancelledExecutions++;

      logger.info(`取消队列中的执行: ${executionId}`);
      this.emit('executionCancelled', execution);
      return true;
    }

    // 检查是否正在运行
    const running = this.runningExecutions.get(executionId);
    if (running) {
      running.status = ExecutionStatus.CANCELLED;
      running.endTime = Date.now();
      running.duration = running.endTime - running.startTime;

      this.runningExecutions.delete(executionId);
      this.completedExecutions.set(executionId, running);
      this.stats.cancelledExecutions++;

      logger.info(`取消正在运行的执行: ${executionId}`);
      this.emit('executionCancelled', running);
      return true;
    }

    logger.warn(`执行不存在或已完成: ${executionId}`);
    return false;
  }

  /**
   * 获取执行状态
   * @param {string} executionId - 执行 ID
   * @returns {Object|null} - 执行信息
   */
  getExecution(executionId) {
    // 检查正在运行
    if (this.runningExecutions.has(executionId)) {
      return this.runningExecutions.get(executionId);
    }

    // 检查已完成
    if (this.completedExecutions.has(executionId)) {
      return this.completedExecutions.get(executionId);
    }

    // 检查队列
    const queued = this.executionQueue.find(e => e.id === executionId);
    if (queued) {
      return queued;
    }

    return null;
  }

  /**
   * 获取执行历史
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 执行历史
   */
  getExecutionHistory(filters = {}) {
    let history = Array.from(this.completedExecutions.values());

    // 按 Agent 过滤
    if (filters.agentId) {
      history = history.filter(e => e.agentId === filters.agentId);
    }

    // 按状态过滤
    if (filters.status) {
      history = history.filter(e => e.status === filters.status);
    }

    // 按时间范围过滤
    if (filters.startTime) {
      history = history.filter(e => e.startTime >= filters.startTime);
    }

    if (filters.endTime) {
      history = history.filter(e => e.endTime <= filters.endTime);
    }

    // 排序（最新的在前）
    history.sort((a, b) => b.startTime - a.startTime);

    // 限制数量
    if (filters.limit) {
      history = history.slice(0, filters.limit);
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
      queueLength: this.executionQueue.length,
      runningCount: this.runningExecutions.size,
      completedCount: this.completedExecutions.size,
      successRate: this.stats.totalExecutions > 0
        ? (this.stats.successfulExecutions / this.stats.totalExecutions * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * 清理历史记录
   * @param {number} maxAge - 最大保留时间（毫秒）
   */
  cleanupHistory(maxAge = 86400000) { // 默认 24 小时
    const now = Date.now();
    const toDelete = [];

    for (const [id, execution] of this.completedExecutions.entries()) {
      if (execution.endTime && (now - execution.endTime) > maxAge) {
        toDelete.push(id);
      }
    }

    toDelete.forEach(id => this.completedExecutions.delete(id));

    if (toDelete.length > 0) {
      logger.info(`清理了 ${toDelete.length} 条历史记录`);
    }
  }

  /**
   * 处理执行队列
   * @private
   */
  _processQueue() {
    // 检查是否可以执行更多任务
    while (
      this.executionQueue.length > 0 &&
      this.runningExecutions.size < this.maxConcurrent
    ) {
      const execution = this.executionQueue.shift();
      this._executeTask(execution);
    }
  }

  /**
   * 执行任务
   * @private
   * @param {Object} execution - 执行记录
   */
  async _executeTask(execution) {
    execution.status = ExecutionStatus.RUNNING;
    execution.startTime = Date.now();

    this.runningExecutions.set(execution.id, execution);
    this.emit('executionStarted', execution);

    // 更新 Agent 状态
    this.registry.updateStatus(execution.agentId, 'busy');

    logger.info(`开始执行: ${execution.id}`, {
      agent: execution.agentId
    });

    try {
      // 模拟 Agent 执行（实际实现需要调用 Claude API）
      const result = await this._simulateAgentExecution(execution);

      execution.status = ExecutionStatus.COMPLETED;
      execution.result = result;
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;

      this.stats.successfulExecutions++;

      // 记录 Agent 调用
      this.registry.recordCall(execution.agentId, true, execution.duration);

      logger.info(`执行完成: ${execution.id}`, {
        duration: execution.duration + 'ms'
      });

      this.emit('executionCompleted', execution);
    } catch (error) {
      execution.status = ExecutionStatus.FAILED;
      execution.error = error.message;
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;

      this.stats.failedExecutions++;

      // 记录 Agent 调用
      this.registry.recordCall(execution.agentId, false, execution.duration);

      logger.error(`执行失败: ${execution.id}`, error);

      this.emit('executionFailed', execution);
    } finally {
      // 更新 Agent 状态
      this.registry.updateStatus(execution.agentId, 'idle');

      // 移动到已完成
      this.runningExecutions.delete(execution.id);
      this.completedExecutions.set(execution.id, execution);

      // 继续处理队列
      this._processQueue();
    }
  }

  /**
   * 模拟 Agent 执行
   * @private
   * @param {Object} execution - 执行记录
   * @returns {Promise<Object>} - 执行结果
   */
  async _simulateAgentExecution(execution) {
    // TODO: 实际实现需要调用 Claude API
    // 这里只是模拟执行
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      output: `Agent ${execution.agentName} 执行完成`,
      metadata: {
        model: execution.metadata.model,
        executionTime: 1000
      }
    };
  }

  /**
   * 等待执行完成
   * @private
   * @param {string} executionId - 执行 ID
   * @returns {Promise<Object>} - 执行结果
   */
  _waitForExecution(executionId) {
    return new Promise((resolve, reject) => {
      const checkExecution = () => {
        const execution = this.getExecution(executionId);

        if (!execution) {
          reject(new Error(`执行不存在: ${executionId}`));
          return;
        }

        if (execution.status === ExecutionStatus.COMPLETED) {
          resolve(execution.result);
        } else if (execution.status === ExecutionStatus.FAILED) {
          reject(new Error(execution.error));
        } else if (execution.status === ExecutionStatus.CANCELLED) {
          reject(new Error('执行已取消'));
        } else {
          // 继续等待
          setTimeout(checkExecution, 100);
        }
      };

      checkExecution();
    });
  }
}

/**
 * 创建 Agent 执行器
 * @param {Object} options - 配置选项
 * @returns {AgentExecutor} - 执行器实例
 */
export function createAgentExecutor(options) {
  return new AgentExecutor(options);
}

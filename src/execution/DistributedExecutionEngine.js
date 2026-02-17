/**
 * 分布式执行引擎
 * 支持远程Agent、任务分片、并行执行和结果聚合
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/logger.js';

const logger = new Logger('DistributedExecutionEngine');

/**
 * 任务状态枚举
 */
export const TaskStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * 执行模式枚举
 */
export const ExecutionMode = {
  LOCAL: 'local',
  REMOTE: 'remote',
  HYBRID: 'hybrid'
};

/**
 * 分布式执行引擎类
 */
export class DistributedExecutionEngine extends EventEmitter {
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
      shardSize: 100,
      aggregationStrategy: 'merge',
      ...options
    };

    // 任务队列
    this.tasks = new Map();

    // 执行器注册表
    this.executors = new Map();

    // 运行中的任务
    this.runningTasks = new Set();

    // 任务分片
    this.shards = new Map();

    // 结果缓存
    this.results = new Map();

    logger.info('分布式执行引擎已初始化', this.options);
  }

  /**
   * 注册执行器
   * @param {string} executorId - 执行器ID
   * @param {Object} config - 执行器配置
   */
  registerExecutor(executorId, config) {
    const executor = {
      id: executorId,
      name: config.name,
      type: config.type || ExecutionMode.LOCAL,
      endpoint: config.endpoint,
      capabilities: config.capabilities || [],
      capacity: config.capacity || 10,
      currentLoad: 0,
      status: 'active',
      metadata: config.metadata || {},
      registeredAt: Date.now()
    };

    this.executors.set(executorId, executor);

    logger.info('执行器已注册', { executorId, type: executor.type });
    this.emit('executor_registered', { executorId, executor });

    return executor;
  }

  /**
   * 注销执行器
   * @param {string} executorId - 执行器ID
   */
  unregisterExecutor(executorId) {
    const executor = this.executors.get(executorId);

    if (!executor) {
      logger.warn('执行器未找到', { executorId });
      return;
    }

    this.executors.delete(executorId);

    logger.info('执行器已注销', { executorId });
    this.emit('executor_unregistered', { executorId });
  }

  /**
   * 提交任务
   * @param {Object} taskDef - 任务定义
   * @returns {string} 任务ID
   */
  submitTask(taskDef) {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const task = {
      id: taskId,
      name: taskDef.name,
      handler: taskDef.handler,
      input: taskDef.input,
      mode: taskDef.mode || ExecutionMode.LOCAL,
      shardable: taskDef.shardable || false,
      shardKey: taskDef.shardKey,
      requirements: taskDef.requirements || [],
      status: TaskStatus.PENDING,
      result: null,
      error: null,
      startTime: null,
      endTime: null,
      retries: 0,
      createdAt: Date.now()
    };

    this.tasks.set(taskId, task);

    logger.info('任务已提交', { taskId, name: task.name, mode: task.mode });
    this.emit('task_submitted', { taskId, task });

    return taskId;
  }

  /**
   * 执行任务
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 执行结果
   */
  async executeTask(taskId) {
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new Error(`任务未找到: ${taskId}`);
    }

    if (task.status === TaskStatus.RUNNING) {
      throw new Error(`任务正在运行: ${taskId}`);
    }

    task.status = TaskStatus.RUNNING;
    task.startTime = Date.now();
    this.runningTasks.add(taskId);

    logger.info('任务开始执行', { taskId, mode: task.mode });
    this.emit('task_started', { taskId });

    try {
      let result;

      // 根据任务模式选择执行方式
      if (task.shardable && task.input && Array.isArray(task.input)) {
        // 分片执行
        result = await this._executeSharded(task);
      } else if (task.mode === ExecutionMode.REMOTE) {
        // 远程执行
        result = await this._executeRemote(task);
      } else if (task.mode === ExecutionMode.HYBRID) {
        // 混合执行
        result = await this._executeHybrid(task);
      } else {
        // 本地执行
        result = await this._executeLocal(task);
      }

      task.status = TaskStatus.COMPLETED;
      task.endTime = Date.now();
      task.result = result;

      logger.info('任务执行完成', {
        taskId,
        duration: task.endTime - task.startTime
      });

      this.emit('task_completed', { taskId, result });

      return result;

    } catch (error) {
      task.status = TaskStatus.FAILED;
      task.endTime = Date.now();
      task.error = error.message;

      logger.error('任务执行失败', { taskId, error: error.message });
      this.emit('task_failed', { taskId, error });

      // 重试逻辑
      if (task.retries < this.options.retryAttempts) {
        task.retries++;
        task.status = TaskStatus.PENDING;

        logger.info('任务将重试', { taskId, attempt: task.retries });

        await this._delay(this.options.retryDelay * task.retries);
        return await this.executeTask(taskId);
      }

      throw error;

    } finally {
      this.runningTasks.delete(taskId);
    }
  }

  /**
   * 本地执行
   * @private
   */
  async _executeLocal(task) {
    const executor = this._selectExecutor(ExecutionMode.LOCAL, task.requirements);

    if (!executor) {
      throw new Error('没有可用的本地执行器');
    }

    executor.currentLoad++;

    try {
      const result = await task.handler(task.input);
      return result;
    } finally {
      executor.currentLoad = Math.max(0, executor.currentLoad - 1);
    }
  }

  /**
   * 远程执行
   * @private
   */
  async _executeRemote(task) {
    const executor = this._selectExecutor(ExecutionMode.REMOTE, task.requirements);

    if (!executor) {
      throw new Error('没有可用的远程执行器');
    }

    executor.currentLoad++;

    try {
      // 模拟远程调用
      // 实际实现中应该通过网络调用远程执行器
      const result = await task.handler(task.input);
      return result;
    } finally {
      executor.currentLoad = Math.max(0, executor.currentLoad - 1);
    }
  }

  /**
   * 混合执行
   * @private
   */
  async _executeHybrid(task) {
    // 尝试本地执行，失败则远程执行
    try {
      return await this._executeLocal(task);
    } catch (error) {
      logger.warn('本地执行失败，尝试远程执行', { taskId: task.id });
      return await this._executeRemote(task);
    }
  }

  /**
   * 分片执行
   * @private
   */
  async _executeSharded(task) {
    const input = task.input;
    const shardSize = this.options.shardSize;

    // 创建分片
    const shards = [];
    for (let i = 0; i < input.length; i += shardSize) {
      shards.push({
        id: `${task.id}-shard-${i / shardSize}`,
        data: input.slice(i, i + shardSize),
        index: i / shardSize
      });
    }

    logger.info('任务已分片', { taskId: task.id, shardCount: shards.length });

    // 并行执行分片
    const shardResults = await this._executeParallel(
      shards,
      async (shard) => {
        const executor = this._selectExecutor(task.mode, task.requirements);

        if (!executor) {
          throw new Error('没有可用的执行器');
        }

        executor.currentLoad++;

        try {
          const result = await task.handler(shard.data);
          return { shardId: shard.id, index: shard.index, result };
        } finally {
          executor.currentLoad = Math.max(0, executor.currentLoad - 1);
        }
      }
    );

    // 聚合结果
    const aggregatedResult = this._aggregateResults(shardResults, task);

    return aggregatedResult;
  }

  /**
   * 并行执行
   * @private
   */
  async _executeParallel(items, handler) {
    const results = [];
    const executing = [];
    const concurrency = this.options.maxConcurrency;

    for (const item of items) {
      const promise = handler(item)
        .then(result => {
          results.push(result);
          return result;
        })
        .catch(error => {
          results.push({ error: error.message });
          return null;
        });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        const index = executing.findIndex(p => p === promise);
        if (index !== -1) {
          executing.splice(index, 1);
        }
      }
    }

    await Promise.all(executing);

    return results;
  }

  /**
   * 聚合结果
   * @private
   */
  _aggregateResults(shardResults, task) {
    const strategy = this.options.aggregationStrategy;

    switch (strategy) {
      case 'merge':
        // 合并所有结果
        return shardResults
          .sort((a, b) => a.index - b.index)
          .flatMap(shard => shard.result);

      case 'reduce':
        // 归约结果
        return shardResults.reduce((acc, shard) => {
          if (Array.isArray(shard.result)) {
            return acc.concat(shard.result);
          }
          return acc;
        }, []);

      case 'collect':
        // 收集所有结果
        return shardResults.map(shard => shard.result);

      default:
        return shardResults;
    }
  }

  /**
   * 选择执行器
   * @private
   */
  _selectExecutor(mode, requirements = []) {
    const candidates = Array.from(this.executors.values())
      .filter(e => e.type === mode && e.status === 'active')
      .filter(e => {
        // 检查能力要求
        if (requirements.length === 0) return true;
        return requirements.every(req => e.capabilities.includes(req));
      })
      .filter(e => e.currentLoad < e.capacity);

    if (candidates.length === 0) {
      return null;
    }

    // 选择负载最小的执行器
    return candidates.reduce((min, executor) =>
      executor.currentLoad < min.currentLoad ? executor : min
    );
  }

  /**
   * 取消任务
   * @param {string} taskId - 任务ID
   */
  cancelTask(taskId) {
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new Error(`任务未找到: ${taskId}`);
    }

    task.status = TaskStatus.CANCELLED;
    task.endTime = Date.now();
    this.runningTasks.delete(taskId);

    logger.info('任务已取消', { taskId });
    this.emit('task_cancelled', { taskId });
  }

  /**
   * 获取任务状态
   * @param {string} taskId - 任务ID
   * @returns {Object} 任务状态
   */
  getTaskStatus(taskId) {
    const task = this.tasks.get(taskId);

    if (!task) {
      return null;
    }

    return {
      id: task.id,
      name: task.name,
      status: task.status,
      mode: task.mode,
      startTime: task.startTime,
      endTime: task.endTime,
      duration: task.endTime && task.startTime
        ? task.endTime - task.startTime
        : null,
      retries: task.retries
    };
  }

  /**
   * 获取执行器状态
   * @param {string} executorId - 执行器ID
   * @returns {Object} 执行器状态
   */
  getExecutorStatus(executorId) {
    const executor = this.executors.get(executorId);

    if (!executor) {
      return null;
    }

    return {
      id: executor.id,
      name: executor.name,
      type: executor.type,
      status: executor.status,
      currentLoad: executor.currentLoad,
      capacity: executor.capacity,
      loadPercentage: (executor.currentLoad / executor.capacity) * 100,
      capabilities: executor.capabilities
    };
  }

  /**
   * 获取所有任务
   * @returns {Array} 任务列表
   */
  getAllTasks() {
    return Array.from(this.tasks.values()).map(task => ({
      id: task.id,
      name: task.name,
      status: task.status,
      mode: task.mode,
      createdAt: task.createdAt
    }));
  }

  /**
   * 获取所有执行器
   * @returns {Array} 执行器列表
   */
  getAllExecutors() {
    return Array.from(this.executors.values()).map(executor => ({
      id: executor.id,
      name: executor.name,
      type: executor.type,
      status: executor.status,
      currentLoad: executor.currentLoad,
      capacity: executor.capacity
    }));
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const totalTasks = this.tasks.size;
    const runningTasks = this.runningTasks.size;
    const completedTasks = Array.from(this.tasks.values())
      .filter(t => t.status === TaskStatus.COMPLETED).length;
    const failedTasks = Array.from(this.tasks.values())
      .filter(t => t.status === TaskStatus.FAILED).length;

    const totalExecutors = this.executors.size;
    const activeExecutors = Array.from(this.executors.values())
      .filter(e => e.status === 'active').length;

    const totalLoad = Array.from(this.executors.values())
      .reduce((sum, e) => sum + e.currentLoad, 0);

    const totalCapacity = Array.from(this.executors.values())
      .reduce((sum, e) => sum + e.capacity, 0);

    return {
      tasks: {
        total: totalTasks,
        running: runningTasks,
        completed: completedTasks,
        failed: failedTasks,
        successRate: totalTasks > 0 ? completedTasks / totalTasks : 0
      },
      executors: {
        total: totalExecutors,
        active: activeExecutors,
        totalLoad,
        totalCapacity,
        utilizationRate: totalCapacity > 0 ? totalLoad / totalCapacity : 0
      }
    };
  }

  /**
   * 延迟Promise
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 销毁执行引擎
   */
  destroy() {
    // 取消所有运行中的任务
    for (const taskId of this.runningTasks) {
      try {
        this.cancelTask(taskId);
      } catch (error) {
        logger.error('取消任务失败', { taskId, error: error.message });
      }
    }

    this.tasks.clear();
    this.executors.clear();
    this.runningTasks.clear();
    this.shards.clear();
    this.results.clear();
    this.removeAllListeners();

    logger.info('分布式执行引擎已销毁');
  }
}

export default DistributedExecutionEngine;

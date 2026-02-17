/**
 * 智能路由引擎
 * 提供负载感知、上下文路由、故障转移和自动重试机制
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/logger.js';

const logger = new Logger('IntelligentRouter');

/**
 * 路由策略枚举
 */
export const RoutingStrategy = {
  ROUND_ROBIN: 'round_robin',
  LEAST_LOAD: 'least_load',
  WEIGHTED: 'weighted',
  CONTEXT_AWARE: 'context_aware',
  RANDOM: 'random'
};

/**
 * 节点状态枚举
 */
export const NodeStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  OFFLINE: 'offline'
};

/**
 * 智能路由引擎类
 */
export class IntelligentRouter extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();

    this.options = {
      defaultStrategy: RoutingStrategy.LEAST_LOAD,
      healthCheckInterval: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000,
      loadThreshold: 0.8,
      ...options
    };

    // 节点注册表
    this.nodes = new Map();

    // 路由策略
    this.strategies = new Map();

    // 负载统计
    this.loadStats = new Map();

    // 路由计数器（用于轮询）
    this.roundRobinCounters = new Map();

    // 健康检查定时器
    this.healthCheckTimers = new Map();

    // 初始化内置策略
    this._initializeStrategies();

    logger.info('智能路由引擎已初始化', this.options);
  }

  /**
   * 初始化内置路由策略
   * @private
   */
  _initializeStrategies() {
    // 轮询策略
    this.strategies.set(RoutingStrategy.ROUND_ROBIN, (nodes, context, group) => {
      const counter = this.roundRobinCounters.get(group) || 0;
      const node = nodes[counter % nodes.length];
      this.roundRobinCounters.set(group, counter + 1);
      return node;
    });

    // 最小负载策略
    this.strategies.set(RoutingStrategy.LEAST_LOAD, (nodes) => {
      return nodes.reduce((min, node) => {
        const minLoad = this.loadStats.get(min.id)?.currentLoad || 0;
        const nodeLoad = this.loadStats.get(node.id)?.currentLoad || 0;
        return nodeLoad < minLoad ? node : min;
      });
    });

    // 加权策略
    this.strategies.set(RoutingStrategy.WEIGHTED, (nodes) => {
      const totalWeight = nodes.reduce((sum, node) => sum + (node.weight || 1), 0);
      let random = Math.random() * totalWeight;

      for (const node of nodes) {
        random -= node.weight || 1;
        if (random <= 0) return node;
      }

      return nodes[0];
    });

    // 随机策略
    this.strategies.set(RoutingStrategy.RANDOM, (nodes) => {
      return nodes[Math.floor(Math.random() * nodes.length)];
    });

    // 上下文感知策略
    this.strategies.set(RoutingStrategy.CONTEXT_AWARE, (nodes, context) => {
      // 根据上下文选择最合适的节点
      if (context.preferredNode) {
        const preferred = nodes.find(n => n.id === context.preferredNode);
        if (preferred) return preferred;
      }

      if (context.tags && context.tags.length > 0) {
        const matching = nodes.filter(n =>
          n.tags && n.tags.some(tag => context.tags.includes(tag))
        );
        if (matching.length > 0) {
          return this.strategies.get(RoutingStrategy.LEAST_LOAD)(matching);
        }
      }

      return this.strategies.get(RoutingStrategy.LEAST_LOAD)(nodes);
    });
  }

  /**
   * 注册节点
   * @param {string} nodeId - 节点ID
   * @param {Object} config - 节点配置
   */
  registerNode(nodeId, config) {
    const node = {
      id: nodeId,
      name: config.name,
      endpoint: config.endpoint,
      group: config.group || 'default',
      weight: config.weight || 1,
      tags: config.tags || [],
      capacity: config.capacity || 100,
      status: NodeStatus.HEALTHY,
      metadata: config.metadata || {},
      registeredAt: Date.now()
    };

    this.nodes.set(nodeId, node);

    // 初始化负载统计
    this.loadStats.set(nodeId, {
      currentLoad: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: null
    });

    logger.info('节点已注册', { nodeId, group: node.group });
    this.emit('node_registered', { nodeId, node });

    // 启动健康检查
    if (config.healthCheck) {
      this._startHealthCheck(nodeId, config.healthCheck);
    }

    return node;
  }

  /**
   * 注销节点
   * @param {string} nodeId - 节点ID
   */
  unregisterNode(nodeId) {
    const node = this.nodes.get(nodeId);

    if (!node) {
      logger.warn('节点未找到', { nodeId });
      return;
    }

    // 停止健康检查
    this._stopHealthCheck(nodeId);

    // 移除节点
    this.nodes.delete(nodeId);
    this.loadStats.delete(nodeId);

    logger.info('节点已注销', { nodeId });
    this.emit('node_unregistered', { nodeId });
  }

  /**
   * 路由请求
   * @param {string} group - 节点组
   * @param {Object} context - 路由上下文
   * @param {string} strategy - 路由策略
   * @returns {Object} 选中的节点
   */
  route(group = 'default', context = {}, strategy = null) {
    const routingStrategy = strategy || this.options.defaultStrategy;

    // 获取组内的健康节点
    const healthyNodes = this._getHealthyNodes(group);

    if (healthyNodes.length === 0) {
      throw new Error(`没有可用的健康节点: ${group}`);
    }

    // 应用路由策略
    const strategyFn = this.strategies.get(routingStrategy);

    if (!strategyFn) {
      throw new Error(`未知的路由策略: ${routingStrategy}`);
    }

    const selectedNode = strategyFn(healthyNodes, context, group);

    logger.info('路由完成', {
      group,
      strategy: routingStrategy,
      selectedNode: selectedNode.id
    });

    this.emit('route', { group, strategy: routingStrategy, node: selectedNode });

    return selectedNode;
  }

  /**
   * 执行请求（带重试和故障转移）
   * @param {string} group - 节点组
   * @param {Function} handler - 请求处理函数
   * @param {Object} context - 路由上下文
   * @returns {Promise<Object>} 请求结果
   */
  async execute(group, handler, context = {}) {
    let lastError = null;
    let attempts = 0;

    while (attempts < this.options.maxRetries) {
      attempts++;

      try {
        // 路由到节点
        const node = this.route(group, context);

        // 记录请求开始
        this._recordRequestStart(node.id);

        const startTime = Date.now();

        // 执行请求
        const result = await Promise.race([
          handler(node, context),
          this._timeout(this.options.timeout)
        ]);

        const duration = Date.now() - startTime;

        // 记录请求成功
        this._recordRequestSuccess(node.id, duration);

        logger.info('请求执行成功', {
          nodeId: node.id,
          attempt: attempts,
          duration
        });

        return result;

      } catch (error) {
        lastError = error;

        logger.warn('请求执行失败', {
          attempt: attempts,
          error: error.message
        });

        // 记录请求失败
        if (error.nodeId) {
          this._recordRequestFailure(error.nodeId);
        }

        // 如果还有重试次数，等待后重试
        if (attempts < this.options.maxRetries) {
          await this._delay(this.options.retryDelay * attempts);
        }
      }
    }

    // 所有重试都失败
    logger.error('请求执行失败（已达最大重试次数）', {
      attempts,
      error: lastError.message
    });

    throw lastError;
  }

  /**
   * 注册自定义路由策略
   * @param {string} name - 策略名称
   * @param {Function} strategy - 策略函数
   */
  registerStrategy(name, strategy) {
    if (typeof strategy !== 'function') {
      throw new Error('策略必须是函数');
    }

    this.strategies.set(name, strategy);
    logger.info('路由策略已注册', { name });
  }

  /**
   * 更新节点状态
   * @param {string} nodeId - 节点ID
   * @param {string} status - 节点状态
   */
  updateNodeStatus(nodeId, status) {
    const node = this.nodes.get(nodeId);

    if (!node) {
      throw new Error(`节点未找到: ${nodeId}`);
    }

    const oldStatus = node.status;
    node.status = status;

    logger.info('节点状态已更新', { nodeId, oldStatus, newStatus: status });
    this.emit('node_status_changed', { nodeId, oldStatus, newStatus: status });
  }

  /**
   * 获取健康节点
   * @private
   */
  _getHealthyNodes(group) {
    return Array.from(this.nodes.values())
      .filter(node =>
        node.group === group &&
        (node.status === NodeStatus.HEALTHY || node.status === NodeStatus.DEGRADED)
      )
      .filter(node => {
        const stats = this.loadStats.get(node.id);
        return !stats || stats.currentLoad < node.capacity * this.options.loadThreshold;
      });
  }

  /**
   * 记录请求开始
   * @private
   */
  _recordRequestStart(nodeId) {
    const stats = this.loadStats.get(nodeId);
    if (stats) {
      stats.currentLoad++;
      stats.totalRequests++;
      stats.lastRequestTime = Date.now();
    }
  }

  /**
   * 记录请求成功
   * @private
   */
  _recordRequestSuccess(nodeId, duration) {
    const stats = this.loadStats.get(nodeId);
    if (stats) {
      stats.currentLoad = Math.max(0, stats.currentLoad - 1);
      stats.successfulRequests++;

      // 更新平均响应时间
      const total = stats.successfulRequests;
      stats.averageResponseTime =
        (stats.averageResponseTime * (total - 1) + duration) / total;
    }
  }

  /**
   * 记录请求失败
   * @private
   */
  _recordRequestFailure(nodeId) {
    const stats = this.loadStats.get(nodeId);
    if (stats) {
      stats.currentLoad = Math.max(0, stats.currentLoad - 1);
      stats.failedRequests++;

      // 检查是否需要降级节点状态
      const failureRate = stats.failedRequests / stats.totalRequests;
      if (failureRate > 0.5 && stats.totalRequests > 10) {
        this.updateNodeStatus(nodeId, NodeStatus.DEGRADED);
      }
    }
  }

  /**
   * 启动健康检查
   * @private
   */
  _startHealthCheck(nodeId, healthCheck) {
    const timer = setInterval(async () => {
      try {
        const isHealthy = await healthCheck();

        const node = this.nodes.get(nodeId);
        if (node) {
          const newStatus = isHealthy ? NodeStatus.HEALTHY : NodeStatus.UNHEALTHY;
          if (node.status !== newStatus) {
            this.updateNodeStatus(nodeId, newStatus);
          }
        }

      } catch (error) {
        logger.error('健康检查失败', { nodeId, error: error.message });
        this.updateNodeStatus(nodeId, NodeStatus.UNHEALTHY);
      }
    }, this.options.healthCheckInterval);

    this.healthCheckTimers.set(nodeId, timer);
  }

  /**
   * 停止健康检查
   * @private
   */
  _stopHealthCheck(nodeId) {
    const timer = this.healthCheckTimers.get(nodeId);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(nodeId);
    }
  }

  /**
   * 超时Promise
   * @private
   */
  _timeout(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), ms);
    });
  }

  /**
   * 延迟Promise
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取节点统计
   * @param {string} nodeId - 节点ID
   * @returns {Object} 节点统计
   */
  getNodeStats(nodeId) {
    const node = this.nodes.get(nodeId);
    const stats = this.loadStats.get(nodeId);

    if (!node || !stats) {
      return null;
    }

    return {
      id: node.id,
      name: node.name,
      group: node.group,
      status: node.status,
      currentLoad: stats.currentLoad,
      capacity: node.capacity,
      loadPercentage: (stats.currentLoad / node.capacity) * 100,
      totalRequests: stats.totalRequests,
      successfulRequests: stats.successfulRequests,
      failedRequests: stats.failedRequests,
      successRate: stats.totalRequests > 0
        ? stats.successfulRequests / stats.totalRequests
        : 0,
      averageResponseTime: stats.averageResponseTime
    };
  }

  /**
   * 获取所有节点
   * @param {string} group - 节点组（可选）
   * @returns {Array} 节点列表
   */
  getAllNodes(group = null) {
    let nodes = Array.from(this.nodes.values());

    if (group) {
      nodes = nodes.filter(n => n.group === group);
    }

    return nodes.map(node => ({
      id: node.id,
      name: node.name,
      group: node.group,
      status: node.status,
      endpoint: node.endpoint
    }));
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const total = this.nodes.size;
    const byStatus = {};
    const byGroup = {};

    for (const node of this.nodes.values()) {
      byStatus[node.status] = (byStatus[node.status] || 0) + 1;
      byGroup[node.group] = (byGroup[node.group] || 0) + 1;
    }

    const totalRequests = Array.from(this.loadStats.values())
      .reduce((sum, stats) => sum + stats.totalRequests, 0);

    const successfulRequests = Array.from(this.loadStats.values())
      .reduce((sum, stats) => sum + stats.successfulRequests, 0);

    return {
      total,
      byStatus,
      byGroup,
      strategies: this.strategies.size,
      totalRequests,
      successfulRequests,
      successRate: totalRequests > 0 ? successfulRequests / totalRequests : 0
    };
  }

  /**
   * 销毁路由引擎
   */
  destroy() {
    // 停止所有健康检查
    for (const nodeId of this.healthCheckTimers.keys()) {
      this._stopHealthCheck(nodeId);
    }

    this.nodes.clear();
    this.strategies.clear();
    this.loadStats.clear();
    this.roundRobinCounters.clear();
    this.healthCheckTimers.clear();
    this.removeAllListeners();

    logger.info('智能路由引擎已销毁');
  }
}

export default IntelligentRouter;

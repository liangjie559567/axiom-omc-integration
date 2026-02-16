/**
 * Agent 系统 - 多智能体协调
 *
 * 负责：
 * - Agent 生命周期管理
 * - 任务分配和调度
 * - Agent 间通信
 * - 结果聚合
 */

// 导出新的 Agent 系统
export * from './agent-registry.js';
export * from './agent-executor.js';
export * from './workflow-engine.js';
export * from './agent-system.js';
export * from './schemas/agent-schema.js';
export * from './definitions/index.js';

// 兼容旧接口
import { Logger } from '../core/logger.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const logger = new Logger('Agents');

/**
 * Agent 注册表类
 * 管理所有 Agent 的定义、注册和查询
 */
export class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.categories = new Map();
  }

  /**
   * 从配置文件加载 Agent 定义
   * @param {string} configPath - 配置文件路径
   */
  async loadAgentDefinitions(configPath = 'config/agents.json') {
    try {
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      if (!config.agents) {
        throw new Error('配置文件缺少 agents 字段');
      }

      let loadedCount = 0;
      for (const [name, definition] of Object.entries(config.agents)) {
        this.registerAgent(name, definition);
        loadedCount++;
      }

      logger.info(`已加载 ${loadedCount} 个 Agent 定义`);
      return loadedCount;
    } catch (error) {
      logger.error('加载 Agent 定义失败:', error.message);
      throw error;
    }
  }

  /**
   * 注册单个 Agent
   * @param {string} name - Agent 名称
   * @param {Object} definition - Agent 定义
   */
  registerAgent(name, definition) {
    if (!definition.model) {
      throw new Error(`Agent ${name} 缺少 model 字段`);
    }

    const agent = {
      name,
      description: definition.description || '',
      model: definition.model,
      systemPrompt: definition.systemPrompt || '',
      capabilities: definition.capabilities || [],
      priority: definition.priority || 'medium',
      category: definition.category || 'general',
      metadata: definition.metadata || {},
      registeredAt: new Date().toISOString()
    };

    this.agents.set(name, agent);

    // 按类别索引
    const category = agent.category;
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category).push(name);

    logger.debug(`已注册 Agent: ${name} [${agent.model}]`);
    return true;
  }

  /**
   * 获取 Agent 定义
   * @param {string} name - Agent 名称
   * @returns {Object|null} Agent 定义
   */
  getAgent(name) {
    return this.agents.get(name) || null;
  }

  /**
   * 检查 Agent 是否存在
   * @param {string} name - Agent 名称
   * @returns {boolean}
   */
  hasAgent(name) {
    return this.agents.has(name);
  }

  /**
   * 获取所有 Agent 列表
   * @param {Object} filters - 过滤条件
   * @returns {Array} Agent 列表
   */
  listAgents(filters = {}) {
    let agents = Array.from(this.agents.values());

    // 按模型过滤
    if (filters.model) {
      agents = agents.filter(a => a.model === filters.model);
    }

    // 按类别过滤
    if (filters.category) {
      agents = agents.filter(a => a.category === filters.category);
    }

    // 按优先级过滤
    if (filters.priority) {
      agents = agents.filter(a => a.priority === filters.priority);
    }

    // 按能力过滤
    if (filters.capability) {
      agents = agents.filter(a =>
        a.capabilities.includes(filters.capability)
      );
    }

    return agents;
  }

  /**
   * 按类别获取 Agent
   * @param {string} category - 类别名称
   * @returns {Array} Agent 名称列表
   */
  getAgentsByCategory(category) {
    return this.categories.get(category) || [];
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const stats = {
      total: this.agents.size,
      byModel: {},
      byCategory: {},
      byPriority: {}
    };

    for (const agent of this.agents.values()) {
      // 按模型统计
      stats.byModel[agent.model] = (stats.byModel[agent.model] || 0) + 1;

      // 按类别统计
      stats.byCategory[agent.category] = (stats.byCategory[agent.category] || 0) + 1;

      // 按优先级统计
      stats.byPriority[agent.priority] = (stats.byPriority[agent.priority] || 0) + 1;
    }

    return stats;
  }

  /**
   * 注销 Agent
   * @param {string} name - Agent 名称
   * @returns {boolean}
   */
  unregisterAgent(name) {
    const agent = this.agents.get(name);
    if (!agent) {
      return false;
    }

    // 从类别索引中移除
    const category = agent.category;
    if (this.categories.has(category)) {
      const agents = this.categories.get(category);
      const index = agents.indexOf(name);
      if (index > -1) {
        agents.splice(index, 1);
      }
    }

    this.agents.delete(name);
    logger.info(`已注销 Agent: ${name}`);
    return true;
  }
}

/**
 * Agent 管理器类
 * 负责 Agent 的执行和生命周期管理
 */
export class AgentManager {
  constructor(registry = null) {
    this.registry = registry || new AgentRegistry();
    this.activeAgents = new Map();
    this.executionHistory = [];
  }

  /**
   * 注册 Agent（兼容旧接口）
   * @param {string} name - Agent 名称
   * @param {Object} agent - Agent 实例或定义
   */
  register(name, agent) {
    if (typeof agent.execute === 'function') {
      // 这是一个 Agent 实例
      this.activeAgents.set(name, agent);
      logger.info(`已注册 Agent 实例: ${name}`);
    } else {
      // 这是一个 Agent 定义
      this.registry.registerAgent(name, agent);
    }
  }

  /**
   * 执行 Agent 任务
   * @param {string} agentName - Agent 名称
   * @param {Object} task - 任务对象
   * @param {Object} options - 执行选项
   * @returns {Promise<any>} 执行结果
   */
  async execute(agentName, task, options = {}) {
    const startTime = Date.now();

    try {
      // 检查是否有活动的 Agent 实例
      let agent = this.activeAgents.get(agentName);

      if (!agent) {
        // 从注册表获取 Agent 定义
        const definition = this.registry.getAgent(agentName);
        if (!definition) {
          throw new Error(`Agent 不存在: ${agentName}`);
        }

        // 创建 Agent 实例（这里需要实际的 Agent 实现）
        logger.warn(`Agent ${agentName} 未实例化，使用定义执行`);

        // 记录执行历史
        const execution = {
          agentName,
          task,
          status: 'pending',
          startTime: new Date().toISOString(),
          duration: 0
        };
        this.executionHistory.push(execution);

        // 这里应该调用实际的 Agent 执行逻辑
        // 暂时返回模拟结果
        const result = {
          success: true,
          message: `Agent ${agentName} 执行完成（模拟）`,
          data: null
        };

        execution.status = 'completed';
        execution.duration = Date.now() - startTime;
        execution.result = result;

        return result;
      }

      // 执行 Agent 实例
      const result = await agent.execute(task, options);

      // 记录执行历史
      this.executionHistory.push({
        agentName,
        task,
        status: 'completed',
        startTime: new Date().toISOString(),
        duration: Date.now() - startTime,
        result
      });

      return result;

    } catch (error) {
      // 记录失败
      this.executionHistory.push({
        agentName,
        task,
        status: 'failed',
        startTime: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: error.message
      });

      logger.error(`Agent ${agentName} 执行失败:`, error.message);
      throw error;
    }
  }

  /**
   * 获取执行历史
   * @param {number} limit - 限制数量
   * @returns {Array} 执行历史
   */
  getExecutionHistory(limit = 100) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * 清除执行历史
   */
  clearHistory() {
    this.executionHistory = [];
    logger.info('执行历史已清除');
  }
}

/**
 * 初始化 Agent 系统
 * @param {string} configPath - 配置文件路径
 * @returns {Promise<AgentManager>} Agent 管理器实例
 */
export async function initializeAgents(configPath = 'config/agents.json') {
  try {
    logger.info('初始化 Agent 系统...');

    const registry = new AgentRegistry();
    await registry.loadAgentDefinitions(configPath);

    const manager = new AgentManager(registry);

    const stats = registry.getStats();
    logger.info(`Agent 系统初始化完成 - 总计 ${stats.total} 个 Agent`);
    logger.debug('Agent 统计:', stats);

    return manager;
  } catch (error) {
    logger.error('Agent 系统初始化失败:', error);
    throw error;
  }
}

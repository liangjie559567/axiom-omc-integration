/**
 * Agent 注册表
 * 管理所有 Agent 的注册、查询和调度
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/logger.js';
import { validateAgentDefinition } from './schemas/agent-schema.js';

const logger = new Logger('AgentRegistry');

/**
 * Agent 状态枚举
 */
export const AgentStatus = {
  IDLE: 'idle',
  BUSY: 'busy',
  ERROR: 'error',
  OFFLINE: 'offline'
};

/**
 * Agent 注册表类
 */
export class AgentRegistry extends EventEmitter {
  /**
   * 构造函数
   */
  constructor() {
    super();

    // Agent 存储
    this.agents = new Map(); // id -> agent definition
    this.agentsByType = new Map(); // type -> agent ids
    this.agentsByCapability = new Map(); // capability -> agent ids
    this.agentsByModel = new Map(); // model -> agent ids

    // Agent 状态追踪
    this.agentStatus = new Map(); // id -> status
    this.agentMetrics = new Map(); // id -> metrics

    // 负载均衡
    this.roundRobinCounters = new Map(); // capability -> counter

    logger.info('Agent 注册表已初始化');
  }

  /**
   * 注册 Agent
   * @param {Object} agentDef - Agent 定义
   * @returns {boolean} - 是否成功
   */
  register(agentDef) {
    // 验证 Agent 定义
    const validation = validateAgentDefinition(agentDef);
    if (!validation.valid) {
      logger.error(`Agent 定义验证失败: ${agentDef.id}`, validation.errors);
      throw new Error(`Agent 定义验证失败: ${validation.errors.join(', ')}`);
    }

    // 检查是否已注册
    if (this.agents.has(agentDef.id)) {
      logger.warn(`Agent 已存在: ${agentDef.id}`);
      return false;
    }

    // 注册 Agent
    this.agents.set(agentDef.id, agentDef);

    // 按类型索引
    if (!this.agentsByType.has(agentDef.type)) {
      this.agentsByType.set(agentDef.type, []);
    }
    this.agentsByType.get(agentDef.type).push(agentDef.id);

    // 按能力索引
    for (const capability of agentDef.capabilities) {
      if (!this.agentsByCapability.has(capability)) {
        this.agentsByCapability.set(capability, []);
      }
      this.agentsByCapability.get(capability).push(agentDef.id);
    }

    // 按模型索引
    if (!this.agentsByModel.has(agentDef.preferredModel)) {
      this.agentsByModel.set(agentDef.preferredModel, []);
    }
    this.agentsByModel.get(agentDef.preferredModel).push(agentDef.id);

    // 初始化状态
    this.agentStatus.set(agentDef.id, AgentStatus.IDLE);
    this.agentMetrics.set(agentDef.id, {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      avgExecutionTime: 0,
      lastUsed: null
    });

    logger.info(`Agent 已注册: ${agentDef.id} (${agentDef.displayName})`);
    this.emit('agentRegistered', agentDef);

    return true;
  }

  /**
   * 注销 Agent
   * @param {string} agentId - Agent ID
   * @returns {boolean} - 是否成功
   */
  unregister(agentId) {
    const agentDef = this.agents.get(agentId);
    if (!agentDef) {
      logger.warn(`Agent 不存在: ${agentId}`);
      return false;
    }

    // 从所有索引中移除
    this.agents.delete(agentId);

    // 从类型索引移除
    const typeAgents = this.agentsByType.get(agentDef.type);
    if (typeAgents) {
      const index = typeAgents.indexOf(agentId);
      if (index > -1) typeAgents.splice(index, 1);
    }

    // 从能力索引移除
    for (const capability of agentDef.capabilities) {
      const capAgents = this.agentsByCapability.get(capability);
      if (capAgents) {
        const index = capAgents.indexOf(agentId);
        if (index > -1) capAgents.splice(index, 1);
      }
    }

    // 从模型索引移除
    const modelAgents = this.agentsByModel.get(agentDef.preferredModel);
    if (modelAgents) {
      const index = modelAgents.indexOf(agentId);
      if (index > -1) modelAgents.splice(index, 1);
    }

    // 清理状态
    this.agentStatus.delete(agentId);
    this.agentMetrics.delete(agentId);

    logger.info(`Agent 已注销: ${agentId}`);
    this.emit('agentUnregistered', { id: agentId });

    return true;
  }

  /**
   * 获取 Agent 定义
   * @param {string} agentId - Agent ID
   * @returns {Object|null} - Agent 定义
   */
  getAgent(agentId) {
    return this.agents.get(agentId) || null;
  }

  /**
   * 获取所有 Agent
   * @returns {Array<Object>} - Agent 列表
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * 按类型查询 Agent
   * @param {string} type - Agent 类型
   * @returns {Array<Object>} - Agent 列表
   */
  getAgentsByType(type) {
    const agentIds = this.agentsByType.get(type) || [];
    return agentIds.map(id => this.agents.get(id)).filter(Boolean);
  }

  /**
   * 按能力查询 Agent
   * @param {string} capability - 能力
   * @returns {Array<Object>} - Agent 列表
   */
  getAgentsByCapability(capability) {
    const agentIds = this.agentsByCapability.get(capability) || [];
    return agentIds.map(id => this.agents.get(id)).filter(Boolean);
  }

  /**
   * 按模型查询 Agent
   * @param {string} model - 模型类型
   * @returns {Array<Object>} - Agent 列表
   */
  getAgentsByModel(model) {
    const agentIds = this.agentsByModel.get(model) || [];
    return agentIds.map(id => this.agents.get(id)).filter(Boolean);
  }

  /**
   * 能力匹配 - 找到最适合的 Agent
   * @param {Object} requirements - 需求
   * @param {Array<string>} requirements.capabilities - 必需能力
   * @param {string} requirements.preferredModel - 偏好模型
   * @param {string} requirements.type - Agent 类型
   * @returns {Object|null} - 最匹配的 Agent
   */
  matchAgent(requirements) {
    const { capabilities = [], preferredModel = null, type = null } = requirements;

    // 获取候选 Agent
    let candidates = this.getAllAgents();

    // 按类型过滤
    if (type) {
      candidates = candidates.filter(agent => agent.type === type);
    }

    // 按能力过滤（必须包含所有必需能力）
    if (capabilities.length > 0) {
      candidates = candidates.filter(agent => {
        return capabilities.every(cap => agent.capabilities.includes(cap));
      });
    }

    // 如果没有候选者，返回 null
    if (candidates.length === 0) {
      logger.warn('未找到匹配的 Agent', requirements);
      return null;
    }

    // 按模型偏好排序
    if (preferredModel) {
      candidates.sort((a, b) => {
        const aMatch = a.preferredModel === preferredModel ? 1 : 0;
        const bMatch = b.preferredModel === preferredModel ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    // 按能力匹配度排序（能力越多越好）
    candidates.sort((a, b) => {
      const aScore = capabilities.filter(cap => a.capabilities.includes(cap)).length;
      const bScore = capabilities.filter(cap => b.capabilities.includes(cap)).length;
      return bScore - aScore;
    });

    // 返回最佳匹配
    const bestMatch = candidates[0];
    logger.debug(`匹配到 Agent: ${bestMatch.id}`, requirements);

    return bestMatch;
  }

  /**
   * 负载均衡 - 轮询选择 Agent
   * @param {string} capability - 能力
   * @returns {Object|null} - 选中的 Agent
   */
  selectAgentRoundRobin(capability) {
    const agentIds = this.agentsByCapability.get(capability) || [];

    if (agentIds.length === 0) {
      logger.warn(`没有支持能力的 Agent: ${capability}`);
      return null;
    }

    // 获取或初始化计数器
    if (!this.roundRobinCounters.has(capability)) {
      this.roundRobinCounters.set(capability, 0);
    }

    // 轮询选择
    const counter = this.roundRobinCounters.get(capability);
    const selectedId = agentIds[counter % agentIds.length];

    // 更新计数器
    this.roundRobinCounters.set(capability, counter + 1);

    const agent = this.agents.get(selectedId);
    logger.debug(`轮询选择 Agent: ${selectedId} (能力: ${capability})`);

    return agent;
  }

  /**
   * 更新 Agent 状态
   * @param {string} agentId - Agent ID
   * @param {string} status - 状态
   */
  updateStatus(agentId, status) {
    if (!this.agents.has(agentId)) {
      logger.warn(`Agent 不存在: ${agentId}`);
      return;
    }

    this.agentStatus.set(agentId, status);
    this.emit('agentStatusChanged', { id: agentId, status });
  }

  /**
   * 获取 Agent 状态
   * @param {string} agentId - Agent ID
   * @returns {string|null} - 状态
   */
  getStatus(agentId) {
    return this.agentStatus.get(agentId) || null;
  }

  /**
   * 记录 Agent 调用
   * @param {string} agentId - Agent ID
   * @param {boolean} success - 是否成功
   * @param {number} executionTime - 执行时间（毫秒）
   */
  recordCall(agentId, success, executionTime) {
    const metrics = this.agentMetrics.get(agentId);
    if (!metrics) return;

    metrics.totalCalls++;
    if (success) {
      metrics.successCalls++;
    } else {
      metrics.failedCalls++;
    }

    // 更新平均执行时间
    metrics.avgExecutionTime =
      (metrics.avgExecutionTime * (metrics.totalCalls - 1) + executionTime) / metrics.totalCalls;

    metrics.lastUsed = new Date().toISOString();

    this.emit('agentCallRecorded', { id: agentId, success, executionTime });
  }

  /**
   * 获取 Agent 指标
   * @param {string} agentId - Agent ID
   * @returns {Object|null} - 指标
   */
  getMetrics(agentId) {
    return this.agentMetrics.get(agentId) || null;
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      totalAgents: this.agents.size,
      agentsByType: Object.fromEntries(
        Array.from(this.agentsByType.entries()).map(([type, ids]) => [type, ids.length])
      ),
      agentsByModel: Object.fromEntries(
        Array.from(this.agentsByModel.entries()).map(([model, ids]) => [model, ids.length])
      ),
      totalCapabilities: this.agentsByCapability.size,
      agentStatus: Object.fromEntries(this.agentStatus)
    };
  }

  /**
   * 健康检查
   * @returns {Object} - 健康状态
   */
  healthCheck() {
    const totalAgents = this.agents.size;
    const idleAgents = Array.from(this.agentStatus.values()).filter(s => s === AgentStatus.IDLE).length;
    const busyAgents = Array.from(this.agentStatus.values()).filter(s => s === AgentStatus.BUSY).length;
    const errorAgents = Array.from(this.agentStatus.values()).filter(s => s === AgentStatus.ERROR).length;

    const healthy = errorAgents === 0 && totalAgents > 0;

    return {
      healthy,
      totalAgents,
      idleAgents,
      busyAgents,
      errorAgents,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 创建 Agent 注册表实例
 * @returns {AgentRegistry} - Agent 注册表实例
 */
export function createAgentRegistry() {
  return new AgentRegistry();
}

/**
 * Agent 系统集成模块
 * 整合 Registry、Executor 和 WorkflowEngine
 */

import { createAgentRegistry } from './agent-registry.js';
import { createAgentExecutor } from './agent-executor.js';
import { createWorkflowEngine } from './workflow-engine.js';
import { Logger } from '../core/logger.js';

// 导入所有 Agent 定义
import * as agentDefinitions from './definitions/index.js';

const logger = new Logger('AgentSystem');

/**
 * Agent 系统类
 */
export class AgentSystem {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    // 创建注册表
    this.registry = createAgentRegistry();

    // 创建执行器
    this.executor = createAgentExecutor({
      registry: this.registry,
      maxConcurrent: options.maxConcurrent || 5,
      timeout: options.timeout || 300000
    });

    // 创建工作流引擎
    this.workflowEngine = createWorkflowEngine({
      executor: this.executor,
      registry: this.registry
    });

    // 自动注册所有 Agent
    if (options.autoRegister !== false) {
      this._registerAllAgents();
    }

    logger.info('Agent 系统已初始化');
  }

  /**
   * 执行 Agent
   * @param {string} agentId - Agent ID 或名称
   * @param {Object} input - 输入参数
   * @param {Object} options - 执行选项
   * @returns {Promise<Object>} - 执行结果
   */
  async execute(agentId, input, options = {}) {
    // 如果是名称，转换为 ID
    const fullAgentId = agentId.includes(':')
      ? agentId
      : `oh-my-claudecode:${agentId}`;

    return this.executor.execute(fullAgentId, input, options);
  }

  /**
   * 创建并执行工作流
   * @param {Object} definition - 工作流定义
   * @param {Object} context - 执行上下文
   * @returns {Promise<Object>} - 执行结果
   */
  async executeWorkflow(definition, context = {}) {
    const workflowId = this.workflowEngine.createWorkflow(definition);
    return this.workflowEngine.executeWorkflow(workflowId, context);
  }

  /**
   * 查询 Agent
   * @param {Object} criteria - 查询条件
   * @returns {Array<Object>} - Agent 列表
   */
  findAgents(criteria) {
    if (criteria.capability) {
      return this.registry.getAgentsByCapability(criteria.capability);
    }

    if (criteria.type) {
      return this.registry.getAgentsByType(criteria.type);
    }

    if (criteria.model) {
      return this.registry.getAgentsByModel(criteria.model);
    }

    return this.registry.getAllAgents();
  }

  /**
   * 匹配最适合的 Agent
   * @param {Object} requirements - 需求
   * @returns {Object|null} - 匹配的 Agent
   */
  matchAgent(requirements) {
    return this.registry.matchAgent(requirements);
  }

  /**
   * 获取系统统计
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      registry: this.registry.getStats(),
      executor: this.executor.getStats(),
      workflows: {
        total: this.workflowEngine.workflows.size,
        running: this.workflowEngine.runningWorkflows.size,
        completed: this.workflowEngine.completedWorkflows.size
      }
    };
  }

  /**
   * 健康检查
   * @returns {Object} - 健康状态
   */
  healthCheck() {
    const registryHealth = this.registry.healthCheck();
    const executorStats = this.executor.getStats();

    return {
      healthy: registryHealth.healthy && executorStats.successRate !== '0%',
      registry: registryHealth,
      executor: executorStats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 注册所有 Agent
   * @private
   */
  _registerAllAgents() {
    const agents = [
      // Build/Analysis Lane
      agentDefinitions.exploreAgent,
      agentDefinitions.analystAgent,
      agentDefinitions.plannerAgent,
      agentDefinitions.architectAgent,
      agentDefinitions.debuggerAgent,
      agentDefinitions.executorAgent,

      // Review Lane
      agentDefinitions.styleReviewerAgent,
      agentDefinitions.qualityReviewerAgent,
      agentDefinitions.apiReviewerAgent,
      agentDefinitions.securityReviewerAgent,
      agentDefinitions.performanceReviewerAgent,
      agentDefinitions.testReviewerAgent,

      // Domain Specialists
      agentDefinitions.frontendSpecialistAgent,
      agentDefinitions.backendSpecialistAgent,
      agentDefinitions.databaseSpecialistAgent,
      agentDefinitions.devopsSpecialistAgent,
      agentDefinitions.mobileSpecialistAgent,
      agentDefinitions.dataSpecialistAgent,
      agentDefinitions.mlSpecialistAgent,
      agentDefinitions.testingSpecialistAgent,
      agentDefinitions.docsSpecialistAgent,
      agentDefinitions.gitSpecialistAgent,

      // Product Lane
      agentDefinitions.productManagerAgent,
      agentDefinitions.uxResearcherAgent,
      agentDefinitions.designerAgent,
      agentDefinitions.contentWriterAgent,

      // Coordination
      agentDefinitions.orchestratorAgent,
      agentDefinitions.teamAgent,

      // Special
      agentDefinitions.buildFixerAgent,
      agentDefinitions.dependencyManagerAgent,
      agentDefinitions.refactorerAgent,
      agentDefinitions.migratorAgent
    ];

    let registered = 0;
    agents.forEach(agent => {
      try {
        this.registry.register(agent);
        registered++;
      } catch (error) {
        logger.error(`注册 Agent 失败: ${agent.id}`, error);
      }
    });

    logger.info(`自动注册了 ${registered} 个 Agent`);
  }
}

/**
 * 创建 Agent 系统
 * @param {Object} options - 配置选项
 * @returns {AgentSystem} - Agent 系统实例
 */
export function createAgentSystem(options = {}) {
  return new AgentSystem(options);
}

// 导出单例实例（可选）
let systemInstance = null;

/**
 * 获取 Agent 系统单例
 * @param {Object} options - 配置选项
 * @returns {AgentSystem} - Agent 系统实例
 */
export function getAgentSystem(options = {}) {
  if (!systemInstance) {
    systemInstance = new AgentSystem(options);
  }
  return systemInstance;
}

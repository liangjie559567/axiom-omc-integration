/**
 * /agent 命令实现
 * 用于管理和执行 Agent
 */

import { getAgentSystem } from '../agents/agent-system.js';
import { Logger } from '../core/logger.js';

const logger = new Logger('AgentCommand');

/**
 * Agent 命令处理器
 */
export class AgentCommand {
  constructor() {
    this.system = getAgentSystem();
  }

  /**
   * 执行命令
   * @param {string} subcommand - 子命令
   * @param {Array<string>} args - 参数
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 执行结果
   */
  async execute(subcommand, args = [], options = {}) {
    switch (subcommand) {
      case 'list':
        return this.list(options);

      case 'info':
        return this.info(args[0], options);

      case 'run':
      case 'execute':
        return this.run(args[0], args.slice(1), options);

      case 'history':
        return this.history(args[0], options);

      case 'stats':
        return this.stats(options);

      case 'search':
        return this.search(args[0], options);

      default:
        throw new Error(`未知的子命令: ${subcommand}`);
    }
  }

  /**
   * 列出所有 Agent
   * @param {Object} options - 选项
   * @returns {Object} - Agent 列表
   */
  list(options = {}) {
    const { type, model, capability, format = 'table' } = options;

    let agents = this.system.registry.getAllAgents();

    // 过滤
    if (type) {
      agents = agents.filter(a => a.type === type);
    }
    if (model) {
      agents = agents.filter(a => a.preferredModel === model);
    }
    if (capability) {
      agents = agents.filter(a => a.capabilities.includes(capability));
    }

    // 格式化输出
    if (format === 'json') {
      return { agents };
    }

    // 表格格式
    const table = agents.map(agent => ({
      id: agent.name,
      displayName: agent.displayName,
      type: agent.type,
      model: agent.preferredModel,
      lane: agent.lane || '-',
      capabilities: agent.capabilities.length
    }));

    return {
      total: agents.length,
      agents: table,
      summary: this._generateListSummary(agents)
    };
  }

  /**
   * 获取 Agent 详细信息
   * @param {string} agentName - Agent 名称
   * @param {Object} options - 选项
   * @returns {Object} - Agent 信息
   */
  info(agentName, options = {}) {
    if (!agentName) {
      throw new Error('请指定 Agent 名称');
    }

    const agentId = agentName.includes(':')
      ? agentName
      : `oh-my-claudecode:${agentName}`;

    const agent = this.system.registry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent 不存在: ${agentName}`);
    }

    const status = this.system.registry.getStatus(agentId);
    const metrics = this.system.registry.getMetrics(agentId);

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        displayName: agent.displayName,
        description: agent.description,
        type: agent.type,
        lane: agent.lane,
        model: agent.preferredModel,
        supportedModels: agent.supportedModels,
        capabilities: agent.capabilities,
        useCases: agent.useCases,
        bestPractices: agent.bestPractices,
        limitations: agent.limitations,
        dependencies: agent.dependencies,
        performance: agent.performance
      },
      status,
      metrics
    };
  }

  /**
   * 执行 Agent
   * @param {string} agentName - Agent 名称
   * @param {Array<string>} args - 参数
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 执行结果
   */
  async run(agentName, args = [], options = {}) {
    if (!agentName) {
      throw new Error('请指定 Agent 名称');
    }

    // 解析输入参数
    const input = this._parseInput(args, options);

    logger.info(`执行 Agent: ${agentName}`, { input });

    try {
      const result = await this.system.execute(agentName, input, {
        model: options.model,
        timeout: options.timeout
      });

      return {
        success: true,
        agent: agentName,
        result
      };
    } catch (error) {
      logger.error(`Agent 执行失败: ${agentName}`, error);
      return {
        success: false,
        agent: agentName,
        error: error.message
      };
    }
  }

  /**
   * 查看执行历史
   * @param {string} agentName - Agent 名称（可选）
   * @param {Object} options - 选项
   * @returns {Object} - 执行历史
   */
  history(agentName, options = {}) {
    const { limit = 10, status } = options;

    const filters = { limit };

    if (agentName) {
      const agentId = agentName.includes(':')
        ? agentName
        : `oh-my-claudecode:${agentName}`;
      filters.agentId = agentId;
    }

    if (status) {
      filters.status = status;
    }

    const history = this.system.executor.getExecutionHistory(filters);

    return {
      total: history.length,
      history: history.map(exec => ({
        id: exec.id,
        agent: exec.agentName,
        status: exec.status,
        duration: exec.duration ? `${exec.duration}ms` : '-',
        startTime: exec.startTime ? new Date(exec.startTime).toISOString() : '-',
        error: exec.error || null
      }))
    };
  }

  /**
   * 获取统计信息
   * @param {Object} options - 选项
   * @returns {Object} - 统计信息
   */
  stats(options = {}) {
    const registryStats = this.system.registry.getStats();
    const executorStats = this.system.executor.getStats();
    const health = this.system.healthCheck();

    return {
      registry: registryStats,
      executor: executorStats,
      health,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 搜索 Agent
   * @param {string} query - 搜索关键词
   * @param {Object} options - 选项
   * @returns {Object} - 搜索结果
   */
  search(query, options = {}) {
    if (!query) {
      throw new Error('请指定搜索关键词');
    }

    const allAgents = this.system.registry.getAllAgents();
    const lowerQuery = query.toLowerCase();

    const results = allAgents.filter(agent => {
      return (
        agent.name.toLowerCase().includes(lowerQuery) ||
        agent.displayName.toLowerCase().includes(lowerQuery) ||
        agent.description.toLowerCase().includes(lowerQuery) ||
        agent.capabilities.some(cap => cap.toLowerCase().includes(lowerQuery)) ||
        agent.useCases.some(uc => uc.toLowerCase().includes(lowerQuery))
      );
    });

    return {
      query,
      total: results.length,
      results: results.map(agent => ({
        id: agent.name,
        displayName: agent.displayName,
        description: agent.description,
        type: agent.type,
        model: agent.preferredModel
      }))
    };
  }

  /**
   * 解析输入参数
   * @private
   * @param {Array<string>} args - 参数
   * @param {Object} options - 选项
   * @returns {Object} - 解析后的输入
   */
  _parseInput(args, options) {
    const input = {};

    // 从选项中提取输入参数
    Object.keys(options).forEach(key => {
      if (!['model', 'timeout', 'format'].includes(key)) {
        input[key] = options[key];
      }
    });

    // 如果有位置参数，尝试解析为 JSON
    if (args.length > 0) {
      try {
        const jsonInput = JSON.parse(args.join(' '));
        Object.assign(input, jsonInput);
      } catch (error) {
        // 不是 JSON，作为普通参数处理
        if (args.length === 1) {
          input.input = args[0];
        } else {
          input.args = args;
        }
      }
    }

    return input;
  }

  /**
   * 生成列表摘要
   * @private
   * @param {Array<Object>} agents - Agent 列表
   * @returns {Object} - 摘要信息
   */
  _generateListSummary(agents) {
    const byType = {};
    const byModel = {};
    const byLane = {};

    agents.forEach(agent => {
      byType[agent.type] = (byType[agent.type] || 0) + 1;
      byModel[agent.preferredModel] = (byModel[agent.preferredModel] || 0) + 1;
      if (agent.lane) {
        byLane[agent.lane] = (byLane[agent.lane] || 0) + 1;
      }
    });

    return { byType, byModel, byLane };
  }
}

/**
 * 创建 Agent 命令实例
 * @returns {AgentCommand} - 命令实例
 */
export function createAgentCommand() {
  return new AgentCommand();
}

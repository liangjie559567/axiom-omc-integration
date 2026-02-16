/**
 * CLI 命令系统
 * 提供统一的命令行接口
 */

import { createAgentSystem } from '../agents/agent-system.js';
import { createCommandRouter } from '../core/command-router.js';
import { createStateSynchronizer } from '../core/state-synchronizer.js';
import { createMemorySystem } from '../core/memory-system.js';
import { createWorkflowIntegration } from '../core/workflow-integration.js';
import { Logger } from '../core/logger.js';

const logger = new Logger('CLI');

/**
 * CLI 系统类
 */
export class CLISystem {
  constructor(config = {}) {
    this.config = config;

    // 初始化核心系统
    this.agentSystem = createAgentSystem(config.agent);
    this.commandRouter = createCommandRouter(config.router);
    this.stateSynchronizer = createStateSynchronizer(config.sync);
    this.memorySystem = createMemorySystem(config.memory);
    this.workflowIntegration = createWorkflowIntegration(config.workflow);

    // 注册所有命令
    this._registerCommands();

    logger.info('CLI 系统已初始化');
  }

  /**
   * 注册所有命令
   */
  _registerCommands() {
    this._registerAgentCommands();
    this._registerWorkflowCommands();
    this._registerMemoryCommands();
    this._registerSyncCommands();
  }

  /**
   * 注册 Agent 命令
   */
  _registerAgentCommands() {
    // /agent list - 列出所有 Agent
    this.commandRouter.register('agent:list', async () => {
      const agents = this.agentSystem.findAgents({});
      return {
        success: true,
        agents: agents.map(a => ({
          id: a.id,
          name: a.name,
          lane: a.lane,
          capabilities: a.capabilities
        }))
      };
    }, {
      description: '列出所有可用的 Agent',
      aliases: ['agent:ls']
    });

    // /agent info <agentId> - 查看 Agent 详情
    this.commandRouter.register('agent:info', async (args) => {
      const [agentId] = args;
      if (!agentId) {
        throw new Error('请提供 Agent ID');
      }

      const agents = this.agentSystem.findAgents({});
      const agent = agents.find(a => a.id === agentId || a.name === agentId);

      if (!agent) {
        throw new Error(`Agent 不存在: ${agentId}`);
      }

      return {
        success: true,
        agent
      };
    }, {
      description: '查看 Agent 详细信息',
      validate: (args) => args.length > 0
    });

    // /agent execute <agentId> [input] - 执行 Agent
    this.commandRouter.register('agent:execute', async (args) => {
      const [agentId, ...inputArgs] = args;
      if (!agentId) {
        throw new Error('请提供 Agent ID');
      }

      const input = inputArgs.length > 0 ? JSON.parse(inputArgs.join(' ')) : {};

      // 直接调用 executor.execute 并立即返回 execution ID
      const fullAgentId = agentId.includes(':')
        ? agentId
        : `oh-my-claudecode:${agentId}`;

      const agent = this.agentSystem.registry.getAgent(fullAgentId);
      if (!agent) {
        throw new Error(`Agent 不存在: ${agentId}`);
      }

      // 创建执行记录
      const execution = {
        id: this._generateId(),
        agentId: fullAgentId,
        agentName: agent.name,
        input,
        status: 'pending',
        startTime: null,
        endTime: null,
        result: null,
        error: null
      };

      // 添加到执行器队列（异步执行，不等待）
      this.agentSystem.executor.executionQueue.push(execution);
      this.agentSystem.executor._processQueue();

      return {
        success: true,
        executionId: execution.id,
        message: `Agent ${agentId} 执行已启动`
      };
    }, {
      description: '执行指定的 Agent',
      aliases: ['agent:run'],
      validate: (args) => args.length > 0
    });

    // /agent status <executionId> - 查看执行状态
    this.commandRouter.register('agent:status', async (args) => {
      const [executionId] = args;
      if (!executionId) {
        throw new Error('请提供执行 ID');
      }

      const execution = this.agentSystem.executor.getExecution(executionId);

      if (!execution) {
        throw new Error(`执行不存在: ${executionId}`);
      }

      return {
        success: true,
        execution
      };
    }, {
      description: '查看 Agent 执行状态',
      validate: (args) => args.length > 0
    });

    // /agent history [agentId] - 查看执行历史
    this.commandRouter.register('agent:history', async (args) => {
      const [agentId, limitStr] = args;
      const limit = limitStr ? parseInt(limitStr) : 10;

      const filters = { limit };
      if (agentId) {
        filters.agentId = agentId;
      }

      const history = this.agentSystem.executor.getExecutionHistory(filters);

      return {
        success: true,
        history
      };
    }, {
      description: '查看 Agent 执行历史',
      aliases: ['agent:log']
    });

    // /agent cancel <executionId> - 取消执行
    this.commandRouter.register('agent:cancel', async (args) => {
      const [executionId] = args;
      if (!executionId) {
        throw new Error('请提供执行 ID');
      }

      const cancelled = await this.agentSystem.executor.cancelExecution(executionId);

      return {
        success: cancelled,
        message: cancelled ? '执行已取消' : '取消失败'
      };
    }, {
      description: '取消 Agent 执行',
      validate: (args) => args.length > 0
    });
  }

  /**
   * 注册工作流命令
   */
  _registerWorkflowCommands() {
    // /workflow list - 列出所有工作流
    this.commandRouter.register('workflow:list', async () => {
      const workflows = Array.from(this.workflowIntegration.workflows.values());

      return {
        success: true,
        workflows: workflows.map(w => ({
          id: w.id,
          name: w.name,
          type: w.type,
          phases: w.phases
        }))
      };
    }, {
      description: '列出所有可用的工作流',
      aliases: ['workflow:ls']
    });

    // /workflow start <workflowId> [context] - 启动工作流
    this.commandRouter.register('workflow:start', async (args) => {
      const [workflowId, ...contextArgs] = args;
      if (!workflowId) {
        throw new Error('请提供工作流 ID');
      }

      const context = contextArgs.length > 0 ? JSON.parse(contextArgs.join(' ')) : {};
      const instanceId = this.workflowIntegration.startWorkflow(workflowId, context);

      return {
        success: true,
        instanceId,
        message: `工作流 ${workflowId} 已启动`
      };
    }, {
      description: '启动工作流实例',
      validate: (args) => args.length > 0
    });

    // /workflow status <instanceId> - 查看工作流状态
    this.commandRouter.register('workflow:status', async (args) => {
      const [instanceId] = args;
      if (!instanceId) {
        throw new Error('请提供实例 ID');
      }

      const instance = this.workflowIntegration.getWorkflowInstance(instanceId);

      if (!instance) {
        throw new Error(`工作流实例不存在: ${instanceId}`);
      }

      return {
        success: true,
        instance
      };
    }, {
      description: '查看工作流实例状态',
      validate: (args) => args.length > 0
    });

    // /workflow next <instanceId> - 转换到下一阶段
    this.commandRouter.register('workflow:next', async (args) => {
      const [instanceId] = args;
      if (!instanceId) {
        throw new Error('请提供实例 ID');
      }

      const success = await this.workflowIntegration.transitionToNext(instanceId);

      return {
        success,
        message: success ? '已转换到下一阶段' : '转换失败'
      };
    }, {
      description: '转换到下一个工作流阶段',
      validate: (args) => args.length > 0
    });

    // /workflow goto <instanceId> <phase> - 跳转到指定阶段
    this.commandRouter.register('workflow:goto', async (args) => {
      const [instanceId, targetPhase] = args;
      if (!instanceId || !targetPhase) {
        throw new Error('请提供实例 ID 和目标阶段');
      }

      const success = await this.workflowIntegration.transitionTo(
        instanceId,
        targetPhase,
        { skipIntermediate: true }
      );

      return {
        success,
        message: success ? `已跳转到阶段: ${targetPhase}` : '跳转失败'
      };
    }, {
      description: '跳转到指定工作流阶段',
      validate: (args) => args.length >= 2
    });

    // /workflow active - 查看活动工作流
    this.commandRouter.register('workflow:active', async () => {
      const workflows = this.workflowIntegration.getActiveWorkflows();

      return {
        success: true,
        workflows
      };
    }, {
      description: '查看所有活动的工作流实例'
    });

    // /workflow stop <instanceId> - 停止工作流
    this.commandRouter.register('workflow:stop', async (args) => {
      const [instanceId] = args;
      if (!instanceId) {
        throw new Error('请提供实例 ID');
      }

      const success = this.workflowIntegration.stopWorkflow(instanceId);

      return {
        success,
        message: success ? '工作流已停止' : '停止失败'
      };
    }, {
      description: '停止工作流实例',
      validate: (args) => args.length > 0
    });
  }

  /**
   * 注册记忆命令
   */
  _registerMemoryCommands() {
    // /memory decision:add <decision> - 添加决策
    this.commandRouter.register('memory:decision:add', async (args) => {
      const decisionJson = args.join(' ');
      if (!decisionJson) {
        throw new Error('请提供决策信息');
      }

      const decision = JSON.parse(decisionJson);
      const decisionId = this.memorySystem.addDecision(decision);

      return {
        success: true,
        decisionId,
        message: '决策已添加'
      };
    }, {
      description: '添加决策记录',
      validate: (args) => args.length > 0
    });

    // /memory decision:list [filters] - 列出决策
    this.commandRouter.register('memory:decision:list', async (args) => {
      const filtersJson = args.join(' ');
      const filters = filtersJson ? JSON.parse(filtersJson) : {};

      const decisions = this.memorySystem.queryDecisions(filters);

      return {
        success: true,
        decisions
      };
    }, {
      description: '列出决策记录',
      aliases: ['memory:decision:ls']
    });

    // /memory knowledge:add <node> - 添加知识节点
    this.commandRouter.register('memory:knowledge:add', async (args) => {
      const nodeJson = args.join(' ');
      if (!nodeJson) {
        throw new Error('请提供节点信息');
      }

      const node = JSON.parse(nodeJson);
      const nodeId = this.memorySystem.addKnowledgeNode(node);

      return {
        success: true,
        nodeId,
        message: '知识节点已添加'
      };
    }, {
      description: '添加知识节点',
      validate: (args) => args.length > 0
    });

    // /memory knowledge:search <query> - 搜索知识
    this.commandRouter.register('memory:knowledge:search', async (args) => {
      const query = args.join(' ');
      if (!query) {
        throw new Error('请提供搜索关键词');
      }

      const results = this.memorySystem.searchKnowledge(query);

      return {
        success: true,
        results
      };
    }, {
      description: '搜索知识图谱',
      validate: (args) => args.length > 0
    });

    // /memory stats - 查看统计信息
    this.commandRouter.register('memory:stats', async () => {
      const stats = this.memorySystem.getStats();

      return {
        success: true,
        stats
      };
    }, {
      description: '查看记忆系统统计信息'
    });
  }

  /**
   * 注册同步命令
   */
  _registerSyncCommands() {
    // /sync register <axiomPath> <omcPath> [options] - 注册同步映射
    this.commandRouter.register('sync:register', async (args) => {
      const [axiomPath, omcPath, ...optionsArgs] = args;
      if (!axiomPath || !omcPath) {
        throw new Error('请提供 Axiom 和 OMC 文件路径');
      }

      const options = optionsArgs.length > 0 ? JSON.parse(optionsArgs.join(' ')) : {};
      const mappingId = this.stateSynchronizer.registerMapping(axiomPath, omcPath, options);

      return {
        success: true,
        mappingId,
        message: '同步映射已注册'
      };
    }, {
      description: '注册文件同步映射',
      validate: (args) => args.length >= 2
    });

    // /sync run [mappingId] - 执行同步
    this.commandRouter.register('sync:run', async (args) => {
      const [mappingId] = args;

      let result;
      if (mappingId) {
        result = await this.stateSynchronizer.sync(mappingId);
      } else {
        result = await this.stateSynchronizer.syncAll();
      }

      return {
        success: true,
        result
      };
    }, {
      description: '执行文件同步'
    });

    // /sync list - 列出同步映射
    this.commandRouter.register('sync:list', async () => {
      const mappings = Array.from(this.stateSynchronizer.mappings.values());

      return {
        success: true,
        mappings: mappings.map(m => ({
          id: m.id,
          axiomPath: m.axiomPath,
          omcPath: m.omcPath,
          direction: m.direction
        }))
      };
    }, {
      description: '列出所有同步映射',
      aliases: ['sync:ls']
    });

    // /sync history [mappingId] - 查看同步历史
    this.commandRouter.register('sync:history', async (args) => {
      const [mappingId, limitStr] = args;
      const limit = limitStr ? parseInt(limitStr) : 10;

      const filters = { limit };
      if (mappingId) {
        filters.mappingId = mappingId;
      }

      const history = this.stateSynchronizer.getHistory(filters);

      return {
        success: true,
        history
      };
    }, {
      description: '查看同步历史'
    });
  }

  /**
   * 生成唯一 ID
   * @private
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 执行命令
   */
  async execute(commandLine) {
    try {
      // 解析命令行
      const parts = commandLine.trim().split(/\s+/);
      const [command, ...args] = parts;

      // 路由命令
      const result = await this.commandRouter.route(command, args);

      return result;
    } catch (error) {
      logger.error('命令执行失败', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 初始化记忆系统
   */
  async initialize() {
    await this.memorySystem.initialize();
    logger.info('CLI 系统初始化完成');
  }

  /**
   * 销毁系统
   */
  async destroy() {
    this.stateSynchronizer.destroy();
    await this.memorySystem.destroy();
    this.workflowIntegration.destroy();
    logger.info('CLI 系统已销毁');
  }
}

/**
 * 创建 CLI 系统
 */
export function createCLISystem(config) {
  return new CLISystem(config);
}

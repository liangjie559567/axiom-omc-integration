/**
 * Orchestrator Agent 定义
 * 多 Agent 协调和工作流编排
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const orchestratorAgent = {
  id: 'oh-my-claudecode:orchestrator',
  name: 'orchestrator',
  displayName: '协调器',
  description: '多 Agent 协调、工作流编排和任务分配的专业 Agent，使用 Opus 模型确保协调的准确性',

  type: AgentType.COORDINATION,
  lane: 'Coordination',

  capabilities: [
    AgentCapability.PLANNING,
    AgentCapability.TASK_DECOMPOSITION
  ],

  preferredModel: AgentModel.OPUS,
  supportedModels: [AgentModel.OPUS, AgentModel.SONNET],

  input: {
    required: ['task', 'availableAgents'],
    optional: ['constraints', 'priorities', 'context'],
    schema: {
      task: {
        type: 'string',
        description: '复杂任务描述'
      },
      availableAgents: {
        type: 'array',
        description: '可用的 Agent 列表'
      },
      constraints: {
        type: 'object',
        description: '约束条件（时间、资源、依赖）'
      },
      priorities: {
        type: 'array',
        description: '优先级要求'
      },
      context: {
        type: 'object',
        description: '任务上下文'
      }
    }
  },

  output: {
    type: 'orchestration-plan',
    schema: {
      workflow: {
        type: 'object',
        description: '工作流定义',
        properties: {
          stages: { type: 'array' },
          dependencies: { type: 'object' },
          parallelTasks: { type: 'array' }
        }
      },
      agentAssignments: {
        type: 'array',
        description: 'Agent 任务分配',
        items: {
          type: 'object',
          properties: {
            agent: { type: 'string' },
            task: { type: 'string' },
            input: { type: 'object' },
            dependencies: { type: 'array' }
          }
        }
      },
      executionOrder: {
        type: 'array',
        description: '执行顺序'
      },
      coordinationPoints: {
        type: 'array',
        description: '协调点（需要同步的地方）'
      }
    }
  },

  useCases: [
    '分解复杂任务为子任务',
    '分配任务给合适的 Agent',
    '协调多个 Agent 的工作',
    '管理任务依赖关系',
    '优化执行顺序',
    '处理 Agent 间的数据传递',
    '监控整体进度'
  ],

  bestPractices: [
    '理解每个 Agent 的能力',
    '识别任务依赖关系',
    '最大化并行执行',
    '设置清晰的协调点',
    '处理失败和重试',
    '监控执行进度'
  ],

  limitations: [
    '需要了解所有可用 Agent',
    '无法直接执行任务',
    '复杂协调可能需要人工干预'
  ],

  dependencies: [
    'AgentRegistry（查询 Agent）',
    'planner Agent（任务规划）'
  ],

  performance: {
    avgExecutionTime: '5-15分钟',
    complexity: 'high'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['orchestration', 'coordination', 'workflow', 'opus']
  }
};

export default orchestratorAgent;

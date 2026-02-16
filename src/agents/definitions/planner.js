/**
 * Planner Agent 定义
 * 任务排序和执行计划制定
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const plannerAgent = {
  id: 'oh-my-claudecode:planner',
  name: 'planner',
  displayName: '任务规划师',
  description: '任务排序、执行计划制定和风险标记的专业 Agent，使用 Opus 模型确保计划的完整性和可执行性',

  type: AgentType.BUILD_ANALYSIS,
  lane: 'Build/Analysis Lane',

  capabilities: [
    AgentCapability.PLANNING,
    AgentCapability.TASK_DECOMPOSITION
  ],

  preferredModel: AgentModel.OPUS,
  supportedModels: [AgentModel.OPUS, AgentModel.SONNET],

  input: {
    required: ['requirement', 'acceptanceCriteria'],
    optional: ['codebaseContext', 'resources', 'timeline'],
    schema: {
      requirement: {
        type: 'string',
        description: '需求描述（通常来自 analyst）'
      },
      acceptanceCriteria: {
        type: 'array',
        items: { type: 'string' },
        description: '验收标准列表'
      },
      codebaseContext: {
        type: 'object',
        description: '代码库上下文（结构、技术栈、现有模块）'
      },
      resources: {
        type: 'object',
        description: '可用资源（人力、时间、工具）'
      },
      timeline: {
        type: 'string',
        description: '时间限制'
      }
    }
  },

  output: {
    type: 'execution-plan',
    schema: {
      tasks: {
        type: 'array',
        description: '任务列表（按执行顺序）',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            dependencies: { type: 'array' },
            estimatedTime: { type: 'string' },
            priority: { type: 'string' },
            assignedAgent: { type: 'string' }
          }
        }
      },
      phases: {
        type: 'array',
        description: '执行阶段划分'
      },
      criticalPath: {
        type: 'array',
        description: '关键路径任务'
      },
      risks: {
        type: 'array',
        description: '风险标记和缓解措施'
      },
      milestones: {
        type: 'array',
        description: '里程碑定义'
      }
    }
  },

  useCases: [
    '将需求分解为可执行的任务序列',
    '识别任务依赖关系和执行顺序',
    '标记关键路径和潜在风险',
    '为团队协作提供清晰的执行路线图',
    '支持迭代式开发和增量交付'
  ],

  bestPractices: [
    '提供详细的代码库上下文以制定更准确的计划',
    '明确时间和资源约束',
    '计划应包含验证和测试步骤',
    '定期根据实际进度调整计划',
    '将计划输出给 executor 或 team 执行'
  ],

  limitations: [
    '计划质量依赖于输入信息的完整性',
    '无法预测所有实施细节和技术难点',
    '需要根据实际执行情况动态调整'
  ],

  dependencies: [
    'analyst Agent（提供需求分析）',
    'explore Agent（提供代码库上下文）',
    'Read 工具（读取现有代码）'
  ],

  performance: {
    avgExecutionTime: '5-10分钟',
    complexity: 'high'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['planning', 'task-decomposition', 'execution', 'opus']
  }
};

export default plannerAgent;

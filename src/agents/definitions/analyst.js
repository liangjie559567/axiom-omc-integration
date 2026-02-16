/**
 * Analyst Agent 定义
 * 需求分析和验收标准制定
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const analystAgent = {
  id: 'oh-my-claudecode:analyst',
  name: 'analyst',
  displayName: '需求分析师',
  description: '深度需求分析、验收标准制定和隐藏约束识别的专业 Agent，使用 Opus 模型确保分析的全面性和准确性',

  type: AgentType.BUILD_ANALYSIS,
  lane: 'Build/Analysis Lane',

  capabilities: [
    AgentCapability.PLANNING,
    AgentCapability.TASK_DECOMPOSITION
  ],

  preferredModel: AgentModel.OPUS,
  supportedModels: [AgentModel.OPUS, AgentModel.SONNET],

  input: {
    required: ['requirement'],
    optional: ['context', 'constraints', 'stakeholders'],
    schema: {
      requirement: {
        type: 'string',
        description: '原始需求描述'
      },
      context: {
        type: 'object',
        description: '项目上下文信息（技术栈、架构、现有功能等）'
      },
      constraints: {
        type: 'array',
        items: { type: 'string' },
        description: '已知约束条件'
      },
      stakeholders: {
        type: 'array',
        items: { type: 'string' },
        description: '利益相关方列表'
      }
    }
  },

  output: {
    type: 'analysis-report',
    schema: {
      clarifiedRequirement: {
        type: 'string',
        description: '澄清后的需求描述'
      },
      acceptanceCriteria: {
        type: 'array',
        description: '验收标准列表'
      },
      hiddenConstraints: {
        type: 'array',
        description: '识别出的隐藏约束'
      },
      risks: {
        type: 'array',
        description: '潜在风险和缓解措施'
      },
      dependencies: {
        type: 'array',
        description: '依赖关系分析'
      },
      recommendations: {
        type: 'array',
        description: '实施建议'
      }
    }
  },

  useCases: [
    '将模糊的需求转化为清晰的实施规格',
    '制定可测试的验收标准',
    '识别需求中的隐藏约束和边界条件',
    '评估需求的可行性和风险',
    '为规划阶段提供详细的需求文档'
  ],

  bestPractices: [
    '提供充分的项目上下文以获得更准确的分析',
    '明确列出已知约束，帮助 Agent 识别隐藏约束',
    '分析结果应与利益相关方确认',
    '将分析报告作为 planner Agent 的输入'
  ],

  limitations: [
    '需要充分的上下文信息才能进行准确分析',
    '无法替代与真实用户的沟通',
    '分析质量依赖于输入需求的清晰度'
  ],

  dependencies: [
    'Read 工具（读取项目文档）',
    'Grep 工具（搜索相关代码）'
  ],

  performance: {
    avgExecutionTime: '3-8分钟',
    complexity: 'high'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['analysis', 'requirements', 'planning', 'opus']
  }
};

export default analystAgent;

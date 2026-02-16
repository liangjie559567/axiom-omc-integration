/**
 * Team Agent 定义
 * 团队协作和沟通协调
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const teamAgent = {
  id: 'oh-my-claudecode:team',
  name: 'team',
  displayName: '团队协作者',
  description: '团队协作、沟通协调和知识共享的专业 Agent，使用 Sonnet 模型平衡协作质量和效率',

  type: AgentType.COORDINATION,
  lane: 'Coordination',

  capabilities: [
    AgentCapability.PLANNING
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['collaborationType'],
    optional: ['participants', 'context', 'goals'],
    schema: {
      collaborationType: {
        type: 'string',
        enum: ['code-review', 'pair-programming', 'knowledge-sharing', 'problem-solving', 'planning'],
        description: '协作类型'
      },
      participants: {
        type: 'array',
        description: '参与者（Agent 或人类）'
      },
      context: {
        type: 'object',
        description: '协作上下文'
      },
      goals: {
        type: 'array',
        description: '协作目标'
      }
    }
  },

  output: {
    type: 'collaboration-result',
    schema: {
      summary: {
        type: 'string',
        description: '协作摘要'
      },
      decisions: {
        type: 'array',
        description: '达成的决策'
      },
      actionItems: {
        type: 'array',
        description: '行动项',
        items: {
          type: 'object',
          properties: {
            task: { type: 'string' },
            assignee: { type: 'string' },
            deadline: { type: 'string' }
          }
        }
      },
      knowledgeShared: {
        type: 'array',
        description: '共享的知识'
      },
      nextSteps: {
        type: 'array',
        description: '后续步骤'
      }
    }
  },

  useCases: [
    '协调代码审查',
    '促进结对编程',
    '组织知识分享',
    '协助问题解决',
    '协调团队规划',
    '管理团队沟通',
    '记录团队决策'
  ],

  bestPractices: [
    '明确协作目标',
    '促进有效沟通',
    '记录重要决策',
    '跟踪行动项',
    '分享知识和经验',
    '保持团队对齐'
  ],

  limitations: [
    '无法替代人类沟通',
    '某些协作需要实时互动',
    '复杂决策需要人工参与'
  ],

  dependencies: [
    'orchestrator Agent（任务协调）'
  ],

  performance: {
    avgExecutionTime: '3-8分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['team', 'collaboration', 'coordination', 'sonnet']
  }
};

export default teamAgent;

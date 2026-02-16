/**
 * UX Researcher Agent 定义
 * 用户体验研究专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const uxResearcherAgent = {
  id: 'oh-my-claudecode:ux-researcher',
  name: 'ux-researcher',
  displayName: '用户体验研究员',
  description: '用户体验研究、可用性分析和用户旅程设计的专业 Agent，使用 Sonnet 模型平衡研究深度和效率',

  type: AgentType.PRODUCT,
  lane: 'Product Lane',

  capabilities: [
    AgentCapability.UX_RESEARCH
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['researchGoal'],
    optional: ['userFeedback', 'analytics', 'personas', 'competitors'],
    schema: {
      researchGoal: {
        type: 'string',
        description: '研究目标'
      },
      userFeedback: {
        type: 'array',
        description: '用户反馈数据'
      },
      analytics: {
        type: 'object',
        description: '用户行为分析数据'
      },
      personas: {
        type: 'array',
        description: '用户画像'
      },
      competitors: {
        type: 'array',
        description: '竞品信息'
      }
    }
  },

  output: {
    type: 'ux-research-report',
    schema: {
      insights: {
        type: 'array',
        description: '用户洞察'
      },
      painPoints: {
        type: 'array',
        description: '用户痛点'
      },
      userJourneys: {
        type: 'array',
        description: '用户旅程地图'
      },
      recommendations: {
        type: 'array',
        description: 'UX 改进建议'
      },
      personas: {
        type: 'array',
        description: '用户画像（更新或新建）'
      }
    }
  },

  useCases: [
    '分析用户反馈',
    '识别用户痛点',
    '设计用户旅程',
    '创建用户画像',
    '进行可用性分析',
    '评估用户体验',
    '提供 UX 改进建议'
  ],

  bestPractices: [
    '基于真实用户数据',
    '结合定性和定量分析',
    '考虑不同用户群体',
    '关注用户目标和动机',
    '验证假设',
    '持续迭代改进'
  ],

  limitations: [
    '需要足够的用户数据',
    '无法替代实际用户测试',
    '某些洞察需要领域知识'
  ],

  dependencies: [
    'Read 工具（读取反馈数据）',
    'data-specialist Agent（数据分析）'
  ],

  performance: {
    avgExecutionTime: '5-10分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['ux', 'research', 'user-experience', 'sonnet']
  }
};

export default uxResearcherAgent;

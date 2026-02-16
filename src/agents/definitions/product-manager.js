/**
 * Product Manager Agent 定义
 * 产品管理和需求优先级
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const productManagerAgent = {
  id: 'oh-my-claudecode:product-manager',
  name: 'product-manager',
  displayName: '产品经理',
  description: '产品规划、需求优先级和路线图制定的专业 Agent，使用 Opus 模型确保产品决策的全面性',

  type: AgentType.PRODUCT,
  lane: 'Product Lane',

  capabilities: [
    AgentCapability.PRODUCT_MANAGEMENT,
    AgentCapability.PLANNING
  ],

  preferredModel: AgentModel.OPUS,
  supportedModels: [AgentModel.OPUS, AgentModel.SONNET],

  input: {
    required: ['context'],
    optional: ['features', 'userFeedback', 'metrics', 'constraints'],
    schema: {
      context: {
        type: 'object',
        description: '产品上下文（目标、用户、市场）'
      },
      features: {
        type: 'array',
        description: '待评估的功能列表'
      },
      userFeedback: {
        type: 'array',
        description: '用户反馈'
      },
      metrics: {
        type: 'object',
        description: '产品指标'
      },
      constraints: {
        type: 'object',
        description: '约束条件（资源、时间、技术）'
      }
    }
  },

  output: {
    type: 'product-plan',
    schema: {
      roadmap: {
        type: 'object',
        description: '产品路线图'
      },
      priorities: {
        type: 'array',
        description: '功能优先级排序',
        items: {
          type: 'object',
          properties: {
            feature: { type: 'string' },
            priority: { type: 'string' },
            rationale: { type: 'string' },
            impact: { type: 'string' }
          }
        }
      },
      requirements: {
        type: 'array',
        description: '详细需求'
      },
      tradeoffs: {
        type: 'array',
        description: '权衡分析'
      },
      recommendations: {
        type: 'array',
        description: '产品建议'
      }
    }
  },

  useCases: [
    '制定产品路线图',
    '评估功能优先级',
    '分析用户需求',
    '进行竞品分析',
    '制定产品策略',
    '评估功能影响',
    '平衡资源和需求'
  ],

  bestPractices: [
    '基于数据做决策',
    '理解用户需求',
    '考虑技术可行性',
    '平衡短期和长期目标',
    '与利益相关方对齐',
    '定期审查和调整'
  ],

  limitations: [
    '需要充分的产品上下文',
    '无法替代用户研究',
    '某些决策需要市场数据'
  ],

  dependencies: [
    'Read 工具（读取产品文档）',
    'analyst Agent（需求分析）'
  ],

  performance: {
    avgExecutionTime: '10-20分钟',
    complexity: 'high'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['product', 'management', 'roadmap', 'opus']
  }
};

export default productManagerAgent;

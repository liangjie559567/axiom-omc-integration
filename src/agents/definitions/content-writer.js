/**
 * Content Writer Agent 定义
 * 内容创作和文案专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const contentWriterAgent = {
  id: 'oh-my-claudecode:content-writer',
  name: 'content-writer',
  displayName: '内容创作者',
  description: '产品文案、营销内容和用户沟通的专业 Agent，使用 Sonnet 模型平衡内容质量和效率',

  type: AgentType.PRODUCT,
  lane: 'Product Lane',

  capabilities: [
    AgentCapability.TECHNICAL_WRITING
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['contentType', 'topic'],
    optional: ['audience', 'tone', 'guidelines', 'context'],
    schema: {
      contentType: {
        type: 'string',
        enum: ['product-copy', 'marketing', 'help-text', 'email', 'blog', 'social'],
        description: '内容类型'
      },
      topic: {
        type: 'string',
        description: '内容主题'
      },
      audience: {
        type: 'string',
        description: '目标受众'
      },
      tone: {
        type: 'string',
        enum: ['professional', 'casual', 'friendly', 'technical', 'persuasive'],
        description: '语气风格'
      },
      guidelines: {
        type: 'object',
        description: '内容指南'
      },
      context: {
        type: 'object',
        description: '产品和品牌上下文'
      }
    }
  },

  output: {
    type: 'content',
    schema: {
      content: {
        type: 'string',
        description: '内容文本'
      },
      variations: {
        type: 'array',
        description: '内容变体'
      },
      metadata: {
        type: 'object',
        description: '内容元数据（标题、描述、关键词）'
      },
      recommendations: {
        type: 'array',
        description: '内容优化建议'
      }
    }
  },

  useCases: [
    '编写产品文案',
    '创作营销内容',
    '编写帮助文本',
    '撰写用户邮件',
    '创作博客文章',
    '编写社交媒体内容',
    '优化现有内容'
  ],

  bestPractices: [
    '了解目标受众',
    '保持语气一致',
    '使用清晰简洁的语言',
    '关注用户价值',
    '遵循品牌指南',
    'A/B 测试不同版本'
  ],

  limitations: [
    '需要品牌和产品上下文',
    '无法替代专业文案',
    '某些内容需要创意专业知识'
  ],

  dependencies: [
    'product-manager Agent（产品信息）',
    'ux-researcher Agent（用户洞察）'
  ],

  performance: {
    avgExecutionTime: '3-6分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['content', 'writing', 'copywriting', 'sonnet']
  }
};

export default contentWriterAgent;

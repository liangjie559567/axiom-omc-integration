/**
 * Docs Specialist Agent 定义
 * 技术文档编写专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const docsSpecialistAgent = {
  id: 'oh-my-claudecode:docs-specialist',
  name: 'docs-specialist',
  displayName: '文档专家',
  description: '技术文档编写、API 文档和用户指南的专业 Agent，使用 Sonnet 模型平衡文档质量和效率',

  type: AgentType.DOMAIN_SPECIALIST,
  lane: 'Domain Specialists',

  capabilities: [
    AgentCapability.DOCUMENTATION,
    AgentCapability.TECHNICAL_WRITING
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['target', 'docType'],
    optional: ['code', 'audience', 'existingDocs'],
    schema: {
      target: {
        type: 'string',
        description: '文档目标（代码、API、功能等）'
      },
      docType: {
        type: 'string',
        enum: ['api', 'user-guide', 'tutorial', 'reference', 'architecture', 'readme'],
        description: '文档类型'
      },
      code: {
        type: 'string',
        description: '相关代码'
      },
      audience: {
        type: 'string',
        enum: ['developer', 'end-user', 'admin', 'mixed'],
        description: '目标受众'
      },
      existingDocs: {
        type: 'string',
        description: '现有文档'
      }
    }
  },

  output: {
    type: 'documentation',
    schema: {
      content: {
        type: 'string',
        description: '文档内容（Markdown）'
      },
      structure: {
        type: 'object',
        description: '文档结构'
      },
      examples: {
        type: 'array',
        description: '代码示例'
      },
      diagrams: {
        type: 'array',
        description: '图表描述'
      }
    }
  },

  useCases: [
    '编写 API 文档',
    '创建用户指南',
    '编写技术教程',
    '生成代码注释',
    '编写架构文档',
    '创建 README 文件',
    '更新现有文档'
  ],

  bestPractices: [
    '了解目标受众',
    '使用清晰的语言',
    '提供代码示例',
    '包含图表和可视化',
    '保持文档更新',
    '遵循文档标准'
  ],

  limitations: [
    '需要理解技术细节',
    '无法生成复杂图表',
    '某些内容需要领域知识'
  ],

  dependencies: [
    'Read 工具（读取代码）',
    'Write 工具（创建文档）'
  ],

  performance: {
    avgExecutionTime: '3-8分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['documentation', 'technical-writing', 'api-docs', 'sonnet']
  }
};

export default docsSpecialistAgent;

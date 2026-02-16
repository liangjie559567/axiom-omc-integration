/**
 * API Reviewer Agent 定义
 * API 设计和兼容性审查
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const apiReviewerAgent = {
  id: 'oh-my-claudecode:api-reviewer',
  name: 'api-reviewer',
  displayName: 'API 审查员',
  description: 'API 设计、契约和向后兼容性审查的专业 Agent，使用 Sonnet 模型确保 API 质量',

  type: AgentType.REVIEW,
  lane: 'Review Lane',

  capabilities: [
    AgentCapability.API_REVIEW,
    AgentCapability.CODE_REVIEW
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['apiDefinition'],
    optional: ['previousVersion', 'apiStandards', 'usagePatterns'],
    schema: {
      apiDefinition: {
        type: 'object',
        description: 'API 定义（接口、端点、参数、响应）'
      },
      previousVersion: {
        type: 'object',
        description: '之前的 API 版本（用于兼容性检查）'
      },
      apiStandards: {
        type: 'object',
        description: 'API 设计标准和规范'
      },
      usagePatterns: {
        type: 'array',
        description: '已知的使用模式'
      }
    }
  },

  output: {
    type: 'api-review-report',
    schema: {
      compatibilityIssues: {
        type: 'array',
        description: '兼容性问题',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['breaking', 'deprecated', 'warning'] },
            api: { type: 'string' },
            description: { type: 'string' },
            migration: { type: 'string' }
          }
        }
      },
      designIssues: {
        type: 'array',
        description: 'API 设计问题'
      },
      securityConcerns: {
        type: 'array',
        description: '安全相关问题'
      },
      documentationGaps: {
        type: 'array',
        description: '文档缺失'
      },
      recommendations: {
        type: 'array',
        description: '改进建议'
      },
      versioningStrategy: {
        type: 'string',
        description: '版本控制建议'
      }
    }
  },

  useCases: [
    '审查 REST API 设计',
    '检查 API 向后兼容性',
    '验证 API 契约一致性',
    '识别 API 安全问题',
    '评估 API 文档完整性',
    '制定 API 版本策略'
  ],

  bestPractices: [
    '提供完整的 API 定义和文档',
    '包含之前版本用于兼容性检查',
    '遵循 RESTful 或 GraphQL 最佳实践',
    '考虑 API 的使用场景',
    '制定清晰的版本控制策略'
  ],

  limitations: [
    '无法测试 API 的实际运行时行为',
    '需要明确的 API 标准作为参考',
    '某些兼容性问题需要实际使用数据'
  ],

  dependencies: [
    'Read 工具（读取 API 定义）',
    'Grep 工具（搜索 API 使用）'
  ],

  performance: {
    avgExecutionTime: '3-6分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['review', 'api', 'compatibility', 'sonnet']
  }
};

export default apiReviewerAgent;

/**
 * Quality Reviewer Agent 定义
 * 代码质量和可维护性审查
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const qualityReviewerAgent = {
  id: 'oh-my-claudecode:quality-reviewer',
  name: 'quality-reviewer',
  displayName: '代码质量审查员',
  description: '代码质量、可维护性和反模式识别的专业 Agent，使用 Sonnet 模型平衡审查深度和效率',

  type: AgentType.REVIEW,
  lane: 'Review Lane',

  capabilities: [
    AgentCapability.QUALITY_REVIEW,
    AgentCapability.CODE_REVIEW
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['code'],
    optional: ['context', 'qualityMetrics', 'previousReviews'],
    schema: {
      code: {
        type: 'string',
        description: '待审查的代码'
      },
      context: {
        type: 'object',
        description: '代码上下文（依赖、架构、设计模式）'
      },
      qualityMetrics: {
        type: 'object',
        description: '质量指标要求（复杂度、耦合度等）'
      },
      previousReviews: {
        type: 'array',
        description: '之前的审查记录'
      }
    }
  },

  output: {
    type: 'quality-review-report',
    schema: {
      qualityScore: {
        type: 'number',
        description: '质量评分（0-100）'
      },
      issues: {
        type: 'array',
        description: '质量问题列表',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            severity: { type: 'string' },
            location: { type: 'string' },
            description: { type: 'string' },
            suggestion: { type: 'string' },
            impact: { type: 'string' }
          }
        }
      },
      antiPatterns: {
        type: 'array',
        description: '识别的反模式'
      },
      maintainabilityIndex: {
        type: 'number',
        description: '可维护性指数'
      },
      recommendations: {
        type: 'array',
        description: '改进建议'
      }
    }
  },

  useCases: [
    '识别代码异味和反模式',
    '评估代码可维护性',
    '检查代码复杂度',
    '识别重复代码',
    '评估代码耦合度',
    '检查错误处理完整性'
  ],

  bestPractices: [
    '提供完整的代码上下文',
    '定义明确的质量标准',
    '关注高影响的质量问题',
    '结合静态分析工具的结果',
    '定期进行质量审查'
  ],

  limitations: [
    '需要足够的上下文理解代码意图',
    '某些质量问题需要运行时数据',
    '主观判断可能因项目而异'
  ],

  dependencies: [
    'Read 工具（读取相关代码）',
    'Grep 工具（搜索模式）'
  ],

  performance: {
    avgExecutionTime: '3-6分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['review', 'quality', 'maintainability', 'sonnet']
  }
};

export default qualityReviewerAgent;
